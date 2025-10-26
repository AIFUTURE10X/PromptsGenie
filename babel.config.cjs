module.exports = {
  presets: [
    ['@babel/preset-env', { targets: { node: 'current' } }],
    ['@babel/preset-typescript', { allowDeclareFields: true }],
    ['@babel/preset-react', { runtime: 'automatic' }],
  ],
  plugins: [
    [
      'babel-plugin-transform-vite-meta-env',
      {
        env: {
          VITE_GEMINI_API_KEY: 'test-api-key',
          GOOGLE_API_KEY: 'test-google-key',
          VITE_GEMINI_MODEL_TEXT: 'gemini-1.5-flash',
          VITE_GEMINI_MODEL_IMAGES: 'gemini-1.5-flash',
          VITE_GEMINI_MODEL_IMAGE: 'gemini-1.5-flash',
          VITE_SUPABASE_URL: 'https://test.supabase.co',
          VITE_SUPABASE_ANON_KEY: 'test-anon-key',
          VITE_REPLICATE_API_TOKEN: 'test-replicate-token',
          BASE_URL: '/',
          DEV: true,
          PROD: false,
          VITE_GOOGLE_API_KEY: 'test-google-key',
          VITE_GEMINI_MODEL: 'gemini-2.5-flash',
          VITE_GEMINI_PRIMARY: 'flash',
          VITE_GEMINI_FALLBACK: 'pro',
          VITE_PREFERRED_MAJOR: '2.5',
          VITE_ROUTE_POLICY: 'latency',
          VITE_AB_RATIO: '0.2',
          VITE_SHADOW_MODE: 'false',
          VITE_TIMEOUT_MS_FAST: '8000',
          VITE_TIMEOUT_MS_QUALITY: '12000',
          VITE_MAX_IMAGE_BYTES: '8000000',
          VITE_LOG_LEVEL: 'info',
          VITE_PORT: '3001',
          VITE_TEST_MODE: 'true',
          VITE_SUPABASE_STATUS_PING: 'false',
        },
      },
    ],
  ],
  env: {
    test: {
      presets: [
        ['@babel/preset-env', { targets: { node: 'current' } }],
        ['@babel/preset-typescript', { allowDeclareFields: true }],
        ['@babel/preset-react', { runtime: 'automatic' }],
      ],
    },
  },
};