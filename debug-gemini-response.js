// Debug script to examine Gemini API response structure
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.server' });

const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;

async function testGeminiAPI() {
  console.log('🧪 Testing Gemini API response structure...');
  
  // Simple 1x1 red pixel PNG as base64
  const testImageBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==';
  
  const endpoint = `https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=${GOOGLE_API_KEY}`;
  
  const requestBody = {
    contents: [{
      role: 'user',
      parts: [
        { text: 'Describe this image briefly.' },
        {
          inline_data: {
            mime_type: 'image/png',
            data: testImageBase64
          }
        }
      ]
    }],
    generationConfig: {
      temperature: 0.3,
      maxOutputTokens: 500
    }
  };
  
  console.log('📤 Request body:', JSON.stringify(requestBody, null, 2));
  
  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });
    
    console.log('📊 Response status:', response.status);
    console.log('📊 Response headers:', Object.fromEntries(response.headers));
    
    const responseData = await response.json();
    console.log('📥 Raw response:', JSON.stringify(responseData, null, 2));
    
    // Check if candidates exist and have content
    if (responseData.candidates && responseData.candidates[0]) {
      const candidate = responseData.candidates[0];
      console.log('🔍 First candidate:', JSON.stringify(candidate, null, 2));
      
      if (candidate.content && candidate.content.parts) {
        console.log('✅ Parts found:', candidate.content.parts);
        console.log('📝 Text content:', candidate.content.parts[0]?.text || 'No text');
      } else {
        console.log('❌ No parts found in content');
        console.log('🔍 Content structure:', candidate.content);
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testGeminiAPI();