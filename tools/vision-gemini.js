#!/usr/bin/env node

/**
 * Vision Gemini MCP Tool
 * Provides image analysis capabilities using Google's Gemini Vision API
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import fs from 'fs';
import path from 'path';

class VisionGeminiTool {
  constructor() {
    this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    this.model = this.genAI.getGenerativeModel({ model: 'gemini-pro-vision' });
  }

  async analyzeImage(imagePath, prompt = 'Describe this image in detail') {
    try {
      if (!fs.existsSync(imagePath)) {
        throw new Error(`Image file not found: ${imagePath}`);
      }

      const imageData = fs.readFileSync(imagePath);
      const base64Image = imageData.toString('base64');
      
      const result = await this.model.generateContent([
        prompt,
        {
          inlineData: {
            data: base64Image,
            mimeType: this.getMimeType(imagePath)
          }
        }
      ]);

      const response = await result.response;
      return response.text();
    } catch (error) {
      throw new Error(`Vision analysis failed: ${error.message}`);
    }
  }

  getMimeType(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    const mimeTypes = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.webp': 'image/webp'
    };
    return mimeTypes[ext] || 'image/jpeg';
  }

  async extractText(imagePath) {
    return this.analyzeImage(imagePath, 'Extract all text from this image');
  }

  async generatePrompt(imagePath) {
    return this.analyzeImage(imagePath, 'Generate a detailed prompt that could recreate this image');
  }
}

// MCP Tool Interface
const tool = new VisionGeminiTool();

export default {
  name: 'vision-gemini',
  description: 'Analyze images using Google Gemini Vision API',
  tools: [
    {
      name: 'analyze_image',
      description: 'Analyze an image and provide detailed description',
      inputSchema: {
        type: 'object',
        properties: {
          imagePath: {
            type: 'string',
            description: 'Path to the image file'
          },
          prompt: {
            type: 'string',
            description: 'Custom prompt for analysis (optional)',
            default: 'Describe this image in detail'
          }
        },
        required: ['imagePath']
      }
    },
    {
      name: 'extract_text',
      description: 'Extract text from an image using OCR',
      inputSchema: {
        type: 'object',
        properties: {
          imagePath: {
            type: 'string',
            description: 'Path to the image file'
          }
        },
        required: ['imagePath']
      }
    },
    {
      name: 'generate_prompt',
      description: 'Generate a prompt that could recreate the image',
      inputSchema: {
        type: 'object',
        properties: {
          imagePath: {
            type: 'string',
            description: 'Path to the image file'
          }
        },
        required: ['imagePath']
      }
    }
  ],
  async callTool(name, args) {
    switch (name) {
      case 'analyze_image':
        return await tool.analyzeImage(args.imagePath, args.prompt);
      case 'extract_text':
        return await tool.extractText(args.imagePath);
      case 'generate_prompt':
        return await tool.generatePrompt(args.imagePath);
      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  }
};