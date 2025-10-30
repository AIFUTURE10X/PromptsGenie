import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize the Gemini API
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY as string | undefined;
const GEMINI_MODEL_IMAGE = import.meta.env.VITE_GEMINI_MODEL_IMAGE || "gemini-2.5-flash";
const GEMINI_MODEL_IMAGES = import.meta.env.VITE_GEMINI_MODEL_IMAGES || "gemini-2.5-flash";

if (!GEMINI_API_KEY) {
  console.error('VITE_GEMINI_API_KEY not configured');
  throw new Error('Gemini API key not configured. Please set VITE_GEMINI_API_KEY environment variable.');
}

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

// Get the generative model
const MODEL_NAME = import.meta.env.VITE_GEMINI_MODEL_IMAGE || 'gemini-2.5-flash';
const model = genAI.getGenerativeModel({ model: MODEL_NAME });

export interface AnalyzeImageOptions {
  detail?: 'short' | 'medium' | 'detailed';
  tags?: boolean;
  analysisType?: 'general' | 'subject' | 'scene' | 'style' | 'composition' | 'mood' | 'technical';
  includeColors?: boolean;
  includeLighting?: boolean;
  includeComposition?: boolean;
  includeMood?: boolean;
  includeStyle?: boolean;
  includeTechnical?: boolean;
}

export interface AnalyzeImageResult {
  description: string;
  tags?: string[];
  confidence?: number;
  colors?: string[];
  lighting?: string;
  composition?: string;
  mood?: string;
  style?: string;
  technical?: string;
  objects?: string[];
  scene?: string;
}

/**
 * Specialized function for subject analysis
 */
export async function analyzeSubject(
  imageFile: File,
  detail: 'short' | 'medium' | 'detailed' = 'medium'
): Promise<AnalyzeImageResult> {
  return analyzeImage(imageFile, {
    detail,
    analysisType: 'subject',
    tags: true,
    includeColors: true,
    includeMood: true
  });
}

/**
 * Specialized function for scene analysis
 */
export async function analyzeScene(
  imageFile: File,
  detail: 'short' | 'medium' | 'detailed' = 'medium'
): Promise<AnalyzeImageResult> {
  return analyzeImage(imageFile, {
    detail,
    analysisType: 'scene',
    tags: true,
    includeColors: true,
    includeLighting: true,
    includeComposition: true
  });
}

/**
 * Specialized function for style analysis
 */
export async function analyzeStyle(
  imageFile: File,
  detail: 'short' | 'medium' | 'detailed' = 'medium'
): Promise<AnalyzeImageResult> {
  return analyzeImage(imageFile, {
    detail,
    analysisType: 'style',
    tags: true,
    includeColors: true,
    includeStyle: true,
    includeTechnical: true
  });
}

/**
 * Comprehensive analysis with all features
 */
export async function analyzeComprehensive(
  imageFile: File,
  detail: 'short' | 'medium' | 'detailed' = 'detailed'
): Promise<AnalyzeImageResult> {
  return analyzeImage(imageFile, {
    detail,
    analysisType: 'general',
    tags: true,
    includeColors: true,
    includeLighting: true,
    includeComposition: true,
    includeMood: true,
    includeStyle: true,
    includeTechnical: true
  });
}

/**
 * Analyze an image using Gemini Vision
 */
export async function analyzeImage(
  imageFile: File,
  options: AnalyzeImageOptions = {}
): Promise<AnalyzeImageResult> {
  console.log('🔍 analyzeImage called with:', { fileName: imageFile.name, size: imageFile.size, options });
  
  if (!GEMINI_API_KEY) {
    console.error('❌ No API key found!');
    throw new Error('Gemini API key not configured');
  }
  
  try {
    // Convert file to base64
    console.log('📄 Converting file to base64...');
    const base64 = await fileToBase64(imageFile);
    console.log('✅ Base64 conversion complete, length:', base64.length);
    
    // Create advanced prompt based on options
    const prompt = createAdvancedPrompt(options);

    // Prepare the image data
    const imagePart = {
      inlineData: {
        data: base64,
        mimeType: imageFile.type,
      },
    };

    // Generate content
    console.log('🚀 Calling Gemini API with prompt:', prompt);
    console.log('📸 Image data prepared, mime type:', imageFile.type);
    const result = await model.generateContent([prompt, imagePart]);
    console.log('📡 API call completed, getting response...');
    const response = await result.response;
    const text = response.text();
    console.log('✅ Response received, length:', text.length);

    // Parse advanced response components
    const parsedResult = parseAdvancedResponse(text, options);

    return parsedResult;
  } catch (error: any) {
    console.error('Error analyzing image:', error);
    
    // Enhanced error handling with specific error types
    if (error.message?.includes('429')) {
      throw new Error('API Rate Limit: You\'ve exceeded your Gemini API quota. Please wait a few minutes and try again.');
    } else if (error.message?.includes('401')) {
      throw new Error('API Authentication Error: Please check your VITE_GEMINI_API_KEY in the .env file.');
    } else if (error.message?.includes('403')) {
      throw new Error('API Access Forbidden: Your API key may not have access to the Gemini model.');
    } else if (error.message?.includes('400')) {
      throw new Error('Invalid Request: The image format may not be supported or the request is malformed.');
    } else if (error.message?.includes('500')) {
      throw new Error('Server Error: Gemini API is experiencing issues. Please try again later.');
    } else {
      throw new Error(`Image analysis failed: ${error.message || 'Unknown error occurred'}`);
    }
  }
}

