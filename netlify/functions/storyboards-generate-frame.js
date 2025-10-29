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
    const { description, frameIndex, storyboardId } = JSON.parse(event.body);

    if (!description || typeof frameIndex !== 'number') {
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

    const accessToken = await getAccessToken();

    console.log(`🔧 Generating frame ${frameIndex + 1}...`);

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
      console.log(`🟦 Gemini API response for frame ${frameIndex + 1}:`, JSON.stringify(data, null, 2));

      const imageBase64 = data?.predictions?.[0]?.bytesBase64Encoded;

      if (imageBase64) {
        // Return the base64 image data directly to client
        return {
          statusCode: 200,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          },
          body: JSON.stringify({
            success: true,
            frameIndex,
            imageData: `data:image/png;base64,${imageBase64}`,
            description
          })
        };
      } else {
        const availableKeys = Object.keys(data || {}).join(', ');
        const errorMessage = `Predictions not found in response. Available keys: ${availableKeys}`;
        console.error(errorMessage);
        return {
          statusCode: 500,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          },
          body: JSON.stringify({
            success: false,
            error: errorMessage
          })
        };
      }
    } else {
      const errorText = await response.text();
      console.error(`Image generation failed for frame ${frameIndex + 1} with status ${response.status}: ${errorText}`);
      return {
        statusCode: response.status,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({
          success: false,
          error: errorText
        })
      };
    }
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
