// Test server generationConfig handling
async function testServerConfig() {
  try {
    console.log('🧪 Testing server generationConfig handling...');
    
    const testImageBase64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==';
    
    // Test with explicit generationConfig
    const response = await fetch('http://localhost:8085/api/gemini/images', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt: 'Describe this image briefly.',
        imageDataUrls: [testImageBase64],
        model: 'gemini-2.5-flash',
        generationConfig: {
          maxOutputTokens: 1000,
          temperature: 0.3,
          topP: 0.9,
          topK: 40
        }
      })
    });

    console.log('📊 Response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Error response:', errorText);
      return;
    }

    const result = await response.json();
    console.log('✅ Server Response:', JSON.stringify(result, null, 2));

    // Check if we got a complete response
    const hasContent = result.candidates?.[0]?.content?.parts?.[0]?.text;
    const finishReason = result.candidates?.[0]?.finishReason;
    
    console.log('📝 Has content:', !!hasContent);
    console.log('🏁 Finish reason:', finishReason);
    console.log('🔢 Total tokens:', result.usageMetadata?.totalTokenCount);

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testServerConfig();