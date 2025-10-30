import Replicate from 'replicate';

// Initialize Replicate client
const replicate = new Replicate({
  auth: import.meta.env.VITE_REPLICATE_API_TOKEN,
});

export interface AnalyzeImageOptions {
  detail?: 'short' | 'medium' | 'detailed';
  tags?: boolean;
}

export interface AnalyzeImageResult {
  description: string;
  tags?: string[];
}

/**
 * Convert file to base64 data URL
 */
async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Upload image to a temporary hosting service for Replicate
 * For now, we'll convert to base64 and use data URLs
 */
async function prepareImageForReplicate(file: File): Promise<string> {
  // Convert file to base64 data URL
  const dataUrl = await fileToBase64(file);
  return dataUrl;
}

/**
 * Analyze an image using Replicate's img2prompt model
 */
export async function analyzeImage(
  imageFile: File,
  options: AnalyzeImageOptions = {}
): Promise<AnalyzeImageResult> {
  console.log('🔍 Replicate analyzeImage called with:', { 
    fileName: imageFile.name, 
    size: imageFile.size, 
    options 
  });
  
  const apiToken = import.meta.env.VITE_REPLICATE_API_TOKEN;
  if (!apiToken) {
    console.error('❌ No Replicate API token found!');
    throw new Error('Replicate API token not configured. Please set VITE_REPLICATE_API_TOKEN in your .env file');
  }

  try {
    // Prepare image for Replicate
    console.log('📄 Converting image for Replicate...');
    const imageData = await prepareImageForReplicate(imageFile);
    console.log('✅ Image conversion complete');

    // Run the img2prompt model
    console.log('🚀 Calling Replicate img2prompt model...');
    const output = await replicate.run(
      "methexis-inc/img2prompt:50adaf2d3ad20a6f911a8a9e3ccf777b263b8596fbd2c8fc26e8888f8a0edbb5",
      {
        input: {
          image: imageData,
        },
      }
    ) as string;

    console.log('✅ Replicate API call completed');
    console.log('📝 Generated prompt:', output);

    // Process the output based on options
    let description = output;
    let tags: string[] | undefined;

    // If tags are requested, try to extract them from the description
    if (options.tags) {
      // Simple tag extraction - look for comma-separated terms
      const tagMatches = description.match(/\b\w+(?:\s+\w+)*\b/g);
      if (tagMatches) {
        tags = tagMatches.slice(0, 10); // Limit to 10 tags
      }
    }

    // Adjust description length based on detail level
    if (options.detail === 'short') {
      // Truncate to first sentence or 100 characters
      const firstSentence = description.split('.')[0];
      description = firstSentence.length > 100 
        ? description.substring(0, 100) + '...'
        : firstSentence + '.';
    } else if (options.detail === 'detailed') {
      // Keep full description as is
      description = output;
    }

    const result: AnalyzeImageResult = {
      description,
      ...(tags && { tags })
    };

    console.log('🎯 Final analysis result:', result);
    return result;

  } catch (error) {
    console.error('❌ Replicate image analysis failed:', error);
    
    // Provide more specific error messages
    if (error instanceof Error) {
      if (error.message.includes('authentication') || error.message.includes('401')) {
        throw new Error('Replicate API authentication failed. Please check your VITE_REPLICATE_API_TOKEN.');
      } else if (error.message.includes('quota') || error.message.includes('429')) {
        throw new Error('Replicate API quota exceeded. Please try again later.');
      } else if (error.message.includes('network') || error.message.includes('fetch')) {
        throw new Error('Network error connecting to Replicate API. Please check your internet connection.');
      }
    }
    
    throw new Error(`Image analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Generate enhanced prompts using text-to-prompt (keeping existing functionality)
 */
export async function textToPrompt(
  intent: string,
  style?: string,
  constraints?: string
): Promise<string> {
  console.log('📝 Replicate textToPrompt called with:', { intent, style, constraints });
  
  const apiToken = import.meta.env.VITE_REPLICATE_API_TOKEN;
  if (!apiToken) {
    console.error('❌ No Replicate API token found!');
    throw new Error('Replicate API token not configured');
  }

  try {
    // Construct a prompt for text enhancement
    let prompt = `Enhance this image generation prompt: "${intent}"`;
    
    if (style) {
      prompt += ` Style: ${style}.`;
    }
    
    if (constraints) {
      prompt += ` Constraints: ${constraints}.`;
    }
    
    prompt += ' Make it more detailed and specific for better image generation results.';

    console.log('🚀 Calling Replicate for text enhancement...');
    
    // For text enhancement, we can use a different model or just return enhanced text
    // For now, let's create a simple enhancement
    const enhancedPrompt = await enhancePromptLocally(intent, style, constraints);
    
    console.log('✅ Text enhancement completed:', enhancedPrompt);
    return enhancedPrompt;

  } catch (error) {
    console.error('❌ Text-to-prompt enhancement failed:', error);
    throw new Error(`Text enhancement failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Refine an existing prompt (for compatibility with existing App.tsx)
 */
export async function refinePrompt(
  existingPrompt: string,
  mode: 'refine' | 'enhance' | 'simplify' = 'refine'
): Promise<string> {
  console.log('🔧 Replicate refinePrompt called with:', { existingPrompt, mode });
  
  try {
    // For now, use local enhancement since we don't have a specific refine model
    let refined = existingPrompt;
    
    switch (mode) {
      case 'enhance':
        refined = enhancePromptLocally(existingPrompt);
        break;
      case 'simplify':
        // Simplify by removing redundant words and keeping core concepts
        refined = existingPrompt
          .replace(/,\s*(highly detailed|professional quality|sharp focus|vibrant colors|excellent composition)/gi, '')
          .replace(/\s+/g, ' ')
          .trim();
        break;
      case 'refine':
      default:
        // Add some variation and enhancement
        refined = enhancePromptLocally(existingPrompt, 'artistic', 'high quality');
        break;
    }
    
    console.log('✅ Prompt refinement completed:', refined);
    return refined;
    
  } catch (error) {
    console.error('❌ Prompt refinement failed:', error);
    throw new Error(`Prompt refinement failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Local prompt enhancement function
 */
function enhancePromptLocally(intent: string, style?: string, constraints?: string): string {
  let enhanced = intent;
  
  // Add style information
  if (style) {
    enhanced += `, ${style} style`;
  }
  
  // Add quality enhancers
  enhanced += ', highly detailed, professional quality';
  
  // Add constraints
  if (constraints) {
    enhanced += `, ${constraints}`;
  }
  
  // Add common quality terms
  enhanced += ', sharp focus, vibrant colors, excellent composition';
  
  return enhanced;
}