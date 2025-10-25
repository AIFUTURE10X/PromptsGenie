import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'ImageAnalysisV1',
      formats: ['es', 'cjs'],
      fileName: (format) => `index.${format === 'es' ? 'esm' : format}.js`
    },
    rollupOptions: {
      external: ['react', 'react-dom', '@google/generative-ai'],
      output: {
        globals: {
          react: 'React',
          'react-dom': 'ReactDOM',
          '@google/generative-ai': 'GoogleGenerativeAI'
        }
      }
    }
  }
});