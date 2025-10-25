// Main exports for Image Analysis SDK v1
export { ImageAnalysisService, imageAnalysisService } from './ImageAnalysisService';
export type { ImageAnalysisOptions, ImageAnalysisError } from './ImageAnalysisService';

// Core service functions
export { 
  analyzeImage, 
  analyzeSubject, 
  analyzeScene, 
  analyzeStyle 
} from './services/gemini';

// Types
export type { 
  GeminiAnalysisResult, 
  GeminiAnalysisOptions,
  DetailLevel 
} from './types/gemini';

// Components (for React integration)
export { default as ImageDropZone } from './components/ImageDropZone';

// Configuration
export { config } from './config';

// Library utilities
export * from './lib/imageAnalysis';
export * from './lib/geminiPrompts';