import { NextRequest, NextResponse } from 'next/server';
import { analysisRequestSchema, type AnalysisResponse } from '@/lib/schemas';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = process.env.GEMINI_MODEL_IMAGE ?? 'gemini-2.0-flash-exp';

// Configuration for each analyzer type
const ANALYZER_CONFIG = {
  subject: {
    fast: {
      instruction: 'Describe the subject in 20-40 words: appearance, clothing, pose, expression.',
      maxOutputTokens: 400,
      temperature: 0.3,
    },
    quality: {
      instruction:
        'Describe the subject in 30-50 words: physical appearance, clothing with colors, pose, expression, distinctive features.',
      maxOutputTokens: 600,
      temperature: 0.3,
    },
  },
  scene: {
    fast: {
      instruction: 'Describe the scene in 15-30 words: location, lighting, atmosphere.',
      maxOutputTokens: 400,
      temperature: 0.3,
    },
    quality: {
      instruction:
        'Describe the scene in 25-40 words: location, architecture/landscape, lighting, atmosphere, key elements.',
      maxOutputTokens: 600,
      temperature: 0.3,
    },
  },
  style: {
    fast: {
      instruction: "Identify the style in 3-8 words. Example: 'anime style', 'photorealistic'.",
      maxOutputTokens: 400,
      temperature: 0.3,
    },
    quality: {
      instruction:
        'Describe the style in 15-25 words: artistic approach, medium, visual characteristics.',
      maxOutputTokens: 500,
      temperature: 0.3,
    },
  },
} as const;

export async function POST(req: NextRequest) {
  try {
    // Validate API key
    if (!GEMINI_API_KEY) {
      console.error('❌ GEMINI_API_KEY is not configured');
      return NextResponse.json(
        { success: false, error: 'Gemini API key not configured' },
        { status: 500 }
      );
    }

    // Parse and validate request body
    const body = await req.json();
    const validationResult = analysisRequestSchema.safeParse(body);

    if (!validationResult.success) {
      console.error('❌ Invalid request:', validationResult.error.errors);
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid request data',
          details: validationResult.error.errors,
        },
        { status: 400 }
      );
    }

    const { imageData, analyzerType, speedMode } = validationResult.data;

    // Get configuration for this analyzer type and speed mode
    const config =
      ANALYZER_CONFIG[analyzerType][speedMode === 'Quality' ? 'quality' : 'fast'];

    console.log(`🔍 ${analyzerType.toUpperCase()} ANALYZER:`);
    console.log(`   Speed mode: ${speedMode}`);
    console.log(`   Instruction: ${config.instruction}`);

    // Prepare Gemini API request
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;

    const requestBody = {
      contents: [
        {
          parts: [
            {
              inline_data: {
                mime_type: 'image/jpeg',
                data: imageData,
              },
            },
            {
              text: config.instruction,
            },
          ],
        },
      ],
      generationConfig: {
        maxOutputTokens: config.maxOutputTokens,
        temperature: config.temperature,
      },
    };

    console.log('📤 Sending request to Gemini API...');

    const response = await fetch(geminiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Gemini API error:', errorText);
      return NextResponse.json(
        {
          success: false,
          error: `Gemini API error: ${response.status} ${response.statusText}`,
        },
        { status: response.status }
      );
    }

    const result = await response.json();
    console.log('📦 GEMINI API RAW RESPONSE:', JSON.stringify(result, null, 2));

    // Extract text from response
    const candidate = result.candidates?.[0];

    if (!candidate) {
      console.error('❌ No candidates in response');
      return NextResponse.json(
        { success: false, error: 'No response from Gemini API' },
        { status: 500 }
      );
    }

    // Check for MAX_TOKENS error
    if (candidate.finishReason === 'MAX_TOKENS' && !candidate.content?.parts) {
      console.error('❌ MAX_TOKENS error - API stopped before generating content');
      return NextResponse.json(
        {
          success: false,
          error: 'MAX_TOKENS: The API hit token limit before generating any content.',
        },
        { status: 500 }
      );
    }

    // Extract text from parts
    const parts = candidate.content?.parts;
    if (!parts || !Array.isArray(parts)) {
      console.error('❌ Response has no content.parts!');
      return NextResponse.json(
        { success: false, error: 'Invalid API response: content.parts is missing' },
        { status: 500 }
      );
    }

    let prompt = '';
    for (const part of parts) {
      if (typeof part === 'string') {
        prompt += part;
      } else if (part.text) {
        prompt += part.text;
      } else if (part.Text) {
        prompt += part.Text;
      } else if (part.content) {
        prompt += part.content;
      }
    }

    prompt = prompt.trim();

    if (!prompt) {
      console.error('❌ Failed to extract text from response');
      console.error('Full candidate structure:', JSON.stringify(candidate, null, 2));
      return NextResponse.json(
        { success: false, error: 'Failed to extract text from response' },
        { status: 500 }
      );
    }

    console.log(`✅ Successfully generated ${analyzerType} prompt:`, prompt);

    const responseData: AnalysisResponse = {
      success: true,
      prompt,
      details: {
        finishReason: candidate.finishReason,
        safetyRatings: candidate.safetyRatings,
      },
    };

    return NextResponse.json(responseData);
  } catch (error) {
    console.error('❌ Error in analyze API route:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      },
      { status: 500 }
    );
  }
}
