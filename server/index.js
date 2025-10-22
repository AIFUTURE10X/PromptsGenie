import express from 'express';
import multer from 'multer';
import cors from 'cors';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fetch from 'node-fetch';

// Load environment variables
dotenv.config();

// Constants
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PORT = process.env.PORT || 3001;
const GEMINI_MODEL = process.env.GEMINI_MODEL_IMAGES || 'gemini-2.0-flash';
const API_BASE_URL = process.env.API_BASE_URL || 'https://generativelanguage.googleapis.com';

// Configure multer for file upload
const upload = multer({
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  }
});

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(join(__dirname, '..', 'web')));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ ok: true, model: GEMINI_MODEL });
});

// Image analysis endpoint
app.post('/analyze', upload.single('image'), async (req, res) => {
  try {
    // Validate request
    if (!req.file) {
      return res.status(400).json({ error: 'No image file provided' });
    }

    if (!process.env.GOOGLE_API_KEY) {
      return res.status(401).json({ error: 'API key not configured' });
    }

    // Prepare image data
    const base64Image = req.file.buffer.toString('base64');
    const mimeType = req.file.mimetype;

    // Prepare request to Gemini API
    const url = `${API_BASE_URL}/v1beta/models/${GEMINI_MODEL}:generateContent?key=${process.env.GOOGLE_API_KEY}`;
    const body = {
      contents: [
        {
          parts: [
            {
              text: "Analyze this image and produce a concise, high-quality generation prompt. Keep it under 120 words."
            },
            {
              inline_data: {
                mime_type: mimeType,
                data: base64Image
              }
            }
          ]
        }
      ],
      generationConfig: {
        maxOutputTokens: 180,
        temperature: 0.2
      }
    };

    // Call Gemini API
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Gemini API error:', error);
      return res.status(response.status).json({
        error: `Gemini API error: ${response.status} ${response.statusText}`
      });
    }

    const data = await response.json();
    const prompt = data.candidates[0].content.parts[0].text;

    res.json({ prompt });
  } catch (error) {
    console.error('Server error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});