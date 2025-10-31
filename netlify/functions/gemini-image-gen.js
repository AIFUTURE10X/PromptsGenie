const { GoogleAuth } = require('google-auth-library');

async function generateImagesWithVertexAI(prompt, count = 1, aspectRatio = '1:1', seed) {
  // Vertex AI Imagen 3 endpoint
  const projectId = process.env.GOOGLE_CLOUD_PROJECT_ID;
  const location = process.env.GOOGLE_CLOUD_LOCATION || 'us-central1';

  if (!projectId) {
    throw new Error('GOOGLE_CLOUD_PROJECT_ID environment variable is required for Vertex AI');
  }

  console.log('🎨 Vertex AI Image Generation Request:', {
    prompt: prompt.substring(0, 100) + '...',
    count,
    aspectRatio,
    seed,
    projectId,
    location
  });

  // Initialize Google Auth with service account credentials
  let accessToken;
  try {
    const credentialsJSON = process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON;

    if (!credentialsJSON) {
      throw new Error('GOOGLE_APPLICATION_CREDENTIALS_JSON environment variable is required');
    }

    const auth = new GoogleAuth({
      credentials: JSON.parse(credentialsJSON),
      scopes: ['https://www.googleapis.com/auth/cloud-platform'],
    });

    const client = await auth.getClient();
    const token = await client.getAccessToken();
    accessToken = token.token;

    console.log('✅ Successfully obtained OAuth access token');
  } catch (authError) {
    console.error('❌ Authentication failed:', authError.message);
    throw new Error(`Authentication failed: ${authError.message}`);
  }

  // Vertex AI Imagen 3 endpoint
  const endpoint = `https://${location}-aiplatform.googleapis.com/v1/projects/${projectId}/locations/${location}/publishers/google/models/imagen-3.0-generate-001:predict`;

  // Map aspect ratios to Imagen format
  const aspectRatioMap = {
    '1:1': '1:1',
    '16:9': '16:9',
    '9:16': '9:16',
    '4:3': '4:3',
    '3:4': '3:4',
    '21:9': '21:9'
  };

  const imagePromises = [];

  for (let i = 0; i < count; i++) {
    const requestBody = {
      instances: [{
        prompt: prompt,
      }],
      parameters: {
        sampleCount: 1,
        aspectRatio: aspectRatioMap[aspectRatio] || '1:1',
        safetyFilterLevel: 'block_some',
        personGeneration: 'allow_adult'
      }
    };

    // Add seed if provided (for reproducibility)
    if (seed !== undefined && seed !== null) {
      requestBody.parameters.seed = seed + i;
    }

    imagePromises.push(
      fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify(requestBody)
      })
    );
  }

  try {
    const responses = await Promise.all(imagePromises);
    const images = [];

    for (let i = 0; i < responses.length; i++) {
      const response = responses[i];

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ Image ${i + 1} generation failed (${response.status}):`, errorText);
        throw new Error(`Image generation failed: ${response.status} ${errorText}`);
      }

      const result = await response.json();
      console.log(`✅ Image ${i + 1} generated successfully`);

      // Extract image data from Vertex AI response
      if (result.predictions && result.predictions[0]) {
        images.push({
          index: i,
          imageData: result.predictions[0].bytesBase64Encoded || result.predictions[0].image,
          mimeType: result.predictions[0].mimeType || 'image/png'
        });
      }
    }

    return images;
  } catch (error) {
    console.error('❌ Batch image generation error:', error);
    throw error;
  }
}

exports.handler = async (event, context) => {
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
    console.log('🎨 Received image generation request');
    const requestBody = JSON.parse(event.body);
    const { prompt, count = 1, aspectRatio = '1:1', seed } = requestBody;

    if (!prompt || prompt.trim().length === 0) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({
          success: false,
          error: 'Prompt is required'
        })
      };
    }

    if (count < 1 || count > 4) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({
          success: false,
          error: 'Count must be between 1 and 4'
        })
      };
    }

    console.log('📤 Generating images...');
    const images = await generateImagesWithVertexAI(prompt, count, aspectRatio, seed);
    console.log(`✅ Successfully generated ${images.length} images`);

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        success: true,
        images,
        count: images.length,
        aspectRatio,
        prompt: prompt.substring(0, 200) // Return truncated prompt for reference
      })
    };
  } catch (error) {
    console.error('❌ Image generation error:', error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        success: false,
        error: error.message || 'Failed to generate images'
      })
    };
  }
};