/**
 * Generate a prompt from text description
 */
export async function textToPrompt(
  intent: string,
  style?: string,
  constraints?: string
): Promise<string> {
  console.log('📝 textToPrompt called with:', { intent, style, constraints });
  
  if (!GEMINI_API_KEY) {
    console.error('❌ No API key found for textToPrompt!');
    throw new Error('Gemini API key not configured');
  }
  
  try {
    let prompt = `Convert this description into a detailed, well-structured prompt for image generation: "${intent}"`;
    
    if (style) {
      prompt += ` Style: ${style}.`;
    }
    
    if (constraints) {
      prompt += ` Constraints: ${constraints}.`;
    }
     
    prompt += ' Make the prompt clear, specific, and optimized for AI image generation.';
     
    console.log('🚀 Calling Gemini API for prompt generation with:', prompt);
    const result = await model.generateContent(prompt);
    console.log('📡 Prompt generation API call completed');
    const response = await result.response;
    const generatedPrompt = response.text();
    console.log('✅ Generated prompt received, length:', generatedPrompt.length);
    return generatedPrompt;
  } catch (error) {
    console.error('Error generating prompt:', error);
    throw new Error('Failed to generate prompt. Please try again.');
  }
}

/**
 * Refine an existing prompt
 */
export async function refinePrompt(
  originalPrompt: string,
  task: 'refine' | 'simplify' | 'evaluate' = 'refine'
): Promise<string> {
  try {
    let prompt = '';
    
    switch (task) {
      case 'refine':
        prompt = `Improve and refine this prompt to make it more detailed and effective: "${originalPrompt}"`;
        break;
      case 'simplify':
        prompt = `Simplify this prompt while keeping its core meaning: "${originalPrompt}"`;
        break;
      case 'evaluate':
        prompt = `Evaluate this prompt and provide suggestions for improvement: "${originalPrompt}"`;
        break;
    }

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error('Error refining prompt:', error);
    throw new Error('Failed to refine prompt. Please try again.');
  }
}

/**
 * Create advanced prompt based on analysis options
 */
