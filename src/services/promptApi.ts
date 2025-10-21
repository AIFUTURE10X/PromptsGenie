export async function generateWithGemini(inputText: string, model?: string, allowFallback: boolean = true): Promise<string> {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY as string | undefined;
  if (!apiKey) throw new Error('Missing VITE_GEMINI_API_KEY');

  const chosenModel = model || (import.meta.env.VITE_GEMINI_MODEL_TEXT as string | undefined) || 'gemini-1.5-flash';
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${chosenModel}:generateContent?key=${apiKey}`;

  const body = {
    contents: [{ role: 'user', parts: [{ text: inputText }] }]
  };

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Gemini error ${res.status}: ${errText}`);
  }

  const data = await res.json();

  // Robust extraction: first actual text part across candidates
  let textOut = '';
  for (const cand of data?.candidates ?? []) {
    for (const part of cand?.content?.parts ?? []) {
      if ((part as any)?.text) { textOut = String((part as any).text).trim(); break; }
    }
    if (textOut) break;
  }
  if (!textOut) {
    const parts = data?.candidates?.[0]?.content?.parts ?? [];
    textOut = parts.map((p: any) => p?.text ?? '').join('').trim();
  }

  // Flash → Pro fallback if empty
  if (!textOut && allowFallback && chosenModel.includes('flash')) {
    const fallbackModel = chosenModel.replace('flash', 'pro');
    return generateWithGemini(inputText, fallbackModel, false);
  }

  return textOut || '(No content returned)';
}

export async function generateWithGeminiImages(inputText: string, imageDataUrls: string[], model?: string, allowFallback: boolean = true): Promise<string> {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY as string | undefined;
  if (!apiKey) throw new Error('Missing VITE_GEMINI_API_KEY');

  const chosenModel = model || (import.meta.env.VITE_GEMINI_MODEL_IMAGE as string | undefined) || 'gemini-1.5-pro';
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${chosenModel}:generateContent?key=${apiKey}`;

  const parts: any[] = [{ text: inputText }];
  for (const dataUrl of imageDataUrls) {
    const match = String(dataUrl).match(/^data:([^;]+);base64,(.+)$/);
    const mime = match?.[1] || 'image/png';
    const b64 = match?.[2] || '';
    parts.push({ inline_data: { mime_type: mime, data: b64 } });
  }

  const body = {
    contents: [{ role: 'user', parts }]
  };

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Gemini (images) error ${res.status}: ${errText}`);
  }

  const data = await res.json();

  // Robust extraction: first actual text part across candidates
  let textOut = '';
  for (const cand of data?.candidates ?? []) {
    for (const part of cand?.content?.parts ?? []) {
      if ((part as any)?.text) { textOut = String((part as any).text).trim(); break; }
    }
    if (textOut) break;
  }
  if (!textOut) {
    const outParts = data?.candidates?.[0]?.content?.parts ?? [];
    textOut = outParts.map((p: any) => p?.text ?? '').join('').trim();
  }

  // Flash → Pro fallback if empty
  if (!textOut && allowFallback && chosenModel.includes('flash')) {
    const fallbackModel = chosenModel.replace('flash', 'pro');
    return generateWithGeminiImages(inputText, imageDataUrls, fallbackModel, false);
  }

  return textOut || '(No content returned)';
}