// Get Google Cloud access token using OAuth2 JWT flow (no external libraries needed)
async function getAccessToken() {
  try {
    // Parse service account credentials from environment variable
    // WORKAROUND: Netlify strips quotes from JSON env vars (known bug)
    const credentialsJson = process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON;
    
    if (!credentialsJson) {
      throw new Error('GOOGLE_APPLICATION_CREDENTIALS_JSON not configured');
    }

    let credentials;
    try {
      // First try normal JSON parse
      credentials = JSON.parse(credentialsJson);
    } catch (jsonError) {
      // Fallback: Use eval for Netlify's quote-stripping bug
      console.log('⚠️ JSON parse failed, using eval fallback');
      credentials = eval('(' + credentialsJson + ')');
    }

    if (!credentials || !credentials.private_key || !credentials.client_email) {
      throw new Error('Invalid credentials structure');
    }

    // Create JWT for OAuth2 token exchange
    const { createJWT } = await import('./utils/jwt.js');
    const jwt = createJWT(credentials);

    // Exchange JWT for access token
    const tokenEndpoint = 'https://oauth2.googleapis.com/token';
    const response = await fetch(tokenEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
        assertion: jwt,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ OAuth2 token exchange failed:', errorText);
      throw new Error(`Token exchange failed: ${response.status}`);
    }

    const data = await response.json();
    return data.access_token;
  } catch (error) {
    console.error('❌ Error getting access token:', error);
    throw new Error('Could not get access token: ' + error.message);
  }
}

export const handler = async (event, context) => {
  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
      },
      body: ''
    };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    console.log('🔵 Received generate-frame request:', {
      body: event.body?.substring(0, 200) + '...',
      headers: event.headers
    });

    const { description, frameIndex, storyboardId, aspectRatio, model: requestedModel } = JSON.parse(event.body);

    console.log('📦 Parsed request:', {
      frameIndex,
      storyboardId,
      aspectRatio,
      model: requestedModel,
      descriptionLength: description?.length
    });

    if (!description || typeof frameIndex !== 'number') {
      console.error('❌ Invalid request parameters');
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({
          error: 'Invalid request. Must include description and frameIndex'
        })
      };
    }

    // Map frontend model names to Google API model identifiers
    const modelMap = {
      'imagen3': 'imagegeneration@006',      // Imagen 3 (general scenes)
      'nano-banana': 'imagegeneration@006',  // Imagen 3 (character-optimized prompt)
      'auto': 'imagegeneration@006'          // Default to Imagen 3
    };

    const model = modelMap[requestedModel] || modelMap['auto'];
    console.log(`🎨 Frame ${frameIndex + 1}: Using model ${requestedModel || 'auto'} (${model})`);

    // Optimize prompt based on requested model type with better quality instructions
    let prompt = '';
    if (requestedModel === 'nano-banana') {
      prompt = `Create a high-quality, detailed character-focused storyboard frame. Focus on: facial expressions, emotions, character details, dramatic lighting. ${description}. Cinematic, professional quality, 4K resolution.`;
    } else {
      prompt = `Create a high-quality cinematic storyboard frame. ${description}. Professional quality, detailed, dramatic lighting, 4K resolution.`;
    }

    console.log(`📝 Frame ${frameIndex + 1} prompt (${requestedModel}): ${prompt.substring(0, 80)}...`);

    const endpoint = `https://us-central1-aiplatform.googleapis.com/v1/projects/${process.env.GOOGLE_PROJECT_ID}/locations/us-central1/publishers/google/models/${model}:predict`;

    // Map aspect ratio to parameters
    const aspectRatioMap = {
      '16:9': { aspectRatio: '16:9' },
      '1:1': { aspectRatio: '1:1' },
      '9:16': { aspectRatio: '9:16' },
      '4:3': { aspectRatio: '4:3' },
      '21:9': { aspectRatio: '16:9' } // 21:9 not supported, use 16:9
    };

    const body = {
      instances: [
        {
          prompt: prompt,
        },
      ],
      parameters: {
        sampleCount: 1,
        ...(aspectRatio && aspectRatioMap[aspectRatio] ? aspectRatioMap[aspectRatio] : {}),
        // Add quality parameters
        seed: Math.floor(Math.random() * 2147483647), // Random seed for variety
        language: 'en',
        addWatermark: false,
      },
    };

    // Retry logic - up to 3 attempts
    let attempts = 0;
    let lastError = null;

    while (attempts < 3) {
      attempts++;
      try {
        const accessToken = await getAccessToken();

        console.log(`🔧 Frame ${frameIndex + 1} - Attempt ${attempts}/3 - Calling Google Imagen API...`);
        const startTime = Date.now();

        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify(body),
        });

        const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);

        if (response.ok) {
          const data = await response.json();

          const imageBase64 = data?.predictions?.[0]?.bytesBase64Encoded;

          if (imageBase64) {
            console.log(`✅ Frame ${frameIndex + 1} generated successfully in ${elapsed}s (attempt ${attempts})`);
            // Success! Return frame object
            return {
              statusCode: 200,
              headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
              },
              body: JSON.stringify({
                success: true,
                frame: {
                  id: `frame_${storyboardId}_${frameIndex}`,
                  image_url: `data:image/png;base64,${imageBase64}`,
                  title: `Scene ${frameIndex + 1}`,
                  description: description,
                  status: 'completed'
                }
              })
            };
          } else {
            // API returned 200 but no image - might be rate limiting or temp issue
            const availableKeys = Object.keys(data || {}).join(', ');
            lastError = `No image in API response. Available keys: ${availableKeys}`;
            console.warn(`⚠️ Frame ${frameIndex + 1} attempt ${attempts}: ${lastError}`);
            if (attempts < 3) {
              console.log(`Retrying in 2 seconds...`);
              await new Promise(resolve => setTimeout(resolve, 2000));
              continue; // Try again
            }
          }
        } else {
          // API returned error status
          const errorText = await response.text();
          lastError = `API error ${response.status}: ${errorText}`;
          console.warn(`⚠️ Frame ${frameIndex + 1} attempt ${attempts} failed in ${elapsed}s: ${lastError}`);

          if (attempts < 3 && response.status >= 500) {
            // Retry on 5xx server errors
            console.log(`Retrying in 2 seconds...`);
            await new Promise(resolve => setTimeout(resolve, 2000));
            continue;
          } else if (response.status === 429) {
            // Rate limit - wait longer
            console.log(`Rate limited - waiting 5 seconds before retry...`);
            await new Promise(resolve => setTimeout(resolve, 5000));
            if (attempts < 3) continue;
          } else {
            // 4xx client errors don't retry
            break;
          }
        }
      } catch (fetchError) {
        lastError = fetchError.message;
        console.warn(`⚠️ Frame ${frameIndex + 1} attempt ${attempts} network error: ${lastError}`);
        if (attempts < 3) {
          console.log(`Retrying in 2 seconds...`);
          await new Promise(resolve => setTimeout(resolve, 2000));
          continue;
        }
      }
    }

    // All attempts failed
    console.error(`❌ Frame ${frameIndex + 1} failed after ${attempts} attempts. Last error: ${lastError}`);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        success: false,
        error: `Failed after ${attempts} attempts: ${lastError}`
      })
    };
  } catch (error) {
    console.error('Error in generate-frame:', error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        success: false,
        error: error.message
      })
    };
  }
};
