import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig(({ mode }) => ({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  base: '/',
  server: {
    port: 5173,
    strictPort: true,
    // Only use proxy in development mode
    proxy: mode === 'development' ? {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false,
        ws: true,
      },
    } : undefined,
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: mode === 'production',
        drop_debugger: true,
        pure_funcs: mode === 'production' ? ['console.log', 'console.info', 'console.debug'] : [],
      },
    },
    rollupOptions: {
      output: {
        manualChunks: {
          // Keep React together in one chunk - critical for proper loading order
          'react-vendor': ['react', 'react-dom', 'react/jsx-runtime'],
        },
        chunkFileNames: 'assets/js/[name]-[hash].js',
        entryFileNames: 'assets/js/[name]-[hash].js',
        assetFileNames: 'assets/[ext]/[name]-[hash].[ext]',
      },
    },
    chunkSizeWarningLimit: 1000,
  },
  envPrefix: 'VITE_',
  define: {
    // Ensure environment variables are available in build mode
    'import.meta.env.VITE_GEMINI_API_KEY': JSON.stringify(process.env.VITE_GEMINI_API_KEY),
    'import.meta.env.VITE_GEMINI_MODEL_TEXT': JSON.stringify(process.env.VITE_GEMINI_MODEL_TEXT),
    'import.meta.env.VITE_GEMINI_MODEL_IMAGES': JSON.stringify(process.env.VITE_GEMINI_MODEL_IMAGES),
    'import.meta.env.VITE_GEMINI_MODEL_IMAGE': JSON.stringify(process.env.VITE_GEMINI_MODEL_IMAGE),
    'import.meta.env.API_BASE_URL': JSON.stringify(process.env.API_BASE_URL || '/api'),
  },
}));