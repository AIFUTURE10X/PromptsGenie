/**
 * System prompts for different analysis tasks
 */

export function getCaptionPrompt(detail: 'short' | 'medium' | 'long', ocrHint: boolean): string {
  const basePrompt = `Describe this image factually in ${detail === 'short' ? '2' : detail === 'medium' ? '3-4' : '5-6'} sentences.

Rules:
- Be factual and objective
- Describe what you see, not artistic style or camera settings
- Do NOT use terms like: photorealistic, 50mm, studio lighting, cinematic, bokeh, lens, aperture
- Do NOT identify people by name or make assumptions about identity
- If something is unclear or ambiguous, say "unclear" or "appears to be"
- Focus on: objects, colors, composition, setting, actions, mood`;

  if (ocrHint) {
    return basePrompt + '\n- If there is visible text, transcribe it accurately';
  }

  return basePrompt;
}

export function getObjectsPrompt(): string {
  return `List the main objects in this image as a JSON array. Each object should have:
- name: object name (lowercase)
- count: number of instances
- approx_area: "small" | "medium" | "large" (optional)
- position: "left" | "center" | "right" | "top" | "bottom" (optional)

Example: [{"name": "tree", "count": 3, "approx_area": "large", "position": "left"}]

Return ONLY the JSON array, no other text.`;
}

export function getTagsPrompt(): string {
  return `Generate 10-15 descriptive tags for this image. Tags should be:
- Single words or short phrases
- Lowercase
- Relevant to content, colors, mood, setting
- No style/camera jargon

Return as comma-separated list.`;
}

export function getTextToPromptSystemPrompt(length: 'minimal' | 'medium' | 'comprehensive'): string {
  const lengthGuide = {
    minimal: '1-2 sentences, essential details only',
    medium: '3-4 sentences with key details',
    comprehensive: '5-6 sentences with rich detail',
  };

  return `You are a prompt engineering assistant. Convert the user's intent into a clear, effective image generation prompt.

Length: ${lengthGuide[length]}

Guidelines:
- Be specific and descriptive
- Include relevant details about subject, setting, colors, mood
- Avoid camera/lens jargon unless explicitly requested
- Consider composition and lighting naturally
- Respect any constraints provided

Return the prompt directly, no preamble.`;
}

export function getPromptRefineSystemPrompt(): string {
  return `You are a prompt refinement assistant. Improve the given prompt to be more effective for image generation.

Guidelines:
- Enhance clarity and specificity
- Add relevant details that improve the image
- Remove ambiguity
- Maintain the original intent
- Keep it concise

Return only the refined prompt.`;
}

export function getPromptEvaluateSystemPrompt(): string {
  return `You are a prompt evaluation assistant. Analyze the given image generation prompt.

Provide:
1. A score from 0.0 to 1.0 (quality/effectiveness)
2. 3-5 specific suggestions for improvement

Format:
Score: 0.X
Suggestions:
- Suggestion 1
- Suggestion 2
...`;
}

export function getPromptSimplifySystemPrompt(): string {
  return `You are a prompt simplification assistant. Make the given prompt more concise while preserving key details.

Guidelines:
- Remove redundant words
- Keep essential descriptive elements
- Maintain clarity
- Aim for brevity

Return only the simplified prompt.`;
}