// Test script to verify the /api/gemini/text endpoint
async function testTextEndpoint() {
  try {
    console.log('🧪 Testing /api/gemini/text endpoint...');
    
    const response = await fetch('http://localhost:3001/api/gemini/text', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt: 'Convert this description into a detailed prompt: A beautiful sunset over mountains',
        model: 'gemini-2.5-flash'
      }),
    });

    console.log('📡 Response status:', response.status);
    console.log('📡 Response ok:', response.ok);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Server error:', response.status, errorText);
      return;
    }

    const result = await response.json();
    console.log('✅ Response received:', {
      hasCandidates: !!result.candidates,
      candidatesLength: result.candidates?.length || 0,
      hasText: !!result.text,
      keys: Object.keys(result || {})
    });

    const generatedText = result.candidates?.[0]?.content?.parts?.[0]?.text || result.text || '';
    console.log('📝 Generated text length:', generatedText.length);
    console.log('📝 Generated text preview:', generatedText.substring(0, 200) + '...');

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testTextEndpoint();