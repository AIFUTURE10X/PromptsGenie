'use client';

import { ImageAnalyzer } from '@/components/image-analyzer/image-analyzer';

export default function HomePage() {
  return (
    <main className="min-h-screen-safe bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      <div className="container mx-auto px-4 py-8">
        <header className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            PromptsGenie Image Analyzer
          </h1>
          <p className="text-lg text-blue-200 max-w-2xl mx-auto">
            Modern test build with Next.js 14, React Query, and TypeScript strict mode
          </p>
        </header>

        <ImageAnalyzer />
      </div>
    </main>
  );
}
