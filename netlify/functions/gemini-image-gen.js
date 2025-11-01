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
      // Wrap in try-catch to gracefully handle reference image processing errors
      let referenceImageProcessingFailed = false;

      if (referenceImages && referenceImages.length > 0) {
        console.log(`📥 Received ${referenceImages.length} reference image(s) from frontend`);

        try {

        instance.referenceImages = referenceImages
          .filter(ref => {
            // Filter out any reference images without valid image data
            if (!ref || !ref.imageData) {
              console.warn(`⚠️ Skipping null/undefined reference image`);
              return false;
            }

            if (typeof ref.imageData !== 'string') {
              console.warn(`⚠️ Skipping reference image ${ref.referenceId} - imageData is not a string (type: ${typeof ref.imageData})`);
              return false;
            }

            if (ref.imageData.trim().length === 0) {
              console.warn(`⚠️ Skipping reference image ${ref.referenceId} - empty imageData string`);
              return false;
            }

            return true;
          })
          .map(ref => {
            const refImage = {
              referenceId: ref.referenceId,
              referenceType: ref.referenceType,
            };

            // Add image data - remove data:image/... prefix if present
            const imageData = ref.imageData.includes(',')
              ? ref.imageData.split(',')[1]
              : ref.imageData;

            // Validate that we have actual base64 data
            if (!imageData || imageData.trim().length === 0) {
              throw new Error(`Reference image ${ref.referenceId} has empty image data after processing`);
            }

            // Validate base64 format (should only contain valid base64 characters)
            const base64Regex = /^[A-Za-z0-9+/=]+$/;
            if (!base64Regex.test(imageData.trim())) {
              console.warn(`⚠️ Reference image ${ref.referenceId} has invalid base64 format. First 100 chars: ${imageData.substring(0, 100)}`);
            }

            // CORRECTED: Google expects "referenceImage" not "image"
            refImage.referenceImage = {
              bytesBase64Encoded: imageData.trim()
            };

            console.log(`✅ Reference image ${ref.referenceId}: type=${ref.referenceType}, data_length=${imageData.length}`);

            // Add optional fields based on reference type
            // CORRECTED: Google expects nested config objects, not flat fields
            if (ref.referenceType === 'REFERENCE_TYPE_SUBJECT' && ref.subjectType) {
              refImage.subjectImageConfig = {
                subjectType: ref.subjectType
              };
            }
            if (ref.referenceType === 'REFERENCE_TYPE_STYLE' && ref.styleDescription) {
              refImage.styleImageConfig = {
                styleDescription: ref.styleDescription
              };
            }

            return refImage;
          });

        // CRITICAL: Final validation - ensure every reference image has a referenceImage field
        const invalidRefs = instance.referenceImages.filter(ref => !ref.referenceImage || !ref.referenceImage.bytesBase64Encoded);
        if (invalidRefs.length > 0) {
          console.error(`❌ CRITICAL: Found ${invalidRefs.length} reference images without referenceImage field!`);
          invalidRefs.forEach((ref, idx) => {
            console.error(`  Invalid ref ${idx}:`, {
              referenceId: ref.referenceId,
              referenceType: ref.referenceType,
              hasReferenceImage: !!ref.referenceImage,
              hasBytes: !!ref.referenceImage?.bytesBase64Encoded
            });
          });
          throw new Error(`Reference images validation failed: ${invalidRefs.length} images missing referenceImage field`);
        }

          // If all reference images were filtered out, don't include the field at all
          if (instance.referenceImages.length === 0) {
            console.log(`⚠️ All reference images were filtered out - removing referenceImages field`);
            delete instance.referenceImages;
          } else {
            console.log(`📸 Prepared ${instance.referenceImages.length} valid reference image(s) for API`);
          }

        } catch (refError) {
          console.error('❌ Reference image processing failed:', refError);
          console.error('❌ Error details:', refError.message, refError.stack);
          console.warn('⚠️ Falling back to standard Imagen 3 generation without reference images');

          // Set flag to use standard generation instead
          referenceImageProcessingFailed = true;

          // Ensure no partial referenceImages field exists
          delete instance.referenceImages;
        }
      }

      // If reference image processing failed, fall back to standard Imagen 3
      if (referenceImageProcessingFailed) {
        console.log('🔄 Using standard Imagen 3 generation (fallback mode)');

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

      // DEBUG: Log the exact structure being sent to API
      console.log('🔍 REQUEST BODY STRUCTURE:');
      console.log('  - instances count:', requestBody.instances.length);
      console.log('  - instance.prompt length:', requestBody.instances[0].prompt?.length || 0);
      console.log('  - instance.referenceImages:', requestBody.instances[0].referenceImages ? 'EXISTS' : 'MISSING');
      if (requestBody.instances[0].referenceImages) {
        console.log('  - referenceImages count:', requestBody.instances[0].referenceImages.length);
        requestBody.instances[0].referenceImages.forEach((ref, idx) => {
          console.log(`    [${idx}] referenceId: ${ref.referenceId}`);
          console.log(`    [${idx}] referenceType: ${ref.referenceType}`);
          console.log(`    [${idx}] referenceImage field: ${ref.referenceImage ? 'EXISTS' : 'MISSING'}`);
          if (ref.referenceImage) {
            console.log(`    [${idx}] referenceImage.bytesBase64Encoded length: ${ref.referenceImage.bytesBase64Encoded?.length || 0}`);
            console.log(`    [${idx}] referenceImage.bytesBase64Encoded preview: ${ref.referenceImage.bytesBase64Encoded?.substring(0, 50) || 'EMPTY'}...`);
          }
          if (ref.subjectImageConfig) console.log(`    [${idx}] subjectImageConfig:`, ref.subjectImageConfig);
          if (ref.styleImageConfig) console.log(`    [${idx}] styleImageConfig:`, ref.styleImageConfig);
        });
      }
      console.log('  - parameters:', JSON.stringify(requestBody.parameters));
      }
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

    // CRITICAL FINAL VALIDATION: Check requestBody BEFORE sending to API
    // This is the last line of defense to prevent "Reference image should have image field" error
    if (requestBody.instances[0].referenceImages && requestBody.instances[0].referenceImages.length > 0) {
      console.log(`🛡️ FINAL VALIDATION: Checking ${requestBody.instances[0].referenceImages.length} reference images before API call`);

      const invalidReferences = requestBody.instances[0].referenceImages.filter(ref => {
        const hasReferenceImageField = ref && ref.referenceImage && typeof ref.referenceImage === 'object';
        const hasBytesField = hasReferenceImageField && ref.referenceImage.bytesBase64Encoded && typeof ref.referenceImage.bytesBase64Encoded === 'string';
        const hasValidData = hasBytesField && ref.referenceImage.bytesBase64Encoded.length > 0;

        if (!hasValidData) {
          console.error(`❌ INVALID REFERENCE DETECTED:`, {
            referenceId: ref?.referenceId,
            hasReferenceImageField,
            hasBytesField,
            hasValidData,
            bytesLength: ref?.referenceImage?.bytesBase64Encoded?.length || 0
          });
          return true; // This reference is invalid
        }
        return false; // This reference is valid
      });

      if (invalidReferences.length > 0) {
        console.error(`🚨 CRITICAL: Found ${invalidReferences.length} invalid reference images at final validation!`);
        console.error('🚨 Removing ALL reference images to prevent API error');

        // Remove the entire referenceImages field to prevent API error
        delete requestBody.instances[0].referenceImages;
        console.log('✅ Reference images removed - request will proceed without customization');
      } else {
        console.log(`✅ All ${requestBody.instances[0].referenceImages.length} reference images passed final validation`);
      }
    }

    // Serialize and log the actual JSON being sent
    const requestBodyJSON = JSON.stringify(requestBody);
    console.log(`🌐 Request ${i + 1} JSON length:`, requestBodyJSON.length);

    // Verify the JSON can be parsed back correctly
    try {
      const parsed = JSON.parse(requestBodyJSON);
      if (parsed.instances[0].referenceImages) {
        console.log(`🔍 Parsed JSON has ${parsed.instances[0].referenceImages.length} reference images`);
        parsed.instances[0].referenceImages.forEach((ref, idx) => {
          if (!ref.referenceImage) {
            console.error(`❌ SERIALIZATION ERROR: Reference ${idx} lost referenceImage field during JSON.stringify!`);
          }
        });
      }
    } catch (e) {
      console.error(`❌ JSON parse error:`, e);
    }

    imagePromises.push(
      fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: requestBodyJSON
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

        // Try to parse error as JSON for better debugging
        let errorDetails;
        try {
          errorDetails = JSON.parse(errorText);
          console.error('❌ ERROR DETAILS (parsed):', JSON.stringify(errorDetails, null, 2));
        } catch (e) {
          console.error('❌ ERROR TEXT (raw):', errorText);
        }

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
