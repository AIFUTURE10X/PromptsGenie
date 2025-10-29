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
      // First try normal JSON parse (in case Netlify fixes their bug)
      credentials = JSON.parse(credentialsJson);
    } catch (jsonError) {
      // If that fails, it's likely Netlify's quote-stripping bug
      // Use eval in a controlled way to parse JavaScript object literal
      console.log('⚠️ JSON parse failed, using eval fallback for Netlify bug');
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

    const responseText = await response.text();
    
    if (!response.ok) {
      console.error('❌ OAuth2 token exchange failed:', {
        status: response.status,
        statusText: response.statusText,
        body: responseText
      });
      throw new Error(`Token exchange failed: ${response.status} - ${responseText}`);
    }

    let data;
    try {
      data = JSON.parse(responseText);
    } catch (parseError) {
      console.error('❌ Failed to parse OAuth2 response:', {
        parseError: parseError.message,
        responseText: responseText.substring(0, 200)
      });
      throw new Error(`Invalid OAuth2 response: ${parseError.message}`);
    }

    if (!data.access_token) {
      console.error('❌ No access_token in response:', data);
      throw new Error('OAuth2 response missing access_token');
    }

    return data.access_token;
  } catch (error) {
    console.error('❌ Error getting access token:', error);
    throw new Error('Could not get access token: ' + error.message);
  }
}

async function generateSingleFrame(description, frameIndex, accessToken) {
  const model = 'imagegeneration@006';
  const prompt = `Generate a cinematic storyboard frame: ${description}`;
  const endpoint = `https://us-central1-aiplatform.googleapis.com/v1/projects/${process.env.GOOGLE_PROJECT_ID}/locations/us-central1/publishers/google/models/${model}:predict`;

  const body = {
    instances: [
      {
        prompt: prompt,
      },
    ],
    parameters: {
      sampleCount: 1,
    },
  };

  console.log(`🔧 Generating frame ${frameIndex + 1}...`);

  let attempts = 0;
  const maxAttempts = 2; // Reduced from 3 to avoid timeout

  while (attempts < maxAttempts) {
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(body),
      });

      if (response.ok) {
        const data = await response.json();
        console.log(`✅ Frame ${frameIndex + 1} generated successfully`);

        const imageBase64 = data?.predictions?.[0]?.bytesBase64Encoded;

        if (imageBase64) {
          // Instead of returning full base64, return a URL reference
          // Frontend will need to fetch this separately or we store it
          return {
            id: `frame_${frameIndex + 1}`,
            image_data: imageBase64, // Keep for now, will optimize in next iteration
            image_url: `data:image/png;base64,${imageBase64.substring(0, 100)}...`, // Truncated preview
            title: `Scene ${frameIndex + 1}`,
            description,
            success: true,
            size: imageBase64.length
          };
        } else {
          const availableKeys = Object.keys(data || {}).join(', ');
          const errorMessage = `Predictions not found in response. Available keys: ${availableKeys}`;
          console.error(`Frame ${frameIndex + 1} error:`, errorMessage);

          // Don't retry if data structure is wrong
          return {
            id: `frame_${frameIndex + 1}`,
            image_url: `https://dummyimage.com/512x288/333/fff&text=Error+Frame+${frameIndex + 1}`,
            title: `Scene ${frameIndex + 1}`,
            description,
            success: false,
            error: errorMessage
          };
        }
      } else {
        const errorText = await response.text();
        console.error(`Frame ${frameIndex + 1} failed with status ${response.status}: ${errorText}`);

        // Retry on server errors
        if (response.status >= 500 && attempts < maxAttempts - 1) {
          attempts++;
          console.log(`Retrying frame ${frameIndex + 1}, attempt ${attempts + 1}...`);
          await new Promise(resolve => setTimeout(resolve, 500)); // Reduced from 2000ms
          continue;
        }

        return {
          id: `frame_${frameIndex + 1}`,
          image_url: `https://dummyimage.com/512x288/333/fff&text=Error+Frame+${frameIndex + 1}`,
          title: `Scene ${frameIndex + 1}`,
          description,
          success: false,
          error: errorText
        };
      }
    } catch (error) {
      console.error(`Error generating frame ${frameIndex + 1}:`, error);

      // Retry on network errors
      if (attempts < maxAttempts - 1) {
        attempts++;
        console.log(`Retrying frame ${frameIndex + 1} after error, attempt ${attempts + 1}...`);
        await new Promise(resolve => setTimeout(resolve, 500)); // Reduced from 2000ms
        continue;
      }

      return {
        id: `frame_${frameIndex + 1}`,
        image_url: `https://dummyimage.com/512x288/333/fff&text=Error+Frame+${frameIndex + 1}`,
        title: `Scene ${frameIndex + 1}`,
        description,
        success: false,
        error: error.message
      };
    }
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

  console.log('🎬 Storyboard generation request received');

  try {
    const { storyboardId, plan } = JSON.parse(event.body);

    // Validate input
    if (!storyboardId || !plan || !Array.isArray(plan.frames) || plan.frames.length !== 7) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({
          error: 'Invalid storyboard plan. Must include storyboardId and 7 frames.'
        })
      };
    }

    console.log(`🎬 Generating storyboard ${storyboardId} with 7 frames...`);

    // Get access token once for all frames
    const accessToken = await getAccessToken();

    // DON'T generate all frames here - just return success with frame metadata
    // Frontend will call /storyboards/generate-frame for each frame individually
    // This avoids the 6MB response limit
    
    const frames = plan.frames.map((frameData, idx) => ({
      id: `frame_${idx + 1}`,
      title: `Scene ${idx + 1}`,
      description: frameData?.description || `Frame ${idx + 1}`,
      image_url: null, // Will be populated by individual frame generation
      status: 'pending'
    }));

    const storyboard = {
      storyboardId,
      frames,
      plan,
      message: 'Storyboard plan created. Use /storyboards/generate-frame to generate each image individually.'
    };
    
    console.log(`✅ Storyboard metadata created with ${frames.length} frames`);

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify(storyboard)
    };

  } catch (error) {
    console.error('❌ Storyboard generation failed:', error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        error: error.message
      })
    };
  }
};
