import { supabase } from '../integrations/supabase/client';

export const EDGE_FUNCTION_NAME = 'enhance-prompt';

export type EnhancePromptRequest = {
  prompt: string;
  images?: string[]; // base64 data URLs
  model?: string; // e.g., 'gemini-1.5-flash' or 'gemini-1.5-pro'
};

export type EnhancePromptResponse = {
  output: string; // enhanced/generation result
};

export async function generatePromptViaEdge(req: EnhancePromptRequest): Promise<string> {
  if (!supabase) {
    throw new Error('Supabase client not initialized');
  }
  const { data, error } = await supabase.functions.invoke(EDGE_FUNCTION_NAME, {
    body: req,
  });
  if (error) {
    throw error;
  }
  const payload = data as EnhancePromptResponse;
  if (!payload || typeof payload.output !== 'string') {
    throw new Error('Invalid response from edge function');
  }
  return payload.output;
}