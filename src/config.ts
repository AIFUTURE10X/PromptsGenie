export const config = {
  googleApiKey: import.meta.env.VITE_GOOGLE_API_KEY || import.meta.env.VITE_GEMINI_API_KEY || '',
  geminiApiKey: import.meta.env.VITE_GEMINI_API_KEY || import.meta.env.VITE_GOOGLE_API_KEY || '',
  geminiModel: import.meta.env.VITE_GEMINI_MODEL || 'gemini-2.5-flash',
  geminiPrimary: import.meta.env.VITE_GEMINI_PRIMARY || 'flash',
  geminiFallback: import.meta.env.VITE_GEMINI_FALLBACK || 'pro',
  preferredMajor: import.meta.env.VITE_PREFERRED_MAJOR || '2.5',
  routePolicy: import.meta.env.VITE_ROUTE_POLICY || 'latency',
  abRatio: parseFloat(import.meta.env.VITE_AB_RATIO || '0.2'),
  shadowMode: String(import.meta.env.VITE_SHADOW_MODE || '').toLowerCase() === 'true',
  timeoutMsFast: parseInt(import.meta.env.VITE_TIMEOUT_MS_FAST || '8000', 10),
  timeoutMsQuality: parseInt(import.meta.env.VITE_TIMEOUT_MS_QUALITY || '12000', 10),
  maxImageBytes: parseInt(import.meta.env.VITE_MAX_IMAGE_BYTES || '8000000', 10),
  logLevel: import.meta.env.VITE_LOG_LEVEL || 'info',
  port: parseInt(import.meta.env.VITE_PORT || '3001', 10),
  testMode: String(import.meta.env.VITE_TEST_MODE || '').toLowerCase() === 'true',
} as const;

export function validateConfig(): void {
  if (!config.googleApiKey && !config.testMode) {
    throw new Error('GOOGLE_API_KEY is required in environment variables');
  }
  if (config.abRatio < 0 || config.abRatio > 1) {
    throw new Error('AB_RATIO must be between 0 and 1');
  }
}

export const googleApiKey = process.env.VITE_GOOGLE_API_KEY || process.env.GOOGLE_API_KEY || "AIzaSyDt_fNc7YoPxnLm_kMc7FiwFHfnFPkYHWs";
export const geminiApiKey = process.env.VITE_GEMINI_API_KEY || "AIzaSyDt_fNc7YoPxnLm_kMc7FiwFHfnFPkYHWs";