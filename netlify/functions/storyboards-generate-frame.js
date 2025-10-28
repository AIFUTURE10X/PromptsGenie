import { GoogleAuth } from 'google-auth-library';

async function getAccessToken() {
  try {
    // Parse the credentials from environment variable (stored as JSON string in Netlify)
    const credentials = process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON
      ? JSON.parse(process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON)
      : null;

    if (!credentials) {
      throw new Error('GOOGLE_APPLICATION_CREDENTIALS_JSON not configured');
    }

    const auth = new GoogleAuth({
      credentials,
      scopes: 'https://www.googleapis.com/auth/cloud-platform'
    });

    const client = await auth.getClient();
    const accessToken = await client.getAccessToken();
    return accessToken.token;
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
