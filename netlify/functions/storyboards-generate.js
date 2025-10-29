// Get Google Cloud access token using OAuth2 JWT flow (no external libraries needed)
async function getAccessToken() {
  try {
    // Parse service account credentials from environment variable
    const credentials = process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON
      ? JSON.parse(process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON)
      : null;

    if (!credentials) {
      throw new Error('GOOGLE_APPLICATION_CREDENTIALS_JSON not configured');
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
  const maxAttempts = 3;

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
        console.log(`🟦 Frame ${frameIndex + 1} API response received`);

        const imageBase64 = data?.predictions?.[0]?.bytesBase64Encoded;

        if (imageBase64) {
          return {
            id: `frame_${frameIndex + 1}`,
            image_url: `data:image/png;base64,${imageBase64}`,
            title: `Scene ${frameIndex + 1}`,
            description,
            success: true
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
          await new Promise(resolve => setTimeout(resolve, 2000));
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
        await new Promise(resolve => setTimeout(resolve, 2000));
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

    // Generate all frames sequentially to avoid rate limits
    const frames = [];
    for (let i = 0; i < plan.frames.length; i++) {
      const description = plan.frames[i]?.description || `Frame ${i + 1}`;
      const frame = await generateSingleFrame(description, i, accessToken);
      frames.push(frame);

      // Add a delay between frames to avoid rate limiting
      if (i < plan.frames.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    const storyboard = {
      storyboardId,
      frames,
      plan
    };

    // Log summary
    const successCount = frames.filter(f => f.success !== false).length;
    console.log(`✅ Storyboard generation complete: ${successCount}/7 frames successful`);

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
