// Test script for image analysis API
// Using native fetch (Node.js 18+)

// Simple 1x1 red pixel PNG as base64 for testing
const testImageBase64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==';

async function testImageAnalysis() {
  try {
    console.log('🧪 Testing image analysis API...');
    
    const response = await fetch('http://localhost:8085/api/gemini/images', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt: 'You are a professional prompt engineer. Analyze the input image and produce a detailed, vivid prompt suitable for image generation models. Include subject, setting, style, lighting, composition, lens, and mood. Expand on important details.',
        imageDataUrls: [testImageBase64],
        model: 'gemini-2.5-flash',
        generationConfig: {
    maxOutputTokens: 1000,
    temperature: 0.3
  }
      })
    });

    console.log('📊 Response status:', response.status);
    console.log('📊 Response headers:', Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ API Error:', response.status, errorText);
      return;
    }

    const result = await response.json();
    console.log('✅ API Response:', JSON.stringify(result, null, 2));
    
    // Check if we got a valid response structure
    if (result && result.candidates && result.candidates.length > 0) {
      const text = result.candidates[0]?.content?.parts?.map(p => p.text).join('\n') || '';
      console.log('📝 Extracted text:', text);
      
      if (text.trim().length > 0) {
        console.log('✅ Image analysis is working correctly!');
      } else {
        console.log('⚠️ Image analysis returned empty text');
      }
    } else {
      console.log('⚠️ Unexpected response structure:', result);
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Stack:', error.stack);
  }
}

// Run the test
testImageAnalysis();