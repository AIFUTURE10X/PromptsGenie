import { supabase } from '../integrations/supabase/client';

export const EDGE_FUNCTION_NAME = 'enhance-prompt';

export type EnhancePromptRequest = {
  prompt?: string;
  inputText?: string; // optional unified text key
  images?: string[]; // base64 data URLs
  imageDataUrls?: string[]; // optional unified images key
  model?: string; // e.g., 'gemini-1.5-flash' or 'gemini-1.5-pro'
};

export type EnhancePromptResponse = {
  enhancedPrompt?: string;
  output?: string;
};

export async function generatePromptViaEdge(req: EnhancePromptRequest): Promise<string> {
  if (!supabase) {
    throw new Error('Supabase client not initialized');
  }

  console.log('Invoking edge function with:', req);

  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

  try {
    const invokeOptions: any = { body: req };
    if (supabaseAnonKey) {
      // Include both Authorization and apikey to satisfy gateway expectations
      invokeOptions.headers = {
        Authorization: `Bearer ${supabaseAnonKey}`,
        apikey: supabaseAnonKey,
        'Content-Type': 'application/json',
      };
    }

    const { data, error } = await supabase.functions.invoke(EDGE_FUNCTION_NAME, invokeOptions);

    console.log('Edge function data:', data);
    console.log('Edge function error:', error);

    if (error) {
      throw new Error(`Edge function error: ${JSON.stringify(error)}`);
    }

    if (!data || !(data as any).enhancedPrompt) {
      throw new Error(`No prompt returned. Data: ${JSON.stringify(data)}`);
    }

    return (data as any).enhancedPrompt as string;
  } catch (err) {
    console.error('generatePromptViaEdge failed:', err);
    throw err;
  }
}