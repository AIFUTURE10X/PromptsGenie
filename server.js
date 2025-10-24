import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load server-side environment variables
dotenv.config({ path: join(__dirname, '.env.server') });

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: ['http://localhost:8085', 'http://localhost:5173'], // Allow Vite dev server
  credentials: true
}));
app.use(express.json({ limit: '10mb' })); // Increased limit for image data

// API Key validation and diagnostics
const API_KEY = process.env.GOOGLE_API_KEY?.trim();

console.log('🔧 Server Startup Diagnostics:');
console.log('GOOGLE_API_KEY length:', API_KEY?.length || 0);
console.log('GOOGLE_API_KEY last4:', API_KEY?.slice(-4) || 'NOT_SET');

if (!API_KEY) {
  console.error('❌ Missing GOOGLE_API_KEY in .env.server file');
  process.exit(1);
}

// Classic Generative Language REST API implementation
export async function callGeminiClassic(prompt, model = 'gemini-2.5-flash') {
  const endpoint = `https://generativelanguage.googleapis.com/v1/models/${model}:generateContent?key=${process.env.GOOGLE_API_KEY}`;
  
  console.log('🔧 Gemini API Call:', { model, endpoint: endpoint.replace(/key=.+/, 'key=***'), promptLength: prompt.length });
  
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
    }),
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    console.error(`❌ Gemini classic ${response.status}:`, errorText);
    throw new Error(`Gemini classic ${response.status}: ${errorText}`);
  }
  
  return response.json();
}

// Image analysis with Classic API
export async function callGeminiWithImages(prompt, imageDataUrls, model = 'gemini-2.5-flash') {
  const endpoint = `https://generativelanguage.googleapis.com/v1/models/${model}:generateContent?key=${process.env.GOOGLE_API_KEY}`;
  
  console.log('🔧 Gemini Image API Call:', { 
    model, 
    endpoint: endpoint.replace(/key=.+/, 'key=***'), 
    promptLength: prompt.length, 
    imageCount: imageDataUrls.length 
  });

  const parts = [
    { text: prompt },
    ...imageDataUrls.map(dataUrl => {
      const [header, base64] = dataUrl.split(',');
      const mimeType = header.replace('data:', '').replace(';base64', '');
      return {
        inlineData: {
          mimeType,
          data: base64,
        },
      };
    }),
  ];

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      contents: [{ role: 'user', parts }],
      generationConfig: {
        temperature: 0.9,
        topP: 0.9,
        topK: 40,
        maxOutputTokens: 512,
      },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`❌ Gemini image analysis ${response.status}:`, errorText);
    throw new Error(`Gemini image analysis ${response.status}: ${errorText}`);
  }

  return response.json();
}

// API Routes
app.post('/api/gemini/text', async (req, res) => {
  try {
    const { prompt, model } = req.body;
    
    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    const result = await callGeminiClassic(prompt, model);
    res.json(result);
  } catch (error) {
    console.error('Text generation error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/gemini/images', async (req, res) => {
  try {
    const { prompt, imageDataUrls, model } = req.body;
    
    if (!prompt || !imageDataUrls || !Array.isArray(imageDataUrls)) {
      return res.status(400).json({ error: 'Prompt and imageDataUrls array are required' });
    }

    const result = await callGeminiWithImages(prompt, imageDataUrls, model);
    res.json(result);
  } catch (error) {
    console.error('Image analysis error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    apiKeyConfigured: !!API_KEY 
  });
});

// Test endpoint
app.get('/api/test', async (req, res) => {
  try {
    console.log('🧪 Running API test...');
    const result = await callGeminiClassic('ping');
    console.log('✅ API test successful');
    res.json({ success: true, result });
  } catch (error) {
    console.error('❌ API test failed:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Test the API on startup
const testModel = 'gemini-pro';

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`🔧 Health check: http://localhost:${PORT}/api/health`);
  console.log(`🧪 Test endpoint: http://localhost:${PORT}/api/test`);
  
  // Run startup test
  setTimeout(async () => {
    try {
      console.log('🧪 Running startup test...');
      await callGeminiClassic('ping');
      console.log('✅ Startup test successful - API key is working');
    } catch (error) {
      console.error('❌ Startup test failed:', error.message);
    }
  }, 1000);
});