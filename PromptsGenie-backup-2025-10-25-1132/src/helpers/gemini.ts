import type { ImagePart, TextPart } from "../types/gemini";

export interface GenerateWithImagesRESTArgs {
  apiKey: string;
  model: string; // e.g., "gemini-2.0-flash"
  text: string;
  imageDataUrls: string[];
  generationConfig?: {
    temperature?: number;
    topP?: number;
    topK?: number;
    maxOutputTokens?: number;
  };
}

export async function generateWithImagesREST({ apiKey, model, text, imageDataUrls, generationConfig }: GenerateWithImagesRESTArgs): Promise<string> {
  // Route through local API instead of Google directly
  const base = (import.meta.env.VITE_API_URL || 'http://localhost:3000').replace(/\/$/, '');
  const endpoint = `${base}/analyze-image`;

  console.log("🔧 Server API Request Details:");
  console.log("  - Model:", model);
  console.log("  - Server endpoint:", endpoint);
  console.log("  - Images count:", imageDataUrls.length);
  console.log("  - Text prompt length:", text.length);

  imageDataUrls.forEach((dataUrl, index) => {
    const [header, base64] = dataUrl.split(",");
    const mime = header.replace("data:", "").replace(";base64", "");
    console.log(`  - Image ${index + 1}: ${mime}, size: ${(base64.length * 0.75 / 1024).toFixed(1)}KB`);
  });

  // Convert first data URL into API payload
  const first = imageDataUrls[0];
  const match = first?.match(/^data:([^;]+);base64,(.+)$/);
  if (!match) {
    throw new Error('Invalid image data URL: expected data:<mime>;base64,<data>');
  }
  const mimeType = match[1];
  const base64 = match[2];

  const payload = {
    base64,
    mimeType,
    options: { detail: 'medium', tags: true }
  };

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'X-Analyze-Mode': 'quality'
  };

  try {
    const res = await fetch(endpoint, { method: 'POST', headers, body: JSON.stringify(payload) });
    if (!res.ok) {
      const errText = await res.text().catch(() => '');
      console.error('Local analyze-image error:', res.status, errText);
      throw new Error(`analyze-image error ${res.status}: ${errText}`);
    }
    const json = await res.json();
    const caption = String(json?.caption || '').trim();
    return caption || '(No content returned)';
  } catch (err: any) {
    console.error('Local analyze-image fetch failed:', err?.message || err);
    throw err;
  }
}

// Helper default model; using 1.5-flash for better stability and quota availability
export const DEFAULT_GEMINI_IMAGE_MODEL = "gemini-2.5-flash";