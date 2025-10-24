export async function generateWithGemini(inputText: string, model?: string, allowFallback: boolean = true): Promise<string> {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY as string | undefined;
  console.log('Gemini API Key exists:', Boolean(apiKey));
  console.log('Gemini API Key length:', apiKey?.length ?? 0);
  const isPlaceholderKey = !!apiKey && (apiKey.includes('YOUR_API_KEY') || apiKey.includes('PLACEHOLDER') || apiKey === 'VITE_GEMINI_API_KEY');
  if (!apiKey || isPlaceholderKey) {
    console.warn('Gemini API key missing or placeholder; using generic fallback');
    if (allowFallback) {
      const generic = inputText + ' — photorealistic, soft studio lighting, shallow depth of field, 50mm lens, balanced composition, high detail.';
      return generic.trim();
    }
    throw new Error('Missing or placeholder VITE_GEMINI_API_KEY');
  }

  const chosenModel = model || (import.meta.env.VITE_GEMINI_MODEL_TEXT as string | undefined) || 'gemini-2.5-flash';
  console.log('Gemini text: Using model:', chosenModel);
  console.log('Gemini text: Input text length:', inputText?.length ?? 0);
  const url = `https://generativelanguage.googleapis.com/v1/models/${chosenModel}:generateContent?key=${apiKey}`;

  const body = {
    contents: [{ role: 'user', parts: [{ text: inputText }] }]
  };

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });

  // Enhanced error-aware fallback: if access/not-found, try 2.5→1.5 and flash→pro
  if (!res.ok) {
    const errText = await res.text();
    console.error('Gemini text error:', res.status, errText);
    if (/API key not valid/i.test(errText) || /INVALID_ARGUMENT/i.test(errText)) {
      if (allowFallback) {
        console.warn('Gemini API key invalid; returning generic fallback');
        const generic = inputText + ' — photorealistic, soft studio lighting, shallow depth of field, 50mm lens, balanced composition, high detail.';
        return generic.trim();
      }
      throw new Error('Gemini API key is invalid or not configured.');
    }
    if (allowFallback) {
      const isAccessOrNotFound = res.status === 403 || res.status === 404 || /permission|access|not\s*found|unsupported|model/i.test(errText);
      if (isAccessOrNotFound) {
        let fallbackModel = chosenModel;
        if (fallbackModel.includes('2.5')) fallbackModel = fallbackModel.replace('2.5', '1.5');
        if (fallbackModel.includes('flash')) fallbackModel = fallbackModel.replace('flash', 'pro');
        if (fallbackModel !== chosenModel) {
          return generateWithGemini(inputText, fallbackModel, false);
        }
      }
    }
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
  console.log('Gemini text response:', textOut);

  // Flash → Pro fallback if empty
  if (!textOut && allowFallback && chosenModel.includes('flash')) {
    const fallbackModel = chosenModel.replace('flash', 'pro');
    return generateWithGemini(inputText, fallbackModel, false);
  }

  return textOut || '(No content returned)';
}

export async function generateWithGeminiImages(inputText: string, imageDataUrls: string[], model?: string, allowFallback: boolean = true): Promise<string> {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY as string | undefined;
  console.log('Gemini API Key exists:', Boolean(apiKey));
  console.log('Gemini API Key length:', apiKey?.length ?? 0);
  const isPlaceholderKey = !!apiKey && (apiKey.includes('YOUR_API_KEY') || apiKey.includes('PLACEHOLDER') || apiKey === 'VITE_GEMINI_API_KEY');
  if (!apiKey || isPlaceholderKey) {
    console.warn('Gemini API key missing or placeholder; using generic fallback');
    if (allowFallback) {
      const generic = inputText + ' — photorealistic, soft studio lighting, shallow depth of field, 50mm lens, balanced composition, high detail.';
      return generic.trim();
    }
    throw new Error('Missing or placeholder VITE_GEMINI_API_KEY');
  }

  const chosenModel = model || (import.meta.env.VITE_GEMINI_MODEL_IMAGE as string | undefined) || 'gemini-2.5-flash';
  console.log('Gemini images: Using model:', chosenModel);
  console.log('Gemini images: Input text length:', inputText?.length ?? 0);
  console.log('Gemini images: Image count:', imageDataUrls.length);
  const url = `https://generativelanguage.googleapis.com/v1/models/${chosenModel}:generateContent?key=${apiKey}`;

  const parts: any[] = [{ text: inputText }];
  // Add validation
  for (const dataUrl of imageDataUrls) {
    if (!dataUrl || typeof dataUrl !== 'string') {
      console.warn('Invalid image data URL, skipping');
      continue;
    }

    const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
    if (!match) {
      console.warn('Invalid data URL format, skipping');
      continue;
    }

    const mime = match[1];
    const b64 = match[2];
    parts.push({ inline_data: { mime_type: mime, data: b64 } });
  }
  console.log('Gemini images: Parts to send:', parts.length);
  const firstImg = parts.find((p: any) => p?.inline_data);
  if (firstImg) {
    console.log('Gemini images: First image MIME:', firstImg.inline_data?.mime_type, 'Base64 length:', firstImg.inline_data?.data?.length);
  }

  const body = {
    contents: [{ role: 'user', parts }]
  };

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });

  // Enhanced error-aware fallback: if access/not-found, try 2.5→1.5 and flash→pro
  if (!res.ok) {
    const errText = await res.text();
    console.error('Gemini (images) error:', res.status, errText);
    if (/API key not valid/i.test(errText) || /INVALID_ARGUMENT/i.test(errText)) {
      if (allowFallback) {
        console.warn('Gemini API key invalid; returning generic fallback');
        const generic = inputText + ' — photorealistic, soft studio lighting, shallow depth of field, 50mm lens, balanced composition, high detail.';
        return generic.trim();
      }
      throw new Error('Gemini API key is invalid or not configured.');
    }
    if (allowFallback) {
      const isAccessOrNotFound = res.status === 403 || res.status === 404 || /permission|access|not\s*found|unsupported|model/i.test(errText);
      if (isAccessOrNotFound) {
        let fallbackModel = chosenModel;
        if (fallbackModel.includes('2.5')) fallbackModel = fallbackModel.replace('2.5', '1.5');
        if (fallbackModel.includes('flash')) fallbackModel = fallbackModel.replace('flash', 'pro');
        if (fallbackModel !== chosenModel) {
          return generateWithGeminiImages(inputText, imageDataUrls, fallbackModel, false);
        }
      }
    }
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
  console.log('Gemini images response:', textOut);

  // Flash → Pro fallback if empty
  if (!textOut && allowFallback && chosenModel.includes('flash')) {
    const fallbackModel = chosenModel.replace('flash', 'pro');
    return generateWithGeminiImages(inputText, imageDataUrls, fallbackModel, false);
  }

  return textOut || '(No content returned)';
}