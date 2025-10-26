import dotenv from 'dotenv';

dotenv.config();

export const config = {
  googleApiKey: process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY || '',
  geminiPrimary: process.env.GEMINI_PRIMARY || 'flash',
  geminiFallback: process.env.GEMINI_FALLBACK || 'pro',
  preferredMajor: process.env.PREFERRED_MAJOR || '2.5',
  routePolicy: process.env.ROUTE_POLICY || 'latency',
  abRatio: parseFloat(process.env.AB_RATIO || '0.2'),
  shadowMode: String(process.env.SHADOW_MODE || '').toLowerCase() === 'true',
  timeoutMsFast: parseInt(process.env.TIMEOUT_MS_FAST || '8000', 10),
  timeoutMsQuality: parseInt(process.env.TIMEOUT_MS_QUALITY || '12000', 10),
  maxImageBytes: parseInt(process.env.MAX_IMAGE_BYTES || '8000000', 10),
  logLevel: process.env.LOG_LEVEL || 'info',
  port: parseInt(process.env.PORT || '8085', 10),
  testMode: String(process.env.TEST_MODE || '').toLowerCase() === 'true',
} as const;

export function validateConfig(): void {
  if (!config.googleApiKey && !config.testMode) {
    throw new Error('GOOGLE_API_KEY is required in environment variables');
  }
  if (config.abRatio < 0 || config.abRatio > 1) {
    throw new Error('AB_RATIO must be between 0 and 1');
  }
}