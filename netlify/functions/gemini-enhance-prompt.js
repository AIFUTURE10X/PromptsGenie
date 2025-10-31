async function enhancePromptWithGemini(originalPrompt, subjectPrompt, scenePrompt, stylePrompt, styleIntensity = 'moderate') {
  const apiKey = process.env.GOOGLE_API_KEY;

  if (!apiKey) {
    throw new Error('GOOGLE_API_KEY environment variable is required');
  }

  // Use Gemini Flash 2.5 for fast prompt enhancement
  const model = 'gemini-2.0-flash-exp';
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  // Build structured instruction based on available components
  let enhancementInstruction;

  if (subjectPrompt || scenePrompt || stylePrompt) {
    // We have structured components - use advanced enhancement
    const components = [];
    if (subjectPrompt) components.push(`SUBJECT (critical priority - preserve exactly): ${subjectPrompt}`);
    if (scenePrompt) components.push(`SCENE (critical priority - recreate exactly): ${scenePrompt}`);
    if (stylePrompt) {
      // Add style intensity guidance
      const intensityNote = {
        subtle: ' (apply as SUBTLE aesthetic hints only - photorealistic base required)',
        moderate: ' (balance style with realism - render subject and scene realistically in style)',
        strong: ' (full artistic interpretation allowed - style takes priority)'
      }[styleIntensity] || '';
      components.push(`STYLE (apply without distorting subject or scene${intensityNote}): ${stylePrompt}`);
    }

    enhancementInstruction = `You are an expert prompt engineer for AI image generation (Imagen 3). Create an enhanced prompt from these components:

${components.join('\n')}

CRITICAL RULES - SUBJECT & SCENE PRESERVATION:
1. **SUBJECT INTEGRITY**: The subject's anatomical features, proportions, and identity MUST remain EXACTLY as described - no alterations, no artistic interpretation
2. **SCENE ACCURACY**: The scene/environment MUST be recreated EXACTLY as described - location, lighting, spatial layout, atmospheric conditions, and all environmental details are mandatory
3. **HIERARCHY**: Subject = Scene > Style. Style should enhance the presentation, NEVER modify the subject's physical appearance OR the scene's environmental characteristics
4. **SEPARATION**: Keep subject description complete, integrate scene details as critical environment, then apply style ONLY to rendering technique
5. **ANATOMICAL & ENVIRONMENTAL ACCURACY**: Preserve facial features, body proportions, realistic human anatomy AND preserve lighting direction, spatial relationships, environmental elements exactly as specified
6. **STYLE APPLICATION**: Apply style ONLY to: artistic medium/rendering technique, color grading, visual treatment - NEVER to subject anatomy OR scene composition/layout

MANDATORY PRESERVATION PHRASES:
SUBJECT:
- Include "maintaining exact facial proportions and features"
- Include "preserving realistic human anatomy and body structure"
- Include "keeping subject's physical appearance unchanged"
- Add "photorealistic rendering of subject" before any artistic style modifiers

SCENE:
- Include "recreating the exact lighting conditions and direction"
- Include "preserving the spatial layout and environmental composition"
- Include "maintaining the specified location and atmospheric conditions"
- Add "accurate environmental details as described" to ensure scene fidelity

AVOID (Negative Prompt Simulation):
SUBJECT: distorted anatomy, unrealistic proportions, exaggerated facial features, anime-style eyes (unless explicitly requested), stylized body shapes, altered facial structure, morphed features
SCENE: wrong lighting direction, altered spatial relationships, changed environmental layout, incorrect atmospheric conditions, missing key scene elements, modified location type

STYLE INTENSITY RULES (currently set to: ${styleIntensity.toUpperCase()}):
${styleIntensity === 'subtle' ? `- Add "photorealistic rendering with subtle [style] aesthetic"
- Apply style ONLY to color palette, lighting mood, and minimal artistic flourishes
- Emphasize "maintaining photorealistic subject accuracy"
- Keep subject completely realistic and anatomically accurate` : ''}${styleIntensity === 'moderate' ? `- Add "rendered in [style], maintaining realistic subject proportions"
- Apply style to lighting, atmosphere, color grading, and artistic medium
- Balance artistic interpretation with anatomical accuracy
- Phrase as "realistically depicted in [style] aesthetic"` : ''}${styleIntensity === 'strong' ? `- Add "full [style] artistic interpretation"
- Allow style to influence overall composition and rendering
- Still preserve core subject identity and basic proportions
- Phrase as "artistic [style] rendering" or "complete [style] stylization"` : ''}

Enhance the prompt by:
- Making subject details more specific and visually descriptive (without changing any core features)
- Making scene details more specific and spatially accurate (without changing environmental characteristics)
- Ensuring lighting, atmosphere, and spatial layout from scene are explicitly stated
- Applying style as appropriate for ${styleIntensity} intensity level
- Including quality modifiers (highly detailed, professional quality, 8k resolution, sharp focus)
- Specifying composition that honors the scene's spatial relationships
- Integrating all scene elements (location, lighting, atmosphere) as mandatory requirements

Structure the enhanced prompt as: [Subject details with preservation phrases] positioned in [Complete scene environment with lighting/spatial/atmospheric details], [Style treatment applied only to rendering technique], [Quality/composition modifiers]

Keep it concise (120-200 words max). Return ONLY the enhanced prompt, nothing else.`;
  } else {
    // Fallback to simple enhancement if no structure provided
    enhancementInstruction = `You are an expert prompt engineer for AI image generation. Your task is to enhance the following prompt to produce better, more detailed images from text-to-image models like Imagen.

Original prompt: "${originalPrompt}"

Please enhance this prompt by:
1. Adding specific visual details (colors, textures, materials)
2. Including artistic style references (e.g., "Studio Ghibli style", "photorealistic", "oil painting")
3. Specifying lighting and atmosphere (e.g., "soft warm lighting", "dramatic shadows")
4. Adding composition details (e.g., "centered composition", "wide-angle shot")
5. Including quality modifiers (e.g., "highly detailed", "professional", "8k resolution")

Keep the enhanced prompt concise but descriptive (100-200 words max). Maintain the original intent and subject. Focus on visual elements that will produce stunning images.

Return ONLY the enhanced prompt, nothing else.`;
  }

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
          temperature: 0.5,
          maxOutputTokens: 600,
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
    const { prompt, subjectPrompt, scenePrompt, stylePrompt, styleIntensity } = requestBody;

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
    if (subjectPrompt || scenePrompt || stylePrompt) {
      console.log('📋 Using structured prompt components:');
      if (subjectPrompt) console.log('  - Subject:', subjectPrompt.substring(0, 50) + '...');
      if (scenePrompt) console.log('  - Scene:', scenePrompt.substring(0, 50) + '...');
      if (stylePrompt) console.log('  - Style:', stylePrompt.substring(0, 50) + '...');
      if (styleIntensity) console.log('  - Style Intensity:', styleIntensity);
    }
    const enhancedPrompt = await enhancePromptWithGemini(prompt, subjectPrompt, scenePrompt, stylePrompt, styleIntensity);
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
