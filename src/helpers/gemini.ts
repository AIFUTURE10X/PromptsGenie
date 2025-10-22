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
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;

  const parts: (TextPart | ImagePart)[] = [
    { text },
    ...imageDataUrls.map((dataUrl) => {
      const [header, base64] = dataUrl.split(",");
      const mime = header.replace("data:", "").replace(";base64", "");
      return {
        inlineData: {
          mimeType: mime,
          data: base64,
        },
      } as ImagePart;
    }),
  ];

  const genCfg = {
    temperature: 0.9,
    topP: 0.9,
    topK: 40,
    maxOutputTokens: 512,
    ...(generationConfig ?? {}),
  };

  const body = {
    contents: [{ role: "user", parts }],
    generationConfig: genCfg,
  };

  const res = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-goog-api-key": apiKey,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const txt = await res.text();
    console.error("Gemini REST error", res.status, txt);
    throw new Error(`Gemini REST error ${res.status}: ${txt}`);
  }

  const json = await res.json();
  const candidates = json?.candidates || [];
  const textOut = candidates[0]?.content?.parts?.map((p: any) => p.text).join("\n") || "";
  return textOut.trim();
}

// Helper default model; ensure it aligns to 2.0 flash if the caller passes empty
export const DEFAULT_GEMINI_IMAGE_MODEL = "gemini-2.0-flash";