// Debug script to test metadata loading
console.log('🔍 Debugging Metadata Loading');

// Test environment variables
console.log('Environment Variables:');
console.log('VITE_GEMINI_API_KEY:', import.meta.env.VITE_GEMINI_API_KEY ? 'SET' : 'NOT SET');
console.log('VITE_GEMINI_MODEL_IMAGE:', import.meta.env.VITE_GEMINI_MODEL_IMAGE);
console.log('VITE_GEMINI_MODEL_TEXT:', import.meta.env.VITE_GEMINI_MODEL_TEXT);

// Test config loading
import { config } from './src/config.js';
console.log('Config object:', config);

// Test metadata interfaces
console.log('Testing metadata structures...');

// Simulate image metadata
const mockImageMetadata = {
  model: 'gemini-2.5-flash',
  inputType: 'base64',
  imageSize: 1024000,
  mimeType: 'image/jpeg',
  analysisType: 'general',
  fallbackUsed: false
};

console.log('Mock metadata:', mockImageMetadata);

// Test if metadata is properly structured
const isValidMetadata = (metadata) => {
  const requiredFields = ['model', 'inputType', 'imageSize', 'mimeType', 'analysisType', 'fallbackUsed'];
  return requiredFields.every(field => metadata.hasOwnProperty(field));
};

console.log('Metadata validation:', isValidMetadata(mockImageMetadata));