function createAdvancedPrompt(options: AnalyzeImageOptions): string {
  const { detail = 'medium', analysisType = 'general', tags = false } = options;
  
  let basePrompt = '';
  
  // Base analysis type prompts
  switch (analysisType) {
    case 'subject':
      basePrompt = 'Focus on analyzing the main subject(s) in this image. Describe the people, animals, or primary objects in detail, including their appearance, pose, expression, clothing, and any notable characteristics.';
      break;
    case 'scene':
      basePrompt = 'Analyze the scene and environment in this image. Describe the setting, location, background elements, spatial relationships, and overall context of where this image was taken.';
      break;
    case 'style':
      basePrompt = 'Analyze the artistic and visual style of this image. Focus on the aesthetic qualities, artistic techniques, visual treatment, and stylistic elements that define the image\'s appearance.';
      break;
    case 'composition':
      basePrompt = 'Analyze the composition and visual structure of this image. Focus on the arrangement of elements, rule of thirds, leading lines, symmetry, balance, framing, and overall visual organization.';
      break;
    case 'mood':
      basePrompt = 'Analyze the mood, atmosphere, and emotional qualities of this image. Describe the feelings it evokes, the emotional tone, and the psychological impact of the visual elements.';
      break;
    case 'technical':
      basePrompt = 'Provide a technical analysis of this image. Focus on photographic aspects like lighting quality, depth of field, exposure, color grading, sharpness, and technical execution.';
      break;
    default:
      basePrompt = 'Provide a comprehensive analysis of this image covering all major visual aspects.';
  }
  
  // Detail level modifications
  if (detail === 'short') {
    basePrompt += ' Keep your analysis concise and focused, providing key insights in 2-3 sentences.';
  } else if (detail === 'detailed') {
    basePrompt += ' Provide an extensive, thorough analysis with rich detail and specific observations.';
  }
  
  // Add structured output requirements
  let structuredOutput = '\n\nStructure your response with the following sections:\n';
  structuredOutput += '**Description:** Main analysis based on the focus area\n';
  
  if (options.includeColors || analysisType === 'general') {
    structuredOutput += '**Colors:** Dominant colors and color palette (list 3-5 main colors)\n';
  }
  
  if (options.includeLighting || analysisType === 'general' || analysisType === 'technical') {
    structuredOutput += '**Lighting:** Quality, direction, and characteristics of lighting\n';
  }
  
  if (options.includeComposition || analysisType === 'composition' || analysisType === 'general') {
    structuredOutput += '**Composition:** Visual arrangement and compositional elements\n';
  }
  
  if (options.includeMood || analysisType === 'mood' || analysisType === 'general') {
    structuredOutput += '**Mood:** Emotional tone and atmosphere\n';
  }
  
  if (options.includeStyle || analysisType === 'style' || analysisType === 'general') {
    structuredOutput += '**Style:** Artistic style and visual treatment\n';
  }
  
  if (options.includeTechnical || analysisType === 'technical') {
    structuredOutput += '**Technical:** Camera settings, quality, and technical aspects\n';
  }
  
  if (tags) {
    structuredOutput += '**Tags:** Relevant keywords and tags (comma-separated)\n';
  }
  
  return basePrompt + structuredOutput;
}

/**
 * Parse advanced response from Gemini
 */
function parseAdvancedResponse(text: string, options: AnalyzeImageOptions): AnalyzeImageResult {
  const result: AnalyzeImageResult = {
    description: '',
    confidence: 0.9
  };
  
  // Extract main description
  const descMatch = text.match(/\*\*Description:\*\*\s*(.*?)(?=\*\*|$)/s);
  result.description = descMatch ? descMatch[1].trim() : text.split('\n')[0] || text;
  
  // Extract colors
  const colorsMatch = text.match(/\*\*Colors:\*\*\s*(.*?)(?=\*\*|$)/s);
  if (colorsMatch) {
    result.colors = colorsMatch[1]
      .split(',')
      .map(color => color.trim())
      .filter(color => color.length > 0);
  }
  
  // Extract lighting
  const lightingMatch = text.match(/\*\*Lighting:\*\*\s*(.*?)(?=\*\*|$)/s);
  if (lightingMatch) {
    result.lighting = lightingMatch[1].trim();
  }
  
  // Extract composition
  const compositionMatch = text.match(/\*\*Composition:\*\*\s*(.*?)(?=\*\*|$)/s);
  if (compositionMatch) {
    result.composition = compositionMatch[1].trim();
  }
  
  // Extract mood
  const moodMatch = text.match(/\*\*Mood:\*\*\s*(.*?)(?=\*\*|$)/s);
  if (moodMatch) {
    result.mood = moodMatch[1].trim();
  }
  
  // Extract style
  const styleMatch = text.match(/\*\*Style:\*\*\s*(.*?)(?=\*\*|$)/s);
  if (styleMatch) {
    result.style = styleMatch[1].trim();
  }
  
  // Extract technical
  const technicalMatch = text.match(/\*\*Technical:\*\*\s*(.*?)(?=\*\*|$)/s);
  if (technicalMatch) {
    result.technical = technicalMatch[1].trim();
  }
  
  // Extract tags
  const tagsMatch = text.match(/\*\*Tags:\*\*\s*(.*?)(?=\*\*|$)/s);
  if (tagsMatch) {
    result.tags = tagsMatch[1]
      .split(',')
      .map(tag => tag.trim())
      .filter(tag => tag.length > 0);
  }
  
  // Fallback: if no structured sections found, try legacy parsing
  if (!descMatch && options.tags && (text.includes('Tags:') || text.includes('Keywords:'))) {
    const parts = text.split(/Tags:|Keywords:/i);
    if (parts.length > 1) {
      result.description = parts[0].trim();
      result.tags = parts[1]
        .split(',')
        .map(tag => tag.trim())
        .filter(tag => tag.length > 0);
    }
  }
  
  return result;
}

/**
 * Convert File to base64 string
 */
function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      // Remove the data URL prefix (e.g., "data:image/jpeg;base64,")
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = error => reject(error);
  });
}