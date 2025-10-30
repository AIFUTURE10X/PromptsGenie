// Direct Gemini API test with proper token limits
import dotenv from 'dotenv';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '.env.server') });

const API_KEY = process.env.GOOGLE_API_KEY?.trim();

if (!API_KEY) {
  console.error('❌ Missing GOOGLE_API_KEY');
  process.exit(1);
}

// Simple 1x1 red pixel PNG as base64 for testing
const testImageBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==';

async function testDirectGemini() {
  try {
    console.log('🧪 Testing direct Gemini API call...');
    
    const endpoint = `https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=${API_KEY}`;
    
    const requestBody = {
      contents: [{
        role: 'user',
        parts: [
          { text: 'Analyze this image and describe what you see.' },
          {
            inlineData: {
              mimeType: 'image/png',
              data: testImageBase64,
            },
          },
        ],
      }],
      generationConfig: {
        temperature: 0.3,
        topP: 0.9,
        topK: 40,
        maxOutputTokens: 1000,
      },
    };

    console.log('📤 Request body:', JSON.stringify(requestBody, null, 2));

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    console.log('📊 Response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Error response:', errorText);
      return;
    }

    const result = await response.json();
    console.log('✅ Raw API Response:', JSON.stringify(result, null, 2));

    // Extract text from response
    const text = result.candidates?.[0]?.content?.parts?.[0]?.text || '';
    console.log('📝 Extracted text:', text || '⚠️ No text found');

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testDirectGemini();