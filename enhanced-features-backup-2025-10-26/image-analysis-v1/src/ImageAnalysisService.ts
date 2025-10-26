import { analyzeImage, analyzeSubject, analyzeScene, analyzeStyle } from './services/gemini';
import { GeminiAnalysisResult } from './types/gemini';

export interface ImageAnalysisOptions {
  detail?: 'short' | 'medium' | 'detailed';
  analysisType?: 'general' | 'subject' | 'scene' | 'style';
}

export interface ImageAnalysisError {
  type: 'rate_limit' | 'auth' | 'forbidden' | 'unknown';
  message: string;
  originalError?: any;
}

export class ImageAnalysisService {
  /**
   * Analyze an image with the specified options
   * @param image - The image file to analyze
   * @param options - Analysis options including detail level and type
   * @returns Promise<GeminiAnalysisResult>
   */
  async analyzeImage(
    image: File, 
    options: ImageAnalysisOptions = {}
  ): Promise<GeminiAnalysisResult> {
    const { detail = 'medium', analysisType = 'general' } = options;
    
    try {
      let result: GeminiAnalysisResult;
      
      switch (analysisType) {
        case 'subject':
          result = await analyzeSubject(image, detail);
          break;
        case 'scene':
          result = await analyzeScene(image, detail);
          break;
        case 'style':
          result = await analyzeStyle(image, detail);
          break;
        default:
          result = await analyzeImage(image, { detail });
          break;
      }
      
      return result;
    } catch (error: any) {
      throw this.handleAnalysisError(error);
    }
  }

  /**
   * Analyze an image for subject detection and analysis
   * @param image - The image file to analyze
   * @param detail - Detail level for analysis
   * @returns Promise<GeminiAnalysisResult>
   */
  async analyzeSubject(
    image: File, 
    detail: 'short' | 'medium' | 'detailed' = 'medium'
  ): Promise<GeminiAnalysisResult> {
    try {
      return await analyzeSubject(image, detail);
    } catch (error: any) {
      throw this.handleAnalysisError(error);
    }
  }

  /**
   * Analyze an image for scene and environment analysis
   * @param image - The image file to analyze
   * @param detail - Detail level for analysis
   * @returns Promise<GeminiAnalysisResult>
   */
  async analyzeScene(
    image: File, 
    detail: 'short' | 'medium' | 'detailed' = 'medium'
  ): Promise<GeminiAnalysisResult> {
    try {
      return await analyzeScene(image, detail);
    } catch (error: any) {
      throw this.handleAnalysisError(error);
    }
  }

  /**
   * Analyze an image for artistic style and aesthetic analysis
   * @param image - The image file to analyze
   * @param detail - Detail level for analysis
   * @returns Promise<GeminiAnalysisResult>
   */
  async analyzeStyle(
    image: File, 
    detail: 'short' | 'medium' | 'detailed' = 'medium'
  ): Promise<GeminiAnalysisResult> {
    try {
      return await analyzeStyle(image, detail);
    } catch (error: any) {
      throw this.handleAnalysisError(error);
    }
  }

  /**
   * Handle and categorize analysis errors
   * @param error - The original error
   * @returns ImageAnalysisError
   */
  private handleAnalysisError(error: any): ImageAnalysisError {
    const message = error.message || error.toString();
    
    if (message.includes('429')) {
      return {
        type: 'rate_limit',
        message: 'API Rate Limit Exceeded: You\'ve hit your Gemini API quota. Please wait a few minutes and try again.',
        originalError: error
      };
    } else if (message.includes('401')) {
      return {
        type: 'auth',
        message: 'API Authentication Error: Please check your VITE_GEMINI_API_KEY.',
        originalError: error
      };
    } else if (message.includes('403')) {
      return {
        type: 'forbidden',
        message: 'API Access Forbidden: Your API key may not have access to the Gemini model.',
        originalError: error
      };
    } else {
      return {
        type: 'unknown',
        message: `Analysis failed: ${message}`,
        originalError: error
      };
    }
  }
}

// Export a default instance for convenience
export const imageAnalysisService = new ImageAnalysisService();