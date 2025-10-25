import { generateWithImagesREST } from '../helpers/gemini';

// Banned tokens that should be filtered out from image analysis
const BANNED_TOKENS = [
  'photorealistic',
  '50mm',
  'studio lighting',
  'balanced composition',
  'cinematic',
  'bokeh',
  'DSLR',
  'professional photography',
  'high resolution',
  'sharp focus',
  'depth of field',
  'camera',
  'lens',
  'aperture',
  'ISO',
  'shutter speed',
  'exposure'
];

// System prompt for factual image captioning
const FACTUAL_CAPTION_PROMPT = `You are an image captioner. Describe the image factually and concisely. Focus on: subjects, actions, notable objects, setting, and mood. Avoid camera/lens/lighting/style jargon, aesthetic tags, or identity guesses. If uncertain, say 'unclear.' Output 2–4 sentences.`;

export interface ImageAnalysisConfig {
  apiKey: string;
  model?: string;
  speedMode: 'Fast' | 'Quality';
  analysisType: 'subject' | 'scene' | 'style' | 'general';
}

export interface ImageAnalysisResult {
  analysis: string;
  confidence: 'HIGH' | 'LOW';
  filteredTokens: string[];
  metadata: {
    model: string;
    inputType: 'base64' | 'url';
    imageSize: number;
    mimeType: string;
    analysisType: string;
    fallbackUsed: boolean;
  };
}

/**
 * Filters out banned tokens from the analysis text
 */
function filterBannedTokens(text: string): { filtered: string; removedTokens: string[] } {
  let filtered = text;
  const removedTokens: string[] = [];
  
  for (const token of BANNED_TOKENS) {
    const regex = new RegExp(`\\b${token.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
    if (regex.test(filtered)) {
      removedTokens.push(token);
      filtered = filtered.replace(regex, '').replace(/\s+/g, ' ').trim();
    }
  }
  
  return { filtered, removedTokens };
}

/**
 * Determines if the analysis result has low confidence
 */
function isLowConfidence(text: string, removedTokens: string[]): boolean {
  // Check if output is too short
  if (text.length < 15) return true;
  
  // Check if output contains only banned tokens (now removed)
  if (removedTokens.length > 0 && text.trim().length === 0) return true;
  
  // Check if output is mostly generic phrases
  const genericPhrases = ['image shows', 'picture depicts', 'photo contains', 'unclear', 'uncertain'];
  const hasOnlyGeneric = genericPhrases.some(phrase => 
    text.toLowerCase().includes(phrase) && text.length < 50
  );
  
  return hasOnlyGeneric;
}

/**
 * Gets the appropriate prompt based on analysis type and speed mode
 */
function getAnalysisPrompt(analysisType: string, speedMode: string): string {
  const basePrompt = FACTUAL_CAPTION_PROMPT;
  
  switch (analysisType) {
    case 'subject':
      return speedMode === 'Quality' 
        ? `${basePrompt} Focus specifically on describing the person or character in detail - their appearance, clothing, pose, and expression.`
        : `${basePrompt} Describe the person or character you see.`;
        
    case 'scene':
      return speedMode === 'Quality'
        ? `${basePrompt} Focus specifically on the setting, location, environment, and background elements. Describe the place and atmosphere.`
        : `${basePrompt} Describe the setting and environment.`;
        
    case 'style':
      return speedMode === 'Quality'
        ? `${basePrompt} Focus on analyzing the scene composition, environment, and the artistic/visual style of the image. Describe the mood, atmosphere, color palette, lighting style, and overall aesthetic treatment. Do NOT focus on describing the subject or people in the image.`
        : `${basePrompt} Describe the scene and visual style, not the subject.`;
        
    default:
      return basePrompt;
  }
}

/**
 * Analyzes images with improved factual descriptions and banned token filtering
 */
export async function analyzeImagesFactual(
  imageDataUrls: string[],
  config: ImageAnalysisConfig
): Promise<ImageAnalysisResult> {
  const { apiKey, speedMode, analysisType } = config;
  const model = config.model || 'gemini-2.5-flash';
  
  // Get appropriate prompt for analysis type
  const prompt = getAnalysisPrompt(analysisType, speedMode);
  
  // Generation config based on speed mode
  const generationConfig = speedMode === 'Quality'
    ? { maxOutputTokens: 384, temperature: 0.95 }
    : { maxOutputTokens: 250, temperature: 0.7 };
  
  // Extract metadata from first image
  const firstImage = imageDataUrls[0];
  const [header, base64] = firstImage.split(',');
  const mimeType = header.replace('data:', '').replace(';base64', '');
  const imageSize = Math.round(base64.length * 0.75); // Approximate byte size
  
  console.log(`🔍 Factual Image Analysis - ${analysisType}:`, {
    model,
    speedMode,
    imageCount: imageDataUrls.length,
    imageSize: `${(imageSize / 1024).toFixed(1)}KB`,
    mimeType,
    promptLength: prompt.length
  });
  
  let fallbackUsed = false;
  
  try {
    // Call Gemini API
    const rawAnalysis = await generateWithImagesREST({
      apiKey,
      model,
      text: prompt,
      imageDataUrls,
      generationConfig
    });
    
    console.log(`🔍 Raw ${analysisType} analysis:`, rawAnalysis);
    
    // Filter banned tokens
    const { filtered, removedTokens } = filterBannedTokens(rawAnalysis);
    
    // Check confidence
    const confidence = isLowConfidence(filtered, removedTokens) ? 'LOW' : 'HIGH';
    
    if (confidence === 'LOW') {
      console.warn(`⚠️ Low confidence ${analysisType} analysis detected:`, {
        originalLength: rawAnalysis.length,
        filteredLength: filtered.length,
        removedTokens
      });
      fallbackUsed = true;
    }
    
    console.log(`✅ ${analysisType} analysis complete:`, {
      confidence,
      filteredLength: filtered.length,
      removedTokensCount: removedTokens.length
    });
    
    return {
      analysis: filtered || `Unable to analyze ${analysisType}. Please try again.`,
      confidence,
      filteredTokens: removedTokens,
      metadata: {
        model,
        inputType: 'base64',
        imageSize,
        mimeType,
        analysisType,
        fallbackUsed
      }
    };
    
  } catch (error) {
    console.error(`❌ ${analysisType} analysis failed:`, error);
    fallbackUsed = true;
    
    return {
      analysis: `Failed to analyze ${analysisType}: ${error.message}`,
      confidence: 'LOW',
      filteredTokens: [],
      metadata: {
        model,
        inputType: 'base64',
        imageSize,
        mimeType,
        analysisType,
        fallbackUsed
      }
    };
  }
}

/**
 * Logs analysis metrics for monitoring
 */
export function logAnalysisMetrics(result: ImageAnalysisResult): void {
  const { metadata, confidence, filteredTokens } = result;
  
  console.log(`📊 Analysis Metrics - ${metadata.analysisType}:`, {
    model: metadata.model,
    inputType: metadata.inputType,
    imageSizeKB: (metadata.imageSize / 1024).toFixed(1),
    mimeType: metadata.mimeType,
    confidence,
    filteredTokensCount: filteredTokens.length,
    fallbackUsed: metadata.fallbackUsed
  });
  
  // Emit fallback metric if used
  if (metadata.fallbackUsed) {
    console.warn(`🚨 Fallback used for ${metadata.analysisType} analysis`);
  }
}