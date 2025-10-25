import { AnalyzeImageInput, AnalyzeImageResponse } from '../types/api'; 
import { config } from '../config'; 
import { logger } from '../logger'; 
import { getPrimaryModel, getFallbackModel, shouldUseABTest } from '../model-resolver'; 
import { callWithFallback, callWithShadow } from '../gemini-client'; 
import { getCaptionPrompt, getObjectsPrompt, getTagsPrompt } from '../prompts'; 
import { trimToDetail, extractObjects, extractTags } from '../guardrails'; 
import { metricsStore } from '../metrics'; 
import { randomUUID } from 'crypto'; 

export async function analyzeImage( 
  input: AnalyzeImageInput, 
  headers: Record<string, string> 
): Promise<AnalyzeImageResponse> { 
  const traceId = randomUUID(); 
  const startTime = Date.now(); 
  
  const mode = headers['x-analyze-mode'] as 'fast' | 'quality' || input.mode || 'fast'; 
  const ocrHint = headers['x-ocr-hint'] === 'true'; 
  const detail = input.options?.detail || 'medium'; 
  const wantTags = input.options?.tags || false; 

  // Validate input 
  if (!input.base64 && !input.imageUrl) { 
    throw new Error('Either base64 or imageUrl must be provided'); 
  } 

  if (input.imageUrl && !input.imageUrl.startsWith('https://')) { 
    throw new Error('Only HTTPS image URLs are allowed'); 
  } 

  // Validate base64 size 
  if (input.base64) { 
    const sizeBytes = Buffer.from(input.base64, 'base64').length; 
    if (sizeBytes > config.maxImageBytes) { 
      throw new Error(`Image size ${sizeBytes} exceeds limit ${config.maxImageBytes}`); 
    } 
  } 

  // Determine model routing 
  let primaryModel = getPrimaryModel(); 
  const fallbackModel = getFallbackModel(); 
  
  // A/B test: randomly use Pro 
  if (shouldUseABTest()) { 
    primaryModel = fallbackModel; 
    logger.debug({ traceId }, 'A/B test: using Pro model'); 
  } 

  // Quality mode with long detail: prefer Pro 
  if (mode === 'quality' && detail === 'long') { 
    primaryModel = fallbackModel; 
  } 

  const timeout = mode === 'fast' ? config.timeoutMsFast : config.timeoutMsQuality; 

  const imageData = { 
    base64: input.base64, 
    mimeType: input.mimeType, 
  }; 

  try { 
    // Main caption call 
    const captionPrompt = getCaptionPrompt(detail, ocrHint); 
    
    let result; 
    if (config.shadowMode && primaryModel !== fallbackModel) { 
      result = await callWithShadow(primaryModel, fallbackModel, captionPrompt, imageData, timeout); 
    } else { 
      result = await callWithFallback(primaryModel, fallbackModel, captionPrompt, imageData, timeout); 
    } 

    const caption = trimToDetail(result.text, detail); 
    
    // Extract objects (simple heuristic or separate call) 
    let objects: AnalyzeImageResponse['objects'] = extractObjects(caption); 
    
    // Extract tags if requested 
    let tags: string[] = []; 
    if (wantTags) { 
      tags = extractTags(caption); 
    } 

    // Determine setting (simple heuristic) 
    const setting = caption.toLowerCase().includes('indoor') ? 'indoor' : 
                    caption.toLowerCase().includes('outdoor') ? 'outdoor' : 'unknown'; 

    const latency = Date.now() - startTime; 

    // Log metrics 
    metricsStore.addRequest({ 
      trace_id: traceId, 
      endpoint: '/analyze-image', 
      mode, 
      chosen_model: primaryModel, 
      used_model: result.model, 
      fallback_used: 'fallback_used' in result ? result.fallback_used : false, 
      shadow_ran: 'shadow_result' in result && !!result.shadow_result, 
      latency_ms: latency, 
      confidence: result.confidence, 
    }); 

    logger.info({ 
      trace_id: traceId, 
      model: result.model, 
      latency, 
      confidence: result.confidence, 
    }, 'Image analysis complete'); 

    return { 
      caption, 
      objects, 
      tags, 
      setting, 
      confidence: result.confidence, 
      model: result.model, 
      raw: result.text, 
    }; 
  } catch (error: any) { 
    const latency = Date.now() - startTime; 
    
    metricsStore.addRequest({ 
      trace_id: traceId, 
      endpoint: '/analyze-image', 
      mode, 
      chosen_model: primaryModel, 
      fallback_used: false, 
      shadow_ran: false, 
      latency_ms: latency, 
      error: error.message, 
    }); 

    logger.error({ trace_id: traceId, error: error.message, latency }, 'Image analysis failed'); 
    throw error; 
  } 
}