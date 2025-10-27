import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  // Use repo base when building for GitHub Pages project site
  base: '/',
  server: {
    port: 5173,
    strictPort: true,
    open: true,
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          ui: ['@radix-ui/react-collapsible', '@radix-ui/react-popover', '@radix-ui/react-slot'],
        },
      },
    },
  },
  envPrefix: 'VITE_',
  define: {
    // Ensure environment variables are available in build mode
    'import.meta.env.VITE_GEMINI_API_KEY': JSON.stringify(process.env.VITE_GEMINI_API_KEY),
    'import.meta.env.VITE_GEMINI_MODEL_TEXT': JSON.stringify(process.env.VITE_GEMINI_MODEL_TEXT),
    'import.meta.env.VITE_GEMINI_MODEL_IMAGES': JSON.stringify(process.env.VITE_GEMINI_MODEL_IMAGES),
    'import.meta.env.VITE_GEMINI_MODEL_IMAGE': JSON.stringify(process.env.VITE_GEMINI_MODEL_IMAGE),
    'import.meta.env.API_BASE_URL': JSON.stringify(process.env.API_BASE_URL),
  },
});