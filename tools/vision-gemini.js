#!/usr/bin/env node

/**
 * Google Gemini Vision MCP Tool
 * Provides structured image analysis with robust JSON parsing and error handling
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import fs from 'fs/promises';
import path from 'path';

// Environment variable validation with fail-fast behavior
const apiKey = process.env.GOOGLE_API_KEY || process.env.VITE_GEMINI_API_KEY;
if (!apiKey) {
  console.error('❌ Missing GOOGLE_API_KEY environment variable');
  console.error('Please set GOOGLE_API_KEY in your environment or GitHub secrets');
  process.exit(1);
}

// Initialize Gemini with proper model selection
const genAI = new GoogleGenerativeAI(apiKey);
const model = genAI.getGenerativeModel({ 
  model: process.env.GEMINI_MODEL || 'gemini-1.5-flash' 
});

/**
 * Robust JSON parser with fallback handling
 * @param {string} text - Raw text response from Gemini
 * @returns {object} Parsed JSON or fallback structure
 */
function tryParseJson(text) {
  try {
    // Try to extract JSON from markdown code blocks
    const jsonMatch = text.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[1]);
    }
    
    // Try to parse the entire text as JSON
    return JSON.parse(text);
  } catch (error) {
    // Fallback structure for non-JSON responses
    return {
      description: text.trim(),
      ocrText: "",
      objects: [],
      tags: [],
      metadata: {
        parseError: true,
        originalResponse: text.substring(0, 500) // Truncate for logging
      }
    };
  }
}

/**
 * Convert file path to base64 data URL
 * @param {string} imagePath - Path to image file
 * @returns {Promise<string>} Base64 encoded image data
 */
async function imageToBase64(imagePath) {
  try {
    const imageBuffer = await fs.readFile(imagePath);
    const ext = path.extname(imagePath).toLowerCase();
    
    // Map file extensions to MIME types
    const mimeTypes = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.webp': 'image/webp'
    };
    
    const mimeType = mimeTypes[ext] || 'image/jpeg';
    return {
      mimeType,
      data: imageBuffer.toString('base64')
    };
  } catch (error) {
    throw new Error(`Failed to read image file: ${error.message}`);
  }
}

/**
 * Analyze image with Gemini Vision API
 * @param {string} imagePath - Path to image file
 * @param {object} options - Analysis options
 * @returns {Promise<object>} Structured analysis result
 */
async function analyzeImage(imagePath, options = {}) {
  try {
    const imageData = await imageToBase64(imagePath);
    
    // Construct structured prompt for consistent JSON output
    const prompt = `Analyze this image and return a JSON response with the following structure:
{
  "description": "Detailed description of the image",
  "ocrText": "Any text found in the image",
  "objects": [
    {
      "label": "object name",
      "confidence": 0.95,
      "bbox": [x, y, width, height]
    }
  ],
  "tags": ["tag1", "tag2", "tag3"],
  "metadata": {
    "colors": ["primary", "secondary"],
    "lighting": "description",
    "composition": "description",
    "style": "description",
    "mood": "description"
  }
}

Please ensure the response is valid JSON. Focus on accuracy and detail.`;

    const result = await model.generateContent({
      contents: [{
        role: "user",
        parts: [
          { text: prompt },
          { 
            inlineData: {
              mimeType: imageData.mimeType,
              data: imageData.data
            }
          }
        ]
      }]
    });

    const response = result.response;
    const text = response.text();
    
    // Parse with robust error handling
    const parsed = tryParseJson(text);
    
    // Add processing metadata
    parsed.metadata = {
      ...parsed.metadata,
      processedAt: new Date().toISOString(),
      model: process.env.GEMINI_MODEL || 'gemini-1.5-flash',
      apiVersion: 'v1'
    };

    return parsed;

  } catch (error) {
    // Structured error response
    return {
      error: true,
      message: error.message,
      description: `Failed to analyze image: ${error.message}`,
      ocrText: "",
      objects: [],
      tags: [],
      metadata: {
        error: true,
        errorType: error.constructor.name,
        processedAt: new Date().toISOString()
      }
    };
  }
}

/**
 * Main CLI interface
 */
async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.error('Usage: node vision-gemini.js <image-path>');
    process.exit(1);
  }

  const imagePath = args[0];
  
  // Validate image file exists
  try {
    await fs.access(imagePath);
  } catch (error) {
    console.error(`❌ Image file not found: ${imagePath}`);
    process.exit(1);
  }

  console.log(`🔍 Analyzing image: ${imagePath}`);
  
  const result = await analyzeImage(imagePath);
  
  // Output structured JSON for MCP consumption
  console.log(JSON.stringify(result, null, 2));
  
  if (result.error) {
    process.exit(1);
  }
}

// Handle unhandled rejections
process.on('unhandledRejection', (error) => {
  console.error('❌ Unhandled rejection:', error.message);
  process.exit(1);
});

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(error => {
    console.error('❌ Fatal error:', error.message);
    process.exit(1);
  });
}

export { analyzeImage, tryParseJson };