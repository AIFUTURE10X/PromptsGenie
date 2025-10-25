import { z } from 'zod';

// Request schemas
export const analyzeImageSchema = z.object({
  imageUrl: z.string().url().startsWith('https://').optional(),
  base64: z.string().optional(),
  mimeType: z.enum(['image/png', 'image/jpeg', 'image/jpg', 'image/webp']).default('image/jpeg'),
  options: z.object({
    detail: z.enum(['short', 'medium', 'long']).default('medium'),
    tags: z.boolean().default(false),
  }).optional(),
  mode: z.enum(['fast', 'quality']).default('fast'),
}).refine(data => data.imageUrl || data.base64, {
  message: 'Either imageUrl or base64 must be provided',
});

export const textToPromptSchema = z.object({
  intent: z.string().min(1),
  style: z.string().optional(),
  constraints: z.string().optional(),
  length: z.enum(['minimal', 'medium', 'comprehensive']).default('medium'),
  mode: z.enum(['fast', 'quality']).default('fast'),
});

export const promptToTextSchema = z.object({
  prompt: z.string().min(1),
  task: z.enum(['refine', 'evaluate', 'simplify']),
  target_length: z.number().int().positive().optional(),
  mode: z.enum(['fast', 'quality']).default('fast'),
});

// Response types
export interface AnalyzeImageResponse {
  caption: string;
  objects: Array<{
    name: string;
    count: number;
    approx_area?: string;
    position?: string;
  }>;
  tags: string[];
  setting: string;
  confidence: number;
  model: string;
  raw: any;
}

export interface TextToPromptResponse {
  prompt: string;
  variants: string[];
  safety_notes: string[];
}

export interface PromptToTextResponse {
  result: string;
  score: number;
  suggestions: string[];
}

export interface MetricsData {
  total_requests: number;
  success_count: number;
  error_count: number;
  success_rate: number;
  fallback_rate: number;
  avg_latency_ms: number;
  avg_confidence: number;
  ab_outcomes: {
    flash_count: number;
    pro_count: number;
  };
  shadow_comparisons: number;
}

// Internal types
export type AnalyzeImageInput = z.infer<typeof analyzeImageSchema>;
export type TextToPromptInput = z.infer<typeof textToPromptSchema>;
export type PromptToTextInput = z.infer<typeof promptToTextSchema>;

export type ModelTier = 'flash' | 'pro';
export type AnalyzeMode = 'fast' | 'quality';

export interface ModelCallResult {
  text: string;
  model: string;
  latency: number;
  confidence: number;
}

export interface RequestContext {
  trace_id: string;
  endpoint: string;
  mode: AnalyzeMode;
  chosen_model: string;
  used_model?: string;
  fallback_used: boolean;
  shadow_ran: boolean;
  latency_ms: number;
  confidence?: number;
  error?: string;
}