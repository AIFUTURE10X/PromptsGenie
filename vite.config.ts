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
        manualChunks(id) {
          // Vendor splitting strategy for optimal caching
          if (id.includes('node_modules')) {
            // React core (loaded on every page)
            if (id.includes('react') || id.includes('react-dom') || id.includes('react/jsx-runtime')) {
              return 'react-vendor';
            }
            // Framer Motion (heavy animation library)
            if (id.includes('framer-motion')) {
              return 'framer-motion';
            }
            // React Query (data fetching)
            if (id.includes('@tanstack/react-query')) {
              return 'react-query';
            }
            // UI components from radix-ui
            if (id.includes('@radix-ui')) {
              return 'radix-ui';
            }
            // Lucide icons
            if (id.includes('lucide-react')) {
              return 'lucide-icons';
            }
            // All other node_modules
            return 'vendor';
          }

          // Component-based splitting for better lazy loading
          if (id.includes('/components/image-analyzer/')) {
            return 'image-analyzer';
          }
          if (id.includes('/components/image-generator/')) {
            return 'image-generator';
          }
          if (id.includes('/components/StoryboardPanel')) {
            return 'storyboard';
          }
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