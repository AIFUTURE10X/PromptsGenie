const { GoogleAuth } = require('google-auth-library');

async function generateImagesWithVertexAI(prompt, count = 1, aspectRatio = '1:1', seed, forceImagen2 = false, referenceImages = []) {
  // Vertex AI Imagen endpoint configuration
  const projectId = process.env.GOOGLE_CLOUD_PROJECT_ID;
  const location = process.env.GOOGLE_CLOUD_LOCATION || 'us-central1';

  if (!projectId) {
    console.error('❌ GOOGLE_CLOUD_PROJECT_ID environment variable is required');
    throw new Error('GOOGLE_CLOUD_PROJECT_ID environment variable is required for Vertex AI');
  }

  console.log('🎨 Vertex AI Image Generation Request:', {
    prompt: prompt.substring(0, 100) + '...',
    count,
    aspectRatio,
    seed,
    projectId,
    location,
    forceImagen2
  });

  // Initialize Google Auth with service account credentials
  let accessToken;
  try {
    const credentialsJSON = process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON;

    if (!credentialsJSON) {
      throw new Error('GOOGLE_APPLICATION_CREDENTIALS_JSON environment variable is required');
    }

    let credentials;
    try {
      credentials = JSON.parse(credentialsJSON);
    } catch (parseError) {
      console.error('❌ Failed to parse service account credentials:', parseError.message);
      throw new Error(`Invalid JSON in GOOGLE_APPLICATION_CREDENTIALS_JSON: ${parseError.message}`);
    }

    const auth = new GoogleAuth({
      credentials: credentials,
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

  // Vertex AI Imagen endpoint
  // Try Imagen 3 for better quality, fallback to Imagen 2 if quota exceeded or forced
  // Note: Imagen 3 needs ~15-25s, may require Netlify Pro for 26s timeout
  const useImagen3 = !forceImagen2 && process.env.USE_IMAGEN_3 !== 'false'; // Default to true unless forced or disabled
  const useCustomization = referenceImages && referenceImages.length > 0;

  // Use capability model when customization (reference images) is needed
  const modelVersion = useImagen3
    ? (useCustomization ? 'imagen-3.0-capability-001' : 'imagen-3.0-generate-001')
    : 'imagegeneration@006';

  const endpoint = `https://${location}-aiplatform.googleapis.com/v1/projects/${projectId}/locations/${location}/publishers/google/models/${modelVersion}:predict`;

  console.log(`🎨 Using model: ${modelVersion} (Imagen ${useImagen3 ? '3' : '2'}${forceImagen2 ? ' - FALLBACK MODE' : ''}${useCustomization ? ' - WITH CUSTOMIZATION' : ''})`);

  // Map aspect ratios to Imagen format (only Imagen-supported ratios)
  const aspectRatioMap = {
    '1:1': '1:1',
    '16:9': '16:9',
    '9:16': '9:16',
    '4:3': '4:3',
    '3:4': '3:4'
  };

  const imagePromises = [];

  for (let i = 0; i < count; i++) {
    // Imagen 2 and Imagen 3 have slightly different request formats
    let requestBody;

    if (useCustomization && useImagen3) {
      // Imagen 3 Capability model format with reference images
      const instance = {
        prompt: prompt,
      };

      // Add reference images to instance
      if (referenceImages && referenceImages.length > 0) {
        instance.referenceImages = referenceImages.map(ref => {
          const refImage = {
            referenceId: ref.referenceId,
            referenceType: ref.referenceType,
          };

          // Add image data - remove data:image/... prefix if present
          const imageData = ref.imageData.includes(',')
            ? ref.imageData.split(',')[1]
            : ref.imageData;
          refImage.bytesBase64Encoded = imageData;

          // Add optional fields based on reference type
          if (ref.referenceType === 'REFERENCE_TYPE_SUBJECT' && ref.subjectType) {
            refImage.subjectType = ref.subjectType;
          }
          if (ref.referenceType === 'REFERENCE_TYPE_STYLE' && ref.styleDescription) {
            refImage.styleDescription = ref.styleDescription;
          }

          return refImage;
        });
      }

      requestBody = {
        instances: [instance],
        parameters: {
          sampleCount: 1,
          aspectRatio: aspectRatioMap[aspectRatio] || '1:1',
          safetyFilterLevel: 'block_only_high',
          personGeneration: 'allow_adult',
          languageCode: 'en',
          addWatermark: false
        }
      };
    } else if (useImagen3) {
      // Standard Imagen 3 generate model format (no customization)
      requestBody = {
        instances: [{
          prompt: prompt,
        }],
        parameters: {
          sampleCount: 1,
          aspectRatio: aspectRatioMap[aspectRatio] || '1:1',
          safetyFilterLevel: 'block_only_high',
          personGeneration: 'allow_adult',
          languageCode: 'en',
          addWatermark: false
        }
      };
    } else {
      // Imagen 2 format (fallback)
      requestBody = {
        instances: [{
          prompt: prompt,
        }],
        parameters: {
          sampleCount: 1,
          aspectRatio: aspectRatioMap[aspectRatio] || '1:1',
          safetyFilterLevel: 'block_only_high',
          languageCode: 'en'
        }
      };
    }

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
      // Imagen 3 uses 'bytesBase64Encoded', Imagen 2 uses 'bytesBase64Encoded' or 'image'
      if (result.predictions && result.predictions[0]) {
        const prediction = result.predictions[0];
        const imageData = prediction.bytesBase64Encoded || prediction.image;

        if (!imageData) {
          console.error('No image data in response:', JSON.stringify(result).substring(0, 200));
          throw new Error('No image data returned from API');
        }

        images.push({
          index: i,
          imageData: imageData,
          mimeType: prediction.mimeType || 'image/png'
        });
      } else {
        console.error('Invalid response structure:', JSON.stringify(result).substring(0, 200));
        throw new Error('Invalid response from Vertex AI');
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
    const { prompt, count = 1, aspectRatio = '1:1', seed, referenceImages = [] } = requestBody;

    if (referenceImages && referenceImages.length > 0) {
      console.log(`📸 Using ${referenceImages.length} reference image(s) for customization`);
      referenceImages.forEach((ref, idx) => {
        console.log(`  ${idx + 1}. ${ref.referenceType} (ID: ${ref.referenceId})`);
      });
    }

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
    let images;
    let usedFallback = false;

    try {
      images = await generateImagesWithVertexAI(prompt, count, aspectRatio, seed, false, referenceImages);
      console.log(`✅ Successfully generated ${images.length} images with Imagen 3`);
    } catch (imagen3Error) {
      // Check if this is a quota error (429)
      const isQuotaError = imagen3Error.message && (
        imagen3Error.message.includes('429') ||
        imagen3Error.message.includes('RESOURCE_EXHAUSTED') ||
        imagen3Error.message.includes('Quota exceeded')
      );

      if (isQuotaError) {
        console.warn('⚠️ Imagen 3 quota exceeded, falling back to Imagen 2...');
        // Retry with Imagen 2 (note: Imagen 2 doesn't support customization)
        try {
          images = await generateImagesWithVertexAI(prompt, count, aspectRatio, seed, true, []);
          usedFallback = true;
          console.log(`✅ Successfully generated ${images.length} images with Imagen 2 (fallback)`);
        } catch (imagen2Error) {
          console.error('❌ Imagen 2 fallback also failed:', imagen2Error);
          throw imagen2Error;
        }
      } else {
        // Not a quota error, throw the original error
        throw imagen3Error;
      }
    }

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
        prompt: prompt.substring(0, 200), // Return truncated prompt for reference
        modelUsed: usedFallback ? 'Imagen 2 (fallback due to Imagen 3 quota)' : 'Imagen 3',
        fallbackUsed: usedFallback
      })
    };
  } catch (error) {
    console.error('❌ Image generation error:', error);

    // Provide user-friendly error messages
    let userMessage = error.message || 'Failed to generate images';

    // Check for specific error types and provide helpful messages
    if (error.message && error.message.includes('RESOURCE_EXHAUSTED')) {
      userMessage = 'Image generation quota exceeded. Both Imagen 3 and Imagen 2 quotas have been exhausted. Please try again later or request a quota increase from Google Cloud.';
    } else if (error.message && error.message.includes('429')) {
      userMessage = 'Rate limit exceeded. Please wait a moment and try again.';
    } else if (error.message && error.message.includes('Authentication failed')) {
      userMessage = 'Authentication error. Please check your Google Cloud credentials.';
    } else if (error.message && error.message.includes('timeout')) {
      userMessage = 'Image generation timed out. This may happen with Imagen 3 on free-tier hosting. Try again or contact support.';
    }

    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        success: false,
        error: userMessage,
        technicalError: error.message // Include technical details for debugging
      })
    };
  }
};
