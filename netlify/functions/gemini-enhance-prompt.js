async function enhancePromptWithGemini(originalPrompt) {
  const apiKey = process.env.GOOGLE_API_KEY;

  if (!apiKey) {
    throw new Error('GOOGLE_API_KEY environment variable is required');
  }

  // Use Gemini Flash 2.5 for fast prompt enhancement
  const model = 'gemini-2.0-flash-exp';
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  const enhancementInstruction = `You are an expert prompt engineer for AI image generation. Your task is to enhance the following prompt to produce better, more detailed images from text-to-image models like Imagen.

Original prompt: "${originalPrompt}"

Please enhance this prompt by:
1. Adding specific visual details (colors, textures, materials)
2. Including artistic style references (e.g., "Studio Ghibli style", "photorealistic", "oil painting")
3. Specifying lighting and atmosphere (e.g., "soft warm lighting", "dramatic shadows")
4. Adding composition details (e.g., "centered composition", "wide-angle shot")
5. Including quality modifiers (e.g., "highly detailed", "professional", "8k resolution")

Keep the enhanced prompt concise but descriptive (100-200 words max). Maintain the original intent and subject. Focus on visual elements that will produce stunning images.

Return ONLY the enhanced prompt, nothing else.`;

  console.log('🎨 Enhancing prompt with Gemini Flash 2.5');
  console.log('Original:', originalPrompt.substring(0, 100) + '...');

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: enhancementInstruction
          }]
        }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 500,
          topP: 0.95,
        },
        safetySettings: [
          {
            category: 'HARM_CATEGORY_HARASSMENT',
            threshold: 'BLOCK_NONE'
          },
          {
            category: 'HARM_CATEGORY_HATE_SPEECH',
            threshold: 'BLOCK_NONE'
          },
          {
            category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
            threshold: 'BLOCK_NONE'
          },
          {
            category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
            threshold: 'BLOCK_NONE'
          }
        ]
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Gemini API error:', errorText);
      throw new Error(`Gemini API error: ${response.status} ${errorText}`);
    }

    const result = await response.json();

    if (!result.candidates || !result.candidates[0] || !result.candidates[0].content) {
      throw new Error('Invalid response from Gemini API');
    }

    const enhancedPrompt = result.candidates[0].content.parts[0].text.trim();

    console.log('✅ Prompt enhanced successfully');
    console.log('Enhanced:', enhancedPrompt.substring(0, 100) + '...');

    return enhancedPrompt;
  } catch (error) {
    console.error('❌ Prompt enhancement error:', error);
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
    console.log('🎨 Received prompt enhancement request');
    const requestBody = JSON.parse(event.body);
    const { prompt } = requestBody;

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

    console.log('📤 Enhancing prompt...');
    const enhancedPrompt = await enhancePromptWithGemini(prompt);
    console.log(`✅ Successfully enhanced prompt`);

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        success: true,
        originalPrompt: prompt,
        enhancedPrompt,
        model: 'gemini-2.0-flash-exp'
      })
    };
  } catch (error) {
    console.error('❌ Prompt enhancement error:', error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        success: false,
        error: error.message || 'Failed to enhance prompt'
      })
    };
  }
};
