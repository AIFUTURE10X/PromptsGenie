async function enhancePromptWithGemini(originalPrompt, subjectPrompt, scenePrompt, stylePrompt, styleIntensity = 'moderate', preciseReference = false) {
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

${preciseReference ? `
**PRECISE REFERENCE MODE ACTIVE**
You MUST use the uploaded image analysis EXACTLY as provided. Minimize creative interpretation and enhancement:
- Use the analyzed details verbatim without adding creative flourishes
- Do NOT add speculative details not explicitly mentioned in the analysis
- Prioritize pixel-perfect reproduction over artistic interpretation
- Keep enhancements minimal - focus on quality and technical terms only
- This is for precise output matching the uploaded reference images
` : ''}

CRITICAL RULES - SCENE IS THE FOUNDATION:
1. **SCENE COMES FIRST**: The scene/environment establishes the FOUNDATION and CONTEXT for everything else. It MUST be described FIRST and in complete detail.
2. **SCENE IS NON-NEGOTIABLE**: Every scene element is MANDATORY - location type, lighting direction, lighting quality, lighting color, atmospheric conditions, weather, time of day, spatial layout, background elements, foreground elements, environmental colors, and textures.
3. **SCENE ACCURACY OVER EVERYTHING**: The scene/environment MUST be recreated EXACTLY as described - location, lighting, spatial layout, atmospheric conditions, and all environmental details are ABSOLUTE REQUIREMENTS
4. **LIGHTING IS CRITICAL**: Lighting direction (front-lit, back-lit, side-lit), lighting quality (soft, harsh, diffused), and lighting color temperature (warm, cool, neutral) must be stated explicitly and repeated for emphasis
5. **NO SCENE SUBSTITUTION**: Do NOT replace, modify, or "improve" the scene. Use the exact location type, exact lighting conditions, exact atmospheric details provided.
6. **SUBJECT INTEGRITY**: The subject's anatomical features, proportions, and identity MUST remain EXACTLY as described - no alterations, no artistic interpretation
7. **HIERARCHY**: Scene = Subject > Style. The scene establishes the environment, the subject exists within it, and style only affects rendering technique
8. **SEPARATION**: Start with complete scene/environment description, then add subject within that environment, then apply style ONLY to rendering technique
9. **STYLE APPLICATION**: Apply style ONLY to: artistic medium/rendering technique, color grading, visual treatment - NEVER to scene environment OR subject anatomy

MANDATORY PRESERVATION PHRASES - SCENE MUST COME FIRST:
SCENE (START THE PROMPT WITH THESE):
- Begin with the exact location type from the scene analysis
- Include "with [exact lighting direction] lighting" (e.g., "with front lighting", "with back lighting", "with side lighting")
- Include "under [atmospheric condition]" (e.g., "under clear skies", "in foggy conditions", "during golden hour")
- Include "[lighting quality] light" (e.g., "soft diffused light", "harsh directional light", "gentle ambient light")
- Include "[color temperature] tones" (e.g., "warm golden tones", "cool blue tones", "neutral balanced tones")
- State "maintaining the exact spatial layout as described"
- List all key environmental elements explicitly (background, foreground, props, architecture, landscape features)

SUBJECT (ADD AFTER SCENE):
- Include "maintaining exact facial proportions and features"
- Include "preserving realistic human anatomy and body structure"
- Include "keeping subject's physical appearance unchanged"
- Add "photorealistic rendering of subject" before any artistic style modifiers

AVOID (Negative Prompt Simulation):
SCENE (HIGHEST PRIORITY): wrong lighting direction, different lighting quality, altered color temperature, changed location type, modified atmospheric conditions, different weather, altered spatial relationships, missing environmental elements, changed background, substituted location
SUBJECT: distorted anatomy, unrealistic proportions, exaggerated facial features, anime-style eyes (unless explicitly requested), stylized body shapes, altered facial structure, morphed features

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
- STARTING with complete scene/environment details (location, lighting direction, lighting quality, color temperature, atmospheric conditions, spatial layout, all environmental elements)
- Making scene details EXTREMELY specific and spatially accurate (without changing ANY environmental characteristics)
- Ensuring lighting direction, lighting quality, lighting color, atmosphere, and spatial layout from scene are explicitly stated and repeated for emphasis
- THEN adding subject details, making them more specific and visually descriptive (without changing any core features)
- THEN applying style as appropriate for ${styleIntensity} intensity level to rendering technique only
- Including quality modifiers (highly detailed, professional quality, 8k resolution, sharp focus)
- Ensuring the scene description takes up at least 40-50% of the prompt length

PROMPT STRUCTURE (STRICT ORDER - DO NOT DEVIATE):
1. SCENE FOUNDATION (40-50% of prompt): [Complete scene/environment with exact location type], [with exact lighting direction and quality], [exact atmospheric conditions], [exact color temperature], [all spatial relationships], [all background elements], [all foreground elements], [all environmental details from scene analysis]
2. SUBJECT IN SCENE (30-40% of prompt): [Subject details with preservation phrases] positioned within the established scene
3. STYLE APPLICATION (10-15% of prompt): [Style treatment applied ONLY to rendering technique, NOT to scene or subject]
4. QUALITY MODIFIERS (5-10% of prompt): [Technical quality terms]

CRITICAL: The scene description MUST be the longest and most detailed section. Start every enhanced prompt with the scene environment.

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
    const { prompt, subjectPrompt, scenePrompt, stylePrompt, styleIntensity, preciseReference } = requestBody;

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
      if (preciseReference !== undefined) console.log('  - Precise Reference:', preciseReference ? 'ON' : 'OFF');
    }
    const enhancedPrompt = await enhancePromptWithGemini(prompt, subjectPrompt, scenePrompt, stylePrompt, styleIntensity, preciseReference);
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
