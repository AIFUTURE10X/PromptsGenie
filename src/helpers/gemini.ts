export function dataUrlToInlineData(dataUrl: string) {
  const m = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
  if (!m) return null;
  // REST v1 (ai.google.dev) accepts camelCase when using JSON; Node SDK uses the same shape.
  return { mimeType: m[1], data: m[2] };
}

export async function generateWithImagesREST({
  apiKey,
  model = "gemini-2.5-flash",
  text,
  imageDataUrls = [],
}: {
  apiKey: string;
  model?: string;
  text: string;
  imageDataUrls: string[];
}): Promise<string> {
  if (!apiKey) throw new Error("Gemini API key not configured");

  const parts: any[] = [{ text }];

  for (const url of imageDataUrls) {
    if (typeof url !== "string") continue;
    const inline = dataUrlToInlineData(url);
    if (inline) parts.push({ inlineData: inline });
  }

  const endpoint = `https://generativelanguage.googleapis.com/v1/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`;

  const res = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ contents: [{ role: "user", parts }] }),
  });

  if (!res.ok) {
    let errJson: any = {};
    try { errJson = await res.json(); } catch {}
    throw new Error(`Gemini REST error ${res.status}: ${JSON.stringify(errJson, null, 2)}`);
  }

  const data = await res.json();
  const partsOut = data?.candidates?.[0]?.content?.parts || [];
  const textOut = partsOut.map((p: any) => p.text).filter(Boolean).join("\n");
  return textOut || "";
}