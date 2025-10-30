export interface PromptTemplate {
  name: string;
  description: string;
  systemPrompt: string;
  outputFormat: string;
  examples?: string[];
}

export const PROMPT_TEMPLATES = {
  // Art Generation Templates
  ART_GENERATION: {
    name: "Art Generation",
    description: "Generate prompts optimized for AI art creation tools like Midjourney, DALL-E, or Stable Diffusion",
    systemPrompt: `Analyze this image and create a detailed prompt that could be used with AI art generation tools. Focus on:
- Visual style and artistic technique
- Color palette and lighting
- Composition and framing
- Mood and atmosphere
- Technical art terms
- Medium and materials (if applicable)

Create a prompt that would help recreate similar visual aesthetics.`,
    outputFormat: `{
  "mainPrompt": "Detailed artistic description with style keywords",
  "negativePrompt": "Elements to avoid (low quality, blurry, etc.)",
  "styleKeywords": ["art_style", "technique", "medium"],
  "technicalDetails": ["composition", "lighting", "color_theory"],
  "mood": "Overall emotional tone",
  "confidence": 0.95,
  "suggestions": ["Additional style modifiers", "Alternative approaches"]
}`,
    examples: [
      "A serene landscape painting in the style of Claude Monet, impressionist brushstrokes, soft pastel colors, golden hour lighting, peaceful atmosphere",
      "Digital art portrait, cyberpunk aesthetic, neon lighting, high contrast, detailed facial features, futuristic elements"
    ]
  },

  PHOTOGRAPHY: {
    name: "Photography Recreation",
    description: "Generate prompts for recreating photographic techniques and compositions",
    systemPrompt: `Analyze this photograph and create a detailed prompt for recreating similar photography. Focus on:
- Camera settings and technical aspects
- Lighting conditions and setup
- Composition and framing techniques
- Subject positioning and poses
- Background and environment
- Post-processing style

Provide technical photography guidance.`,
    outputFormat: `{
  "mainPrompt": "Photography setup and composition description",
  "negativePrompt": "Technical issues to avoid",
  "styleKeywords": ["photography_style", "genre", "technique"],
  "technicalDetails": ["camera_settings", "lighting_setup", "composition_rules"],
  "mood": "Photographic mood and tone",
  "confidence": 0.90,
  "suggestions": ["Equipment recommendations", "Alternative angles"]
}`,
    examples: [
      "Portrait photography, shallow depth of field, natural lighting from window, rule of thirds composition, warm color grading",
      "Street photography, candid moment, black and white, high contrast, urban environment, documentary style"
    ]
  },

  DESIGN_INSPIRATION: {
    name: "Design Inspiration",
    description: "Generate prompts for graphic design, UI/UX, and visual design inspiration",
    systemPrompt: `Analyze this design and create a prompt for design inspiration. Focus on:
- Design principles and layout
- Typography and text hierarchy
- Color schemes and palettes
- Visual hierarchy and balance
- Design style and trends
- User interface elements (if applicable)

Create guidance for design recreation or inspiration.`,
    outputFormat: `{
  "mainPrompt": "Design description with layout and visual elements",
  "negativePrompt": "Design mistakes to avoid",
  "styleKeywords": ["design_style", "layout_type", "visual_approach"],
  "technicalDetails": ["typography", "color_theory", "layout_principles"],
  "mood": "Design mood and brand feeling",
  "confidence": 0.88,
  "suggestions": ["Design variations", "Alternative layouts"]
}`,
    examples: [
      "Modern minimalist web design, clean typography, white space usage, subtle shadows, professional color palette",
      "Vintage poster design, bold typography, retro color scheme, geometric shapes, high contrast"
    ]
  },

  CREATIVE_WRITING: {
    name: "Creative Writing",
    description: "Generate prompts for creative writing and storytelling inspiration",
    systemPrompt: `Analyze this image and create a creative writing prompt. Focus on:
- Scene setting and atmosphere
- Character possibilities and emotions
- Story potential and narrative hooks
- Sensory details and descriptions
- Mood and emotional tone
- Potential plot elements

Create inspiring prompts for writers and storytellers.`,
    outputFormat: `{
  "mainPrompt": "Creative writing prompt with scene and character details",
  "negativePrompt": "Clichés or overused elements to avoid",
  "styleKeywords": ["genre", "tone", "narrative_style"],
  "technicalDetails": ["setting_details", "character_elements", "plot_hooks"],
  "mood": "Emotional atmosphere for the story",
  "confidence": 0.85,
  "suggestions": ["Alternative story angles", "Character development ideas"]
}`,
    examples: [
      "A mysterious figure stands at the edge of a misty forest, holding an ancient key. What door does it unlock, and what lies beyond?",
      "In a bustling café, two strangers accidentally swap identical briefcases. Write about the consequences of this mix-up."
    ]
  },

  TECHNICAL_ANALYSIS: {
    name: "Technical Analysis",
    description: "Generate detailed technical analysis for educational or professional purposes",
    systemPrompt: `Provide a comprehensive technical analysis of this image. Focus on:
- Visual composition and structure
- Technical execution and quality
- Color theory and palette analysis
- Lighting analysis and techniques
- Artistic or photographic principles
- Historical or cultural context (if relevant)

Create an educational and analytical description.`,
    outputFormat: `{
  "mainPrompt": "Detailed technical analysis with professional terminology",
  "negativePrompt": "Subjective opinions without technical basis",
  "styleKeywords": ["technical_terms", "analysis_type", "methodology"],
  "technicalDetails": ["composition_analysis", "color_analysis", "technique_analysis"],
  "mood": "Analytical and objective tone",
  "confidence": 0.92,
  "suggestions": ["Further analysis areas", "Related techniques"]
}`,
    examples: [
      "Technical analysis: Rule of thirds composition, complementary color scheme (blue-orange), leading lines directing to focal point",
      "Lighting analysis: Three-point lighting setup, key light from upper left, fill light reducing shadows, rim light for separation"
    ]
  },

  MOOD_BOARD: {
    name: "Mood Board Creation",
    description: "Generate prompts for creating mood boards and visual collections",
    systemPrompt: `Analyze this image for mood board creation. Focus on:
- Overall aesthetic and vibe
- Color mood and emotional impact
- Style elements and trends
- Texture and material qualities
- Brand or project alignment
- Visual themes and concepts

Create guidance for building cohesive mood boards.`,
    outputFormat: `{
  "mainPrompt": "Mood board description with aesthetic elements",
  "negativePrompt": "Conflicting styles or moods to avoid",
  "styleKeywords": ["aesthetic_style", "mood_type", "visual_theme"],
  "technicalDetails": ["color_mood", "texture_elements", "style_components"],
  "mood": "Overall aesthetic feeling",
  "confidence": 0.87,
  "suggestions": ["Complementary elements", "Mood board extensions"]
}`,
    examples: [
      "Scandinavian minimalism mood board: clean lines, neutral colors, natural textures, cozy hygge feeling",
      "Cyberpunk aesthetic mood board: neon colors, urban decay, high-tech elements, dystopian atmosphere"
    ]
  }
};

export type TemplateType = keyof typeof PROMPT_TEMPLATES;

export function getTemplate(type: TemplateType): PromptTemplate {
  return PROMPT_TEMPLATES[type];
}

export function getAllTemplates(): PromptTemplate[] {
  return Object.values(PROMPT_TEMPLATES);
}

export function getTemplateNames(): string[] {
  return Object.values(PROMPT_TEMPLATES).map(template => template.name);
}

// Helper function to build custom prompts based on template and options
export function buildCustomPrompt(
  template: PromptTemplate,
  customInstructions?: string,
  focusAreas?: string[]
): string {
  let prompt = template.systemPrompt;

  if (focusAreas && focusAreas.length > 0) {
    prompt += `\n\nPay special attention to: ${focusAreas.join(', ')}.`;
  }

  if (customInstructions) {
    prompt += `\n\nAdditional instructions: ${customInstructions}`;
  }

  prompt += `\n\nFormat your response as: ${template.outputFormat}`;

  return prompt;
}