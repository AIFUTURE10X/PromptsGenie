async function callGeminiClassic(prompt, model = 'gemini-pro') {
  const endpoint = `https://generativelanguage.googleapis.com/v1/models/${model}:generateContent?key=${process.env.GOOGLE_API_KEY}`;

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

  console.log('Received request at /api/storyboards/plan');

  try {
    const { storyboardId, intent } = req.body;

    if (!storyboardId || !intent || typeof intent !== 'string') {
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

    res.status(200).json(plan);
  } catch (error) {
    console.error('Storyboard plan failed:', error);
    res.status(500).json({ error: error.message });
  }
}
