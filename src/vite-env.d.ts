/// <reference types="vite/client" />

interface ImportMetaEnv {
  // API Keys
  readonly VITE_GOOGLE_API_KEY?: string
  readonly VITE_GEMINI_API_KEY?: string
  readonly VITE_REPLICATE_API_TOKEN?: string
  
  // Model Configuration
  readonly VITE_GEMINI_MODEL?: string
  readonly VITE_GEMINI_MODEL_TEXT?: string
  readonly VITE_GEMINI_MODEL_IMAGES?: string
  readonly VITE_GEMINI_PRIMARY?: string
  readonly VITE_GEMINI_FALLBACK?: string
  readonly VITE_PREFERRED_MAJOR?: string
  
  // Routing and Performance
  readonly VITE_ROUTE_POLICY?: string
  readonly VITE_AB_RATIO?: string
  readonly VITE_TIMEOUT_MS_FAST?: string
  readonly VITE_TIMEOUT_MS_QUALITY?: string
  readonly VITE_MAX_IMAGE_BYTES?: string
  
  // Application Configuration
  readonly VITE_PORT?: string
  readonly VITE_LOG_LEVEL?: string
  readonly VITE_API_URL?: string
  
  // Feature Flags
  readonly VITE_SHADOW_MODE?: string
  readonly VITE_TEST_MODE?: string
  readonly VITE_ENABLE_IMAGE_ANALYSIS?: string
  
  // Supabase Configuration
  readonly VITE_SUPABASE_URL?: string
  readonly VITE_SUPABASE_ANON_KEY?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}