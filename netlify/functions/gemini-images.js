async function callGeminiWithImages(prompt, imageDataUrls, model = 'gemini-2.0-flash-exp', generationConfig = null) {
  // Use v1beta API instead of v1 for better model support
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${process.env.GOOGLE_API_KEY}`;

  console.log('🔧 Gemini Image API Call:', {
    model,
    promptLength: prompt.length,
    imageCount: imageDataUrls.length,
    generationConfig: generationConfig
  });

  // Validate prompt length (Gemini has input token limits)
  if (prompt.length > 2000) {
    console.warn('⚠️ Prompt is very long:', prompt.length, 'characters. This might cause issues.');
  }

  const parts = [
    { text: prompt },
    ...imageDataUrls.map(dataUrl => {
      const [header, base64] = dataUrl.split(',');
      const mimeType = header.replace('data:', '').replace(';base64', '');
      return {
        inline_data: {
          mime_type: mimeType,
          data: base64,
        },
      };
    }),
  ];

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      contents: [{ role: 'user', parts }],
      generationConfig: generationConfig || {
        temperature: 0.9,
        topP: 0.9,
        topK: 40,
        maxOutputTokens: 1000,
      },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`❌ Gemini image analysis ${response.status}:`, errorText);
    throw new Error(`Gemini image analysis ${response.status}: ${errorText}`);
  }

  const result = await response.json();

  // CRITICAL DEBUGGING: Log the actual API response structure
  console.log('📦 GEMINI API RAW RESPONSE:', JSON.stringify(result, null, 2));
  console.log('📦 Response candidates:', result?.candidates?.length);

  if (result?.candidates?.[0]) {
    const candidate = result.candidates[0];
    console.log('📦 First candidate keys:', Object.keys(candidate));
    console.log('📦 First candidate content:', JSON.stringify(candidate.content, null, 2));
    console.log('📦 First candidate finishReason:', candidate.finishReason);

    // Check for MAX_TOKENS error
    if (candidate.finishReason === 'MAX_TOKENS' && !candidate.content?.parts) {
      console.error('❌ MAX_TOKENS error - API stopped before generating content');
      console.error('   Prompt length:', prompt.length);
      console.error('   Max output tokens:', generationConfig?.maxOutputTokens);
      throw new Error('MAX_TOKENS: The API hit token limit before generating any content. Try reducing the prompt length or increasing maxOutputTokens.');
    }

    // Check if content.parts exists
    if (!candidate.content?.parts) {
      console.error('❌ Response has no content.parts!');
      console.error('   Full content:', JSON.stringify(candidate.content, null, 2));
      throw new Error('Invalid API response: content.parts is missing');
    }
  }

  return result;
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
    console.log('🔧 Received image analysis request');
    const requestBody = JSON.parse(event.body);

    // Configuration for each analyzer type (for new image analyzer component)
    const ANALYZER_CONFIG = {
      subject: {
        Fast: {
          instruction: 'Describe the subject in 20-40 words: appearance, clothing, pose, expression.',
          maxOutputTokens: 400,
          temperature: 0.3
        },
        Quality: {
          instruction: `Analyze the subject in extreme detail (80-120 words):
- FACIAL STRUCTURE: face shape, eye shape/color/spacing/size, eyebrow shape, nose shape/size/bridge, lip shape/fullness, jawline definition, cheekbone prominence, chin shape, forehead size
- SKIN: exact skin tone (use descriptive terms like porcelain, olive, deep brown, etc.), skin texture, complexion details, any visible marks or features
- HAIR: precise color (including highlights/tones), texture (straight/wavy/curly/coily), style, length, volume, hairline
- BODY: estimated height category (petite/average/tall), build type (slender/athletic/curvy/stocky), shoulder width, body proportions, posture and stance
- CLOTHING: detailed description with exact colors, patterns, fit, style, fabric appearance
- EXPRESSION: facial expression and emotional state
- POSE: body position and positioning
- DISTINCTIVE FEATURES: any unique characteristics, accessories, or identifying details
Focus on MEASURABLE, SPECIFIC details that preserve the subject's exact appearance and identity.`,
          maxOutputTokens: 1000,
          temperature: 0.4
        }
      },
      scene: {
        Fast: {
          instruction: 'Describe ONLY the environment in 15-30 words: location, lighting, atmosphere. IGNORE any people or characters - focus exclusively on the setting.',
          maxOutputTokens: 400,
          temperature: 0.3
        },
        Quality: {
          instruction: `Analyze the ENVIRONMENT ONLY in comprehensive detail (60-100 words). CRITICAL: IGNORE and DO NOT MENTION any people, characters, or subjects - describe ONLY the setting:
- LOCATION & SETTING: exact type of environment (indoor/outdoor, specific location type like office, park, street, etc.), spatial layout and depth
- ARCHITECTURE/LANDSCAPE: building structures, natural features, terrain, background elements, foreground objects
- LIGHTING: light source direction (front/back/side lit), quality (soft/harsh/diffused), color temperature (warm/cool/neutral), time of day indicators, shadows and highlights
- ATMOSPHERIC CONDITIONS: weather, sky appearance, air quality (clear/hazy/foggy), environmental mood
- KEY ELEMENTS: prominent objects, furniture, vegetation, props, structural features (NOT people)
- SPATIAL RELATIONSHIPS: positioning of elements, distance and depth cues, perspective and scale
- COLOR PALETTE: dominant colors in the environment, color harmonies, saturation levels
- ENVIRONMENTAL DETAILS: textures, materials, surfaces, patterns in the surroundings
Focus EXCLUSIVELY on the environment and setting. Do NOT describe people, faces, clothing, or characters.`,
          maxOutputTokens: 800,
          temperature: 0.4
        }
      },
      style: {
        Fast: {
          instruction: "Identify the style in 3-8 words. Example: 'anime style', 'photorealistic'.",
          maxOutputTokens: 400,
          temperature: 0.3
        },
        Quality: {
          instruction: 'Describe the style in 15-25 words: artistic approach, medium, visual characteristics.',
          maxOutputTokens: 500,
          temperature: 0.3
        }
      }
    };

    // Check if this is a new format request (with analyzerType and speedMode)
    if (requestBody.imageData && requestBody.analyzerType && requestBody.speedMode) {
      const { imageData, analyzerType, speedMode } = requestBody;

      console.log(`🔍 ${analyzerType.toUpperCase()} ANALYZER:`);
      console.log(`   Speed mode: ${speedMode}`);

      // Get configuration for this analyzer
      const config = ANALYZER_CONFIG[analyzerType][speedMode];
      console.log(`   Instruction: ${config.instruction}`);

      const imageDataUrl = `data:image/jpeg;base64,${imageData}`;

      console.log('📤 Sending request to Gemini API...');
      const result = await callGeminiWithImages(
        config.instruction,
        [imageDataUrl],
        'gemini-2.0-flash-exp',
        {
          maxOutputTokens: config.maxOutputTokens,
          temperature: config.temperature
        }
      );

      // Extract text from response
      const candidate = result.candidates?.[0];
      if (!candidate) {
        throw new Error('No response from Gemini API');
      }

      if (candidate.finishReason === 'MAX_TOKENS' && !candidate.content?.parts) {
        throw new Error('MAX_TOKENS: The API hit token limit before generating any content.');
      }

      const parts = candidate.content?.parts;
      if (!parts || !Array.isArray(parts)) {
        throw new Error('Invalid API response: content.parts is missing');
      }

      let prompt = '';
      for (const part of parts) {
        if (typeof part === 'string') {
          prompt += part;
        } else if (part.text) {
          prompt += part.text;
        } else if (part.Text) {
          prompt += part.Text;
        } else if (part.content) {
          prompt += part.content;
        }
      }

      prompt = prompt.trim();

      if (!prompt) {
        throw new Error('Failed to extract text from response');
      }

      console.log(`✅ Successfully generated ${analyzerType} prompt:`, prompt);

      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({
          success: true,
          prompt,
          details: {
            finishReason: candidate.finishReason,
            safetyRatings: candidate.safetyRatings
          }
        })
      };
    }

    // Legacy format support (for existing features)
    const { prompt, imageDataUrls, model, generationConfig } = requestBody;

    console.log('🔧 Request params (legacy format):', {
      promptLength: prompt?.length,
      imageCount: imageDataUrls?.length,
      model,
      generationConfig
    });

    if (!prompt || !imageDataUrls || !Array.isArray(imageDataUrls)) {
      console.log('❌ Invalid request parameters');
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({ error: 'Prompt and imageDataUrls array are required' })
      };
    }

    console.log('🔧 Calling Gemini API...');
    const result = await callGeminiWithImages(prompt, imageDataUrls, model, generationConfig);
    console.log('✅ Gemini API call successful');

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify(result)
    };
  } catch (error) {
    console.error('❌ Image analysis error:', error);
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
