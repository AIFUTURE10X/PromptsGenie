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

exports.handler = async (event, context) => {
  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
      },
      body: ''
    };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  console.log('Received request at /api/storyboards/plan');

  try {
    const { storyboardId, intent } = JSON.parse(event.body);

    if (!storyboardId || !intent || typeof intent !== 'string') {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({ error: 'Invalid plan request. Must include storyboardId and intent string.' })
      };
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

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify(plan)
    };
  } catch (error) {
    console.error('Storyboard plan failed:', error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({ error: error.message })
    };
  }
};
