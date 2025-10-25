import { GoogleGenerativeAI } from '@google/generative-ai';
import { config } from '../config';

export interface PromptGenerationOptions {
  style?: 'creative' | 'technical' | 'artistic' | 'descriptive' | 'storytelling';
  length?: 'short' | 'medium' | 'long' | 'detailed';
  focus?: 'composition' | 'colors' | 'mood' | 'subjects' | 'lighting' | 'style' | 'all';
  useCase?: 'art_generation' | 'photography' | 'design' | 'writing' | 'analysis';
}

export interface PromptGenerationResult {
  mainPrompt: string;
  negativePrompt?: string;
  styleKeywords: string[];
  technicalDetails: string[];
  mood: string;
  confidence: number;
  suggestions: string[];
}

export class ImageToPromptService {
  private genAI: GoogleGenerativeAI;
  private model: any;

  constructor() {
    if (!config.geminiApiKey) {
      throw new Error('Gemini API key is required for image-to-prompt functionality');
    }
    
    this.genAI = new GoogleGenerativeAI(config.geminiApiKey);
    this.model = this.genAI.getGenerativeModel({ 
      model: 'gemini-2.5-pro' 
    });
  }

  /**
   * Generate a comprehensive prompt from an image
   */
  async generatePrompt(
    imageData: string, 
    mimeType: string, 
    options: PromptGenerationOptions = {}
  ): Promise<PromptGenerationResult> {
    try {
      console.log('🔍 V2 generatePrompt called with:', { 
        imageDataLength: imageData.length, 
        mimeType, 
        options 
      });
      
      const promptTemplate = this.buildPromptTemplate(options);
      console.log('📝 V2 prompt template:', promptTemplate);
      
      console.log('🚀 V2 calling Gemini API...');
      const result = await this.model.generateContent([
        promptTemplate,
        {
          inlineData: {
            data: imageData,
            mimeType: mimeType
          }
        }
      ]);

      console.log('📡 V2 API call completed');
      const response = result.response.text();
      console.log('✅ V2 raw response received, length:', response.length);
      console.log('📄 V2 raw response content:', response);
      
      const parsedResult = this.parsePromptResponse(response, options);
      console.log('🎯 V2 parsed result:', parsedResult);
      
      return parsedResult;
    } catch (error) {
      console.error('❌ V2 Error generating prompt from image:', error);
      throw new Error(`Failed to generate prompt: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Generate multiple prompt variations from a single image
   */
  async generatePromptVariations(
    imageData: string,
    mimeType: string,
    count: number = 3,
    options: PromptGenerationOptions = {}
  ): Promise<PromptGenerationResult[]> {
    const variations: PromptGenerationResult[] = [];
    
    for (let i = 0; i < count; i++) {
      const variationOptions = {
        ...options,
        style: this.getRandomStyle(),
        focus: this.getRandomFocus()
      };
      
      try {
        const result = await this.generatePrompt(imageData, mimeType, variationOptions);
        variations.push(result);
      } catch (error) {
        console.error(`Error generating variation ${i + 1}:`, error);
      }
    }
    
    return variations;
  }

  /**
   * Build the prompt template based on options
   */
  private buildPromptTemplate(options: PromptGenerationOptions): string {
    const { style = 'descriptive', length = 'medium', focus = 'all', useCase = 'art_generation' } = options;

    let basePrompt = `Analyze this image and create a detailed prompt that could be used to recreate or inspire similar content using AI image generation tools. `;

    // Add style-specific instructions
    switch (style) {
      case 'creative':
        basePrompt += `Focus on creative and imaginative descriptions that inspire artistic interpretation. `;
        break;
      case 'technical':
        basePrompt += `Include technical details about composition, lighting, camera settings, and visual techniques. `;
        break;
      case 'artistic':
        basePrompt += `Emphasize artistic elements, style, mood, and aesthetic qualities. `;
        break;
      case 'storytelling':
        basePrompt += `Create a narrative description that tells the story within the image. `;
        break;
      default:
        basePrompt += `Provide a balanced, descriptive analysis of all visual elements. `;
    }

    // Add length specifications
    switch (length) {
      case 'short':
        basePrompt += `Keep the description concise and focused (50-100 words). `;
        break;
      case 'long':
        basePrompt += `Provide an extensive, detailed description (200-300 words). `;
        break;
      case 'detailed':
        basePrompt += `Give a comprehensive, in-depth analysis (300+ words). `;
        break;
      default:
        basePrompt += `Provide a moderate length description (100-200 words). `;
    }

    // Add focus-specific instructions
    if (focus !== 'all') {
      basePrompt += `Pay special attention to ${focus.replace('_', ' ')}. `;
    }

    basePrompt += `

Create a clear, specific, and detailed prompt that captures the essence of this image. The prompt should be optimized for AI image generation and include relevant details about:
- Subject matter and composition
- Visual style and artistic elements
- Lighting and atmosphere
- Colors and mood
- Technical aspects if relevant

Provide only the prompt text, without additional formatting or explanations.`;

    return basePrompt;
  }

  /**
   * Parse the AI response into structured format
   */
  private parsePromptResponse(response: string, options: PromptGenerationOptions): PromptGenerationResult {
    console.log('🔍 V2 parsePromptResponse called with response length:', response.length);
    
    // Clean up the response text
    const cleanedResponse = response.trim();
    console.log('📝 V2 Using direct text parsing for prompt');
    
    // Create structured response from the text prompt
    const result = {
      mainPrompt: cleanedResponse,
      styleKeywords: this.extractKeywords(cleanedResponse),
      technicalDetails: [],
      mood: this.extractMood(cleanedResponse),
      confidence: 0.8,
      suggestions: []
    };
    
    console.log('🎯 V2 structured result:', result);
    return result;
  }

  /**
   * Extract keywords from text response
   */
  private extractKeywords(text: string): string[] {
    const keywords: string[] = [];
    const commonArtTerms = [
      'vibrant', 'muted', 'bright', 'dark', 'colorful', 'monochrome',
      'detailed', 'minimalist', 'abstract', 'realistic', 'stylized',
      'dramatic', 'soft', 'sharp', 'blurred', 'focused'
    ];

    commonArtTerms.forEach(term => {
      if (text.toLowerCase().includes(term)) {
        keywords.push(term);
      }
    });

    return keywords.slice(0, 5); // Limit to 5 keywords
  }

  /**
   * Extract mood from text response
   */
  private extractMood(text: string): string {
    const moodTerms = {
      'cheerful': ['bright', 'vibrant', 'happy', 'joyful', 'cheerful', 'sunny'],
      'dramatic': ['dramatic', 'intense', 'bold', 'striking', 'powerful'],
      'peaceful': ['calm', 'peaceful', 'serene', 'tranquil', 'gentle', 'soft'],
      'mysterious': ['dark', 'mysterious', 'shadowy', 'enigmatic', 'moody'],
      'energetic': ['dynamic', 'energetic', 'active', 'lively', 'vibrant']
    };

    const lowerText = text.toLowerCase();
    
    for (const [mood, terms] of Object.entries(moodTerms)) {
      if (terms.some(term => lowerText.includes(term))) {
        return mood;
      }
    }

    return 'neutral';
  }

  /**
   * Get random style for variations
   */
  private getRandomStyle(): PromptGenerationOptions['style'] {
    const styles: PromptGenerationOptions['style'][] = ['creative', 'technical', 'artistic', 'descriptive', 'storytelling'];
    return styles[Math.floor(Math.random() * styles.length)];
  }

  /**
   * Get random focus for variations
   */
  private getRandomFocus(): PromptGenerationOptions['focus'] {
    const focuses: PromptGenerationOptions['focus'][] = ['composition', 'colors', 'mood', 'subjects', 'lighting', 'style'];
    return focuses[Math.floor(Math.random() * focuses.length)];
  }

  /**
   * Convert image file to base64 data
   */
  static async fileToBase64(file: File): Promise<{ data: string; mimeType: string }> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        const base64Data = result.split(',')[1]; // Remove data:image/...;base64, prefix
        resolve({
          data: base64Data,
          mimeType: file.type
        });
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  /**
   * Batch process multiple images
   */
  async batchGeneratePrompts(
    images: { data: string; mimeType: string }[],
    options: PromptGenerationOptions = {}
  ): Promise<PromptGenerationResult[]> {
    const results: PromptGenerationResult[] = [];
    
    for (const image of images) {
      try {
        const result = await this.generatePrompt(image.data, image.mimeType, options);
        results.push(result);
        
        // Add small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        console.error('Error in batch processing:', error);
        // Continue with other images even if one fails
      }
    }
    
    return results;
  }
}

// Export singleton instance
export const imageToPromptService = new ImageToPromptService();