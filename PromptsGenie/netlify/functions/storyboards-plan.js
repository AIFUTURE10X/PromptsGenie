async function callGeminiClassic(prompt, model = "gemini-2.5-flash") {
  const endpoint = `https://generativelanguage.googleapis.com/v1/models/${model}:generateContent?key=${process.env.GOOGLE_API_KEY}`;

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
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
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
      },
      body: "",
    };
  }

  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify({ error: "Method not allowed" }),
    };
  }

  console.log("Received request at /api/storyboards/plan");

  try {
    const { storyboardId, intent, frameCount = 7 } = JSON.parse(event.body);

    if (!storyboardId || !intent || typeof intent !== "string") {
      return {
        statusCode: 400,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
        body: JSON.stringify({
          error:
            "Invalid plan request. Must include storyboardId and intent string.",
        }),
      };
    }

    // Validate frameCount
    const validFrameCount = Math.min(Math.max(frameCount, 3), 10); // Between 3 and 10

    // Generate a real plan using Gemini with enhanced character accuracy
    const prompt = `Create a ${validFrameCount}-frame storyboard plan for the intent: '${intent}'.

IMPORTANT GUIDELINES:
- Be very specific about character appearances and costumes in each scene description
- If the story involves Superman, describe him with: blue suit, red cape, 'S' symbol on chest
- If the story involves Jimmy Olsen, describe him as: young photographer with red hair, civilian clothes (NOT a Superman costume), carrying a camera
- Ensure character descriptions are consistent across all frames
- Include vivid details about setting, lighting, camera angles, and actions
- Each scene should be cinematic and visually compelling

Return ONLY a JSON object with a 'frames' array containing exactly ${validFrameCount} frames. Each object in the array should have a 'description' field with a detailed, specific scene description that includes character appearances, actions, setting details, and camera composition. Do not include any other text, comments, or markdown formatting in your response.`;

    const geminiResponse = await callGeminiClassic(prompt);

    // Log the raw response for debugging
    console.log(
      "Gemini plan response:",
      JSON.stringify(geminiResponse, null, 2)
    );

    const responseText = geminiResponse.candidates[0].content.parts[0].text;

    // Clean the response to ensure it's valid JSON
    const cleanedJson = responseText
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();

    const planData = JSON.parse(cleanedJson);

    const plan = {
      storyboardId,
      frames: planData.frames,
    };

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify(plan),
    };
  } catch (error) {
    console.error("Storyboard plan failed:", error);
    return {
      statusCode: 500,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify({ error: error.message }),
    };
  }
};
