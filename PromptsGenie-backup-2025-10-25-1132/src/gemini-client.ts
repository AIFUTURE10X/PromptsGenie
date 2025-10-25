import { callGemini, callWithFallback } from './services/geminiClient';
import { ModelCallResult } from './types/api';

export interface ShadowResult extends ModelCallResult {
  shadow_result?: ModelCallResult;
}

export async function callWithShadow(
  primaryModel: string,
  fallbackModel: string,
  prompt: string,
  imageData: { base64?: string; mimeType: string } | undefined,
  timeout: number
): Promise<ShadowResult> {
  // Start both calls simultaneously
  const primaryPromise = callGemini({
    model: primaryModel,
    prompt,
    imageData,
    timeout,
  });

  const shadowPromise = callGemini({
    model: fallbackModel,
    prompt,
    imageData,
    timeout,
  }).catch(() => null); // Don't fail if shadow fails

  // Wait for primary result
  const primaryResult = await primaryPromise;
  
  // Get shadow result if available
  const shadowResult = await shadowPromise;

  return {
    ...primaryResult,
    shadow_result: shadowResult || undefined,
  };
}

export { callWithFallback };