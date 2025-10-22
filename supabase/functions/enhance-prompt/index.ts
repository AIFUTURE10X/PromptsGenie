// Supabase Edge Function: enhance-prompt
// Minimal stub to verify reachability and wiring

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

function corsHeaders(origin?: string) {
  return {
    "Access-Control-Allow-Origin": origin ?? "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Content-Type": "application/json",
  } as Record<string, string>;
}

serve(async (req: Request): Promise<Response> => {
  const origin = req.headers.get("origin") ?? "*";

  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders(origin) });
  }

  try {
    const body = await req.json().catch(() => ({} as any));
    const inputText: string = body?.inputText ?? body?.prompt ?? "";
    const imageDataUrls: string[] = Array.isArray(body?.imageDataUrls)
      ? body.imageDataUrls
      : Array.isArray(body?.images)
      ? body.images
      : [];

    const parts: string[] = [];
    if (inputText) parts.push(inputText);
    if (imageDataUrls.length) parts.push(`[images:${imageDataUrls.length}]`);

    const enhancedPrompt = parts.length
      ? `Healthcheck OK. ${parts.join(" ")}`
      : "Healthcheck OK. No input provided.";

    const resp = { enhancedPrompt };
    return new Response(JSON.stringify(resp), { headers: corsHeaders(origin), status: 200 });
  } catch (e) {
    const err = e instanceof Error ? e.message : String(e);
    return new Response(JSON.stringify({ error: err }), {
      headers: corsHeaders(origin),
      status: 500,
    });
  }
});