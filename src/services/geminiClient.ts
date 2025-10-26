import { GoogleGenerativeAI } from '@google/generative-ai';

import { config } from '../config';
import { type ModelCallResult } from '../types/api';

export interface GeminiCallOptions {
  model: string;
  prompt: string;
  imageData?: { base64?: string; mimeType: string };
  timeout: number;
}

// Initialize the Gemini API
const genAI = new GoogleGenerativeAI(config.geminiApiKey);

export async function callGemini(options: GeminiCallOptions): Promise<ModelCallResult> {
  const startTime = Date.now();
  
  try {
    const model = genAI.getGenerativeModel({ model: options.model });
    
    let result;
    if (options.imageData && options.imageData.base64) {
      // Handle image + text generation
      const imagePart = {
        inlineData: {
          data: options.imageData.base64,
          mimeType: options.imageData.mimeType,
        },
      };
      
      result = await model.generateContent([options.prompt, imagePart]);
    } else {
      // Handle text-only generation
      result = await model.generateContent(options.prompt);
    }
    
    const response = result.response;
    const text = response.text();
    const latency = Date.now() - startTime;
    
    return {
      text,
      model: options.model,
      latency,
      confidence: 0.8, // Default confidence score
    };
  } catch (error: any) {
    const _latency = Date.now() - startTime;
    
    // Enhanced error handling
    if (error.message?.includes('429')) {
      throw new Error('API Rate Limit: You\'ve exceeded your Gemini API quota. Please wait a few minutes and try again.');
    } else if (error.message?.includes('401')) {
      throw new Error('API Authentication Error: Please check your VITE_GEMINI_API_KEY in the .env file.');
    } else if (error.message?.includes('403')) {
      throw new Error('API Access Forbidden: Your API key may not have access to the Gemini model.');
    } else if (error.message?.includes('400')) {
      throw new Error('Invalid Request: The request format may be incorrect or the model may not be supported.');
    } else if (error.message?.includes('500')) {
      throw new Error('Server Error: Gemini API is experiencing issues. Please try again later.');
    } else {
      throw new Error(`Gemini API call failed: ${error.message || 'Unknown error occurred'}`);
    }
  }
}

export async function callWithFallback(
  primaryModel: string,
  fallbackModel: string,
  prompt: string,
  imageData?: { base64?: string; mimeType: string },
  timeout: number = 30000
): Promise<ModelCallResult> {
  try {
    return await callGemini({
      model: primaryModel,
      prompt,
      imageData,
      timeout,
    });
  } catch (error) {
    console.warn(`Primary model ${primaryModel} failed, trying fallback ${fallbackModel}:`, error);
    
    return await callGemini({
      model: fallbackModel,
      prompt,
      imageData,
      timeout,
    });
  }
}