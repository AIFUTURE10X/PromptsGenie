import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import viteCompression from 'vite-plugin-compression';
import { visualizer } from 'rollup-plugin-visualizer';
import viteImagemin from 'vite-plugin-imagemin';

export default defineConfig(({ mode }) => ({
  plugins: [
    react(),

    // Brotli compression (better than gzip, ~15-20% more compression)
    viteCompression({
      algorithm: 'brotliCompress',
      ext: '.br',
      threshold: 10240, // Only compress files > 10KB
      deleteOriginFile: false,
    }),

    // Gzip compression (fallback for older browsers)
    viteCompression({
      algorithm: 'gzip',
      ext: '.gz',
      threshold: 10240,
      deleteOriginFile: false,
    }),

    // Image optimization
    viteImagemin({
      gifsicle: { optimizationLevel: 7, interlaced: false },
      optipng: { optimizationLevel: 7 },
      mozjpeg: { quality: 80 },
      pngquant: { quality: [0.8, 0.9], speed: 4 },
      webp: { quality: 80 }
    }),

    // Bundle visualization (generates stats.html in dist/)
    visualizer({
      open: false, // Don't auto-open
      gzipSize: true,
      brotliSize: true,
      filename: 'dist/stats.html',
    }),
  ],
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
  css: {
    devSourcemap: false,
    transformer: 'lightningcss',
    lightningcss: {
      minify: true,
      targets: {
        chrome: 90,
        firefox: 88,
        safari: 14,
        edge: 90,
      },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    target: 'es2020', // Modern browsers only for better optimization
    cssCodeSplit: true,
    cssMinify: 'lightningcss', // Faster than default
    minify: 'terser',
    modulePreload: { polyfill: true }, // Improve module loading
    terserOptions: {
      compress: {
        drop_console: mode === 'production',
        drop_debugger: true,
        pure_funcs: mode === 'production' ? ['console.log', 'console.info', 'console.debug'] : [],
        passes: 2, // Two-pass compression for better results
      },
      mangle: {
        safari10: true, // Fix Safari 10/11 bugs
      },
    },
    rollupOptions: {
      output: {
        manualChunks(id) {
          // Advanced vendor splitting strategy for optimal caching and parallel loading
          if (id.includes('node_modules')) {
            // React core (critical, loaded on every page)
            if (id.includes('react') || id.includes('react-dom') || id.includes('react/jsx-runtime')) {
              return 'react-vendor';
            }

            // Heavy libraries (split separately for better caching)
            if (id.includes('framer-motion')) return 'framer-motion';
            if (id.includes('@tanstack/react-query')) return 'react-query';
            if (id.includes('@supabase/supabase-js')) return 'supabase';
            if (id.includes('google-auth-library')) return 'google-auth';
            if (id.includes('react-dropzone')) return 'react-dropzone';
            if (id.includes('glightbox')) return 'glightbox';

            // UI libraries (group together as they're used together)
            if (id.includes('@radix-ui')) return 'radix-ui';
            if (id.includes('lucide-react')) return 'lucide-icons';

            // Small utilities (can group together)
            if (id.includes('clsx') || id.includes('tailwind-merge') ||
                id.includes('class-variance-authority')) return 'ui-utils';
            if (id.includes('uuid') || id.includes('zod')) return 'utils';

            // Everything else (should be minimal now)
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
        experimentalMinChunkSize: 10000, // Merge chunks smaller than 10KB
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