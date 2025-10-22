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
  base: process.env.NODE_ENV === 'production' ? '/Genie-Prompt-Generator/' : '/',
  server: {
    port: 8085,
    open: true,
  },
});