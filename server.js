import express from 'express';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { GoogleAuth } from 'google-auth-library';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '.env.server') });

const app = express();
const port = process.env.PORT || 3000;

// Ensure the directory for storyboards exists
const storyboardsDir = 'public/storyboards';
if (!fs.existsSync(storyboardsDir)) {
  fs.mkdirSync(storyboardsDir, { recursive: true });
}

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Middleware
app.use(cors({
  origin: ['http://localhost:8085', 'http://localhost:5173', 'http://localhost:5174'], // Allow Vite dev server
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
export async function callGeminiClassic(prompt, model = 'gemini-pro') {
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
export async function callGeminiWithImages(prompt, imageDataUrls, model = 'gemini-2.5-flash', generationConfig = null) {
  const endpoint = `https://generativelanguage.googleapis.com/v1/models/${model}:generateContent?key=${process.env.GOOGLE_API_KEY}`;
  
  console.log('🔧 Gemini Image API Call:', { 
    model, 
    endpoint: endpoint.replace(/key=.+/, 'key=***'), 
    promptLength: prompt.length, 
    imageCount: imageDataUrls.length,
    generationConfig: generationConfig
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
      generationConfig: generationConfig || {
        temperature: 0.9,
        topP: 0.9,
        topK: 40,
        maxOutputTokens: 1000,
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
    console.log('🔧 Received image analysis request');
    const { prompt, imageDataUrls, model, generationConfig } = req.body;
    
    console.log('🔧 Request params:', {
      promptLength: prompt?.length,
      imageCount: imageDataUrls?.length,
      model,
      generationConfig
    });
    
    if (!prompt || !imageDataUrls || !Array.isArray(imageDataUrls)) {
      console.log('❌ Invalid request parameters');
      return res.status(400).json({ error: 'Prompt and imageDataUrls array are required' });
    }

    console.log('🔧 Calling Gemini API...');
    const result = await callGeminiWithImages(prompt, imageDataUrls, model, generationConfig);
    console.log('✅ Gemini API call successful');
    res.json(result);
  } catch (error) {
    console.error('❌ Image analysis error:', error);
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

app.get('/api/ping', (req, res) => {
  res.json({ message: 'pong' });
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
app.listen(port, () => {
  console.log(`🚀 Server running on http://localhost:${port}`);
  console.log(`🔧 Health check: http://localhost:${port}/api/health`);
  console.log(`🧪 Test endpoint: http://localhost:${port}/api/test`);
  
  // Run startup test
  // setTimeout(async () => {
  //   try {
  //     console.log('🧪 Running startup test...');
  //     await callGeminiClassic('ping');
  //     console.log('✅ Startup test successful - API key is working');
  //   } catch (error) {
  //     console.error('❌ Startup test failed:', error.message);
  //   }
  // }, 1000);
});

// --- Storyboard Generator In-Memory Store and Utilities ---
const storyboardStore = {};

function deterministicSeed(storyboardId, extra = "") {
  // Simple deterministic seed based on storyboardId and extra string
  let hash = 0;
  const str = storyboardId + (extra || "");
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

async function generateStoryboardFrames(plan, seed) {
  // Generate real images using Gemini 2.5 Flash for each frame
  const model = 'imagegeneration@006';
  const frames = [];
  try {
    for (let i = 0; i < plan.frames.length; i++) {
      const description = plan.frames[i]?.description || `Frame ${i + 1}`;
      // Call Gemini API to generate image for this frame
      let image_url = '';
      let attempts = 0;
      while (attempts < 3) {
        try {
          // Compose prompt for image generation
          const prompt = `Generate a cinematic storyboard frame: ${description}`;
          const endpoint = `https://us-central1-aiplatform.googleapis.com/v1/projects/${process.env.GOOGLE_PROJECT_ID}/locations/us-central1/publishers/google/models/${model}:predict`;
          const body = {
            instances: [
              {
                prompt: prompt,
              },
            ],
            parameters: {
              sampleCount: 1,
            },
          };
          const accessToken = await getAccessToken();
          const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${accessToken}`,
            },
            body: JSON.stringify(body),
          });

          if (response.ok) {
            const data = await response.json();
            // Log the full Gemini API response for debugging
            console.log(
              `🟦 Gemini API raw response for frame ${i + 1}:`,
              JSON.stringify(data, null, 2)
            );
            const imageBase64 = data?.predictions?.[0]?.bytesBase64Encoded;
            if (imageBase64) {
              const imageBuffer = Buffer.from(imageBase64, 'base64');
              const imageFileName = `frame_${seed}_${i + 1}.png`;
              const imagePath = join(storyboardsDir, imageFileName);
              fs.writeFileSync(imagePath, imageBuffer);
              image_url = `/storyboards/${imageFileName}`;
              break; // Success, exit retry loop
            } else {
              const availableKeys = Object.keys(data || {}).join(', ');
              const errorMessage = `Image generation failed for frame ${i + 1}: Predictions not found in response. Available keys: ${availableKeys}`;
              console.error(errorMessage);
              image_url = `https://dummyimage.com/512x288/eee/333&text=ERROR: ${errorMessage}`;
            }
          } else {
            const errorText = await response.text();
            console.error(`Image generation failed for frame ${i+1} with status ${response.status}: ${errorText}`);
            image_url = `https://dummyimage.com/512x288/eee/333&text=ERROR: ${errorText}`;
          }
        } catch (err) {
          console.error('Error in generateStoryboardFrames for frame ' + (i+1), err);
          image_url = `https://dummyimage.com/512x288/eee/333&text=ERROR: ${err.message}`;
        }

        attempts++;
        if (attempts < 3) {
          console.log(`Retrying frame ${i + 1}, attempt ${attempts + 1}...`);
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
      if (i === 6) {
        console.log('Logging details for 7th frame:', {i, image_url, description});
      }
      frames.push({
        id: `frame_${i + 1}`,
        image_url,
        title: `Scene ${i + 1}`,
        description,
      });

      // Add a delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  } catch (e) {
    console.error('Error in generateStoryboardFrames loop', e);
  }
  return frames;
}

// --- Storyboard API Endpoints ---
function rateLimit(ip, endpoint) {
  // Dummy rate limiter: always allow
  return true;
}

const metricsStore = {
  record: function(endpoint, duration, success) {
    // Dummy metrics: do nothing
  },
  get: function() {
    return { requests: 0, success: 0, errors: 0 };
  }
};
app.post('/api/storyboards/generate', async (req, res) => {
  const start = Date.now();
  const ip = req.ip;
  if (!rateLimit(ip, 'generate')) {
    // logger.warn({ endpoint: 'generate', ip }, 'Rate limit exceeded');
    metricsStore.record('generate', Date.now() - start, false);
    return res.status(429).json({ error: 'Rate limit exceeded' });
  }
  try {
    // logger.info({ endpoint: 'generate', ip, params: req.body }, 'Storyboard generation requested');
    const { storyboardId, plan } = req.body;
    if (!storyboardId || !plan || !Array.isArray(plan.frames) || plan.frames.length !== 7) {
      metricsStore.record('generate', Date.now() - start, false);
      return res.status(400).json({ error: 'Invalid storyboard plan. Must include storyboardId and 7 frames.' });
    }
    // Idempotency: If storyboard exists, return it
    if (storyboardStore[storyboardId]) {
      metricsStore.record('generate', Date.now() - start, true);
      return res.json(storyboardStore[storyboardId]);
    }
    // Deterministic seed
    const seed = deterministicSeed(storyboardId);
    const frames = await generateStoryboardFrames(plan, seed); // Await the async function
    const storyboard = { storyboardId, frames, plan, seed };
    storyboardStore[storyboardId] = storyboard;
    metricsStore.record('generate', Date.now() - start, true);
    // logger.info({ endpoint: 'generate', ip, storyboardId }, 'Storyboard generated');
    res.json(storyboard);
  } catch (error) {
    // logger.error({ endpoint: 'generate', ip, error: error.message }, 'Storyboard generation failed');
    metricsStore.record('generate', Date.now() - start, false);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/storyboards/extend', async (req, res) => {
  const start = Date.now();
  const ip = req.ip;
  if (!rateLimit(ip, 'extend')) {
    // logger.warn({ endpoint: 'extend', ip }, 'Rate limit exceeded');
    metricsStore.record('extend', Date.now() - start, false);
    return res.status(429).json({ error: 'Rate limit exceeded' });
  }
  try {
    // logger.info({ endpoint: 'extend', ip, params: req.body }, 'Storyboard extension requested');
    const { storyboardId, extraFrames } = req.body;
    if (!storyboardId || !Array.isArray(extraFrames) || extraFrames.length === 0) {
      metricsStore.record('extend', Date.now() - start, false);
      return res.status(400).json({ error: 'Invalid extend request. Must include storyboardId and extraFrames array.' });
    }
    const existing = storyboardStore[storyboardId];
    if (!existing) {
      metricsStore.record('extend', Date.now() - start, false);
      return res.status(404).json({ error: 'Storyboard not found.' });
    }
    // Deterministic seed for extension
    const seed = deterministicSeed(storyboardId, 'extend');
    const newFrames = extraFrames.map((frame, i) => ({
      frame: existing.frames.length + i + 1,
      description: frame.description || `Frame ${existing.frames.length + i + 1}`,
      seed: seed + i,
      image_url: `https://dummyimage.com/512x288/eee/333&text=Frame+${existing.frames.length + i + 1}`
    }));
    existing.frames.push(...newFrames);
    metricsStore.record('extend', Date.now() - start, true);
    // logger.info({ endpoint: 'extend', ip, storyboardId }, 'Storyboard extended');
    res.json(existing);
  } catch (error) {
    // logger.error({ endpoint: 'extend', ip, error: error.message }, 'Storyboard extension failed');
    metricsStore.record('extend', Date.now() - start, false);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/storyboards/plan', async (req, res) => {
  console.log('Received request at /api/storyboards/plan');
  const start = Date.now();
  const ip = req.ip;
  if (!rateLimit(ip, 'plan')) {
    metricsStore.record('plan', Date.now() - start, false);
    return res.status(429).json({ error: 'Rate limit exceeded' });
  }
  try {
    const { storyboardId, intent } = req.body;
    if (!storyboardId || !intent || typeof intent !== 'string') {
      metricsStore.record('plan', Date.now() - start, false);
      return res.status(400).json({ error: 'Invalid plan request. Must include storyboardId and intent string.' });
    }

    // Generate a real plan using Gemini
    const prompt = `Create a 7-frame storyboard plan for the intent: '${intent}'. Return ONLY a JSON object with a 'frames' array. Each object in the array should have a 'description' field with a detailed scene description. Do not include any other text, comments, or markdown formatting in your response.`;
    
    const geminiResponse = await callGeminiClassic(prompt);
    
    // Log the raw response for debugging
    console.log('Gemini plan response:', JSON.stringify(geminiResponse, null, 2));

    const responseText = geminiResponse.candidates[0].content.parts[0].text;
    
    // Clean the response to ensure it's valid JSON
    const cleanedJson = responseText.replace(/```json/g, '').replace(/```/g, '').trim();

    const planData = JSON.parse(cleanedJson);

    const plan = {
      storyboardId,
      frames: planData.frames,
    };

    metricsStore.record('plan', Date.now() - start, true);
    res.json(plan);
  } catch (error) {
    console.error('Storyboard plan failed:', error);
    metricsStore.record('plan', Date.now() - start, false);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/storyboards/edit', async (req, res) => {
  const start = Date.now();
  const ip = req.ip;
  if (!rateLimit(ip, 'edit')) {
    // logger.warn({ endpoint: 'edit', ip }, 'Rate limit exceeded');
    metricsStore.record('edit', Date.now() - start, false);
    return res.status(429).json({ error: 'Rate limit exceeded' });
  }
  try {
    // logger.info({ endpoint: 'edit', ip, params: req.body }, 'Storyboard edit requested');
    const { storyboardId, frameIndex, newDescription } = req.body;
    if (!storyboardId || typeof frameIndex !== 'number' || typeof newDescription !== 'string') {
      metricsStore.record('edit', Date.now() - start, false);
      return res.status(400).json({ error: 'Invalid edit request. Must include storyboardId, frameIndex (number), and newDescription (string).' });
    }
    const storyboard = storyboardStore[storyboardId];
    if (!storyboard) {
      metricsStore.record('edit', Date.now() - start, false);
      return res.status(404).json({ error: 'Storyboard not found.' });
    }
    if (frameIndex < 0 || frameIndex >= storyboard.frames.length) {
      metricsStore.record('edit', Date.now() - start, false);
      return res.status(400).json({ error: 'Frame index out of bounds.' });
    }
    storyboard.frames[frameIndex].description = newDescription;
    metricsStore.record('edit', Date.now() - start, true);
    // logger.info({ endpoint: 'edit', ip, storyboardId }, 'Storyboard frame edited');
    res.json(storyboard);
  } catch (error) {
    // logger.error({ endpoint: 'edit', ip, error: error.message }, 'Storyboard edit failed');
    metricsStore.record('edit', Date.now() - start, false);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/storyboards/metrics', (req, res) => {
  return res.json(metricsStore.get());
});

async function getAccessToken() {
  try {
    const keyFilePath = process.env.GOOGLE_APPLICATION_CREDENTIALS || join(__dirname, 'gen-lang-client-0478811083-eaff1cc67090.json');
    const auth = new GoogleAuth({
      keyFile: keyFilePath,
      scopes: 'https://www.googleapis.com/auth/cloud-platform'
    });
    const client = await auth.getClient();
    const accessToken = await client.getAccessToken();
    return accessToken.token;
  } catch (error) {
    console.error('❌ Error getting access token:', error);
    throw new Error('Could not get access token');
  }
}