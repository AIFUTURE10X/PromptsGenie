import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize the Gemini API
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY || '';

if (!API_KEY) {
  console.warn('VITE_GEMINI_API_KEY not found in environment variables');
}

const genAI = new GoogleGenerativeAI(API_KEY);

// Get the generative model
const MODEL_NAME = import.meta.env.VITE_GEMINI_MODEL_IMAGES || 'gemini-1.5-flash';
const model = genAI.getGenerativeModel({ model: MODEL_NAME });

export interface AnalyzeImageOptions {
  detail?: 'short' | 'medium' | 'detailed';
  tags?: boolean;
}

export interface AnalyzeImageResult {
  description: string;
  tags?: string[];
  confidence?: number;
}

/**
 * Analyze an image using Gemini Vision
 */
export async function analyzeImage(
  imageFile: File,
  options: AnalyzeImageOptions = {}
): Promise<AnalyzeImageResult> {
  console.log('🔍 analyzeImage called with:', { fileName: imageFile.name, size: imageFile.size, options });
  
  if (!API_KEY) {
    console.error('❌ No API key found!');
    throw new Error('Gemini API key not configured');
  }
  
  try {
    // Convert file to base64
    console.log('📄 Converting file to base64...');
    const base64 = await fileToBase64(imageFile);
    console.log('✅ Base64 conversion complete, length:', base64.length);
    
    // Create the prompt based on options
    let prompt = 'Analyze this image and provide a detailed description.';
    
    if (options.detail === 'short') {
      prompt = 'Provide a brief description of this image in 1-2 sentences.';
    } else if (options.detail === 'detailed') {
      prompt = 'Provide a very detailed analysis of this image, including objects, colors, composition, mood, and any text visible.';
    }
    
    if (options.tags) {
      prompt += ' Also provide relevant tags or keywords separated by commas.';
    }

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

    // Parse response for tags if requested
    let description = text;
    let tags: string[] | undefined;

    if (options.tags && text.includes('Tags:') || text.includes('Keywords:')) {
      const parts = text.split(/Tags:|Keywords:/i);
      if (parts.length > 1) {
        description = parts[0].trim();
        tags = parts[1]
          .split(',')
          .map(tag => tag.trim())
          .filter(tag => tag.length > 0);
      }
    }

    return {
      description,
      tags,
      confidence: 0.9, // Mock confidence for now
    };
  } catch (error) {
    console.error('Error analyzing image:', error);
    throw new Error('Failed to analyze image. Please check your API key and try again.');
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
  
  if (!API_KEY) {
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