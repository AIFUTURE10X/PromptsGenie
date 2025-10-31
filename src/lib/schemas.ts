import { z } from 'zod';

// Speed mode for analysis
export const speedModeSchema = z.enum(['Fast', 'Quality']);
export type SpeedMode = z.infer<typeof speedModeSchema>;

// Analyzer type
export const analyzerTypeSchema = z.enum(['subject', 'scene', 'style']);
export type AnalyzerType = z.infer<typeof analyzerTypeSchema>;

// Analysis request schema
export const analysisRequestSchema = z.object({
  imageData: z.string().min(1, 'Image data is required'),
  analyzerType: analyzerTypeSchema,
  speedMode: speedModeSchema,
});

export type AnalysisRequest = z.infer<typeof analysisRequestSchema>;

// Analysis response schema
export const analysisResponseSchema = z.object({
  success: z.boolean(),
  prompt: z.string().optional(),
  error: z.string().optional(),
  details: z
    .object({
      finishReason: z.string().optional(),
      safetyRatings: z.array(z.any()).optional(),
    })
    .optional(),
});

export type AnalysisResponse = z.infer<typeof analysisResponseSchema>;

// Image file validation
export const imageFileSchema = z
  .instanceof(File)
  .refine((file) => file.size <= 5 * 1024 * 1024, {
    message: 'File size must be less than 5MB',
  })
  .refine(
    (file) => ['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(file.type),
    {
      message: 'File must be a valid image (JPEG, PNG, WebP, or GIF)',
    }
  );
