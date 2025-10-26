/**
 * Example usage of Image Analysis SDK v1
 * 
 * This example demonstrates how to use the SDK for different types of image analysis.
 */

import { imageAnalysisService, ImageAnalysisError } from './src/index';

// Example: Basic image analysis
async function basicImageAnalysis(imageFile: File) {
  try {
    const result = await imageAnalysisService.analyzeImage(imageFile, {
      detail: 'medium',
      analysisType: 'general'
    });
    
    console.log('Analysis Result:', result.description);
    console.log('Colors:', result.colors);
    console.log('Mood:', result.mood);
    console.log('Style:', result.style);
  } catch (error) {
    handleAnalysisError(error as ImageAnalysisError);
  }
}

// Example: Subject-focused analysis
async function subjectAnalysis(imageFile: File) {
  try {
    const result = await imageAnalysisService.analyzeSubject(imageFile, 'detailed');
    console.log('Subject Analysis:', result.description);
    console.log('Objects found:', result.objects);
  } catch (error) {
    handleAnalysisError(error as ImageAnalysisError);
  }
}

// Example: Scene analysis
async function sceneAnalysis(imageFile: File) {
  try {
    const result = await imageAnalysisService.analyzeScene(imageFile, 'detailed');
    console.log('Scene Analysis:', result.description);
    console.log('Scene type:', result.scene);
    console.log('Lighting:', result.lighting);
    console.log('Composition:', result.composition);
  } catch (error) {
    handleAnalysisError(error as ImageAnalysisError);
  }
}

// Example: Style analysis
async function styleAnalysis(imageFile: File) {
  try {
    const result = await imageAnalysisService.analyzeStyle(imageFile, 'detailed');
    console.log('Style Analysis:', result.description);
    console.log('Artistic style:', result.style);
    console.log('Technical aspects:', result.technical);
  } catch (error) {
    handleAnalysisError(error as ImageAnalysisError);
  }
}

// Example: Error handling
function handleAnalysisError(error: ImageAnalysisError) {
  switch (error.type) {
    case 'rate_limit':
      console.error('Rate limit exceeded. Please wait before trying again.');
      break;
    case 'auth':
      console.error('Authentication failed. Please check your API key.');
      break;
    case 'forbidden':
      console.error('Access forbidden. Please check your API permissions.');
      break;
    default:
      console.error('Analysis failed:', error.message);
  }
}

// Example: Batch analysis
async function batchAnalysis(imageFiles: File[]) {
  const results = [];
  
  for (const file of imageFiles) {
    try {
      const result = await imageAnalysisService.analyzeImage(file, {
        detail: 'medium',
        analysisType: 'general'
      });
      results.push({ file: file.name, result });
    } catch (error) {
      console.error(`Failed to analyze ${file.name}:`, error);
      results.push({ file: file.name, error });
    }
  }
  
  return results;
}

// Example usage in a web application
export function setupImageAnalysis() {
  const fileInput = document.createElement('input');
  fileInput.type = 'file';
  fileInput.accept = 'image/*';
  
  fileInput.addEventListener('change', async (event) => {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) {
      console.log('Analyzing image:', file.name);
      await basicImageAnalysis(file);
    }
  });
  
  document.body.appendChild(fileInput);
}

export {
  basicImageAnalysis,
  subjectAnalysis,
  sceneAnalysis,
  styleAnalysis,
  batchAnalysis,
  handleAnalysisError
};