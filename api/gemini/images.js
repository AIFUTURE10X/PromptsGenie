async function callGeminiWithImages(prompt, imageDataUrls, model = 'gemini-2.5-flash', generationConfig = null) {
  const endpoint = `https://generativelanguage.googleapis.com/v1/models/${model}:generateContent?key=${process.env.GOOGLE_API_KEY}`;

  console.log('🔧 Gemini Image API Call:', {
    model,
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

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

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
    res.status(200).json(result);
  } catch (error) {
    console.error('❌ Image analysis error:', error);
    res.status(500).json({ error: error.message });
  }
}
