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

export async function generateWithImagesREST({ apiKey: _apiKey, model, text, imageDataUrls, generationConfig }: GenerateWithImagesRESTArgs): Promise<string> {
  // Now calling our server endpoint instead of Google directly
  const endpoint = `http://localhost:3001/api/gemini/images`;
  
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

  const body = {
    prompt: text,
    imageDataUrls,
    model,
    generationConfig: {
      temperature: 0.9,
      topP: 0.9,
      topK: 40,
      maxOutputTokens: 512,
      ...(generationConfig ?? {}),
    },
  };

  const res = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const txt = await res.text();
    console.error("Server API error", res.status, txt);
    throw new Error(`Server API error ${res.status}: ${txt}`);
  }

  const json = await res.json();
  console.log("🔍 Server response JSON:", json);
  console.log("🔍 Server response type:", typeof json);
  console.log("🔍 Server response keys:", Object.keys(json || {}));
  
  const candidates = json?.candidates || [];
  console.log("🔍 Candidates found:", candidates.length);
  console.log("🔍 First candidate:", candidates[0]);
  
  const textOut = candidates[0]?.content?.parts?.map((p: any) => p.text).join("\n") || "";
  console.log("🔍 Extracted text:", textOut);
  console.log("🔍 Extracted text length:", textOut.length);
  
  return textOut.trim();
}

// Helper default model; using 1.5-flash for better stability and quota availability
export const DEFAULT_GEMINI_IMAGE_MODEL = "gemini-2.5-flash";