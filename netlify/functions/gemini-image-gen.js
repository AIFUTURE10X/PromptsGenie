async function generateImagesWithGemini(prompt, count = 1, aspectRatio = '1:1', seed) {
  const model = 'imagen-3.0-generate-001'; // Gemini's image generation model
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:predict?key=${process.env.GOOGLE_API_KEY}`;

  console.log('🎨 Gemini Image Generation Request:', {
    prompt: prompt.substring(0, 100) + '...',
    count,
    aspectRatio,
    seed
  });

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

      // Extract image data from response
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
    const images = await generateImagesWithGemini(prompt, count, aspectRatio, seed);
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
