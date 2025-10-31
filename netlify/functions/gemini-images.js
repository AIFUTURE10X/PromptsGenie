async function callGeminiWithImages(prompt, imageDataUrls, model = 'gemini-2.5-flash', generationConfig = null) {
  const endpoint = `https://generativelanguage.googleapis.com/v1/models/${model}:generateContent?key=${process.env.GOOGLE_API_KEY}`;

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
        inlineData: {
          mimeType,
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
    const { prompt, imageDataUrls, model, generationConfig } = JSON.parse(event.body);

    console.log('🔧 Request params:', {
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
      body: JSON.stringify({ error: error.message })
    };
  }
};
