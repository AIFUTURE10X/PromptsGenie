import { useMutation } from '@tanstack/react-query';
import type { AnalysisRequest, AnalysisResponse, AnalyzerType, SpeedMode } from '@/lib/schemas';

interface UseImageAnalysisOptions {
  analyzerType: AnalyzerType;
  speedMode: SpeedMode;
}

export function useImageAnalysis({ analyzerType, speedMode }: UseImageAnalysisOptions) {
  return useMutation({
    mutationFn: async (imageData: string): Promise<AnalysisResponse> => {
      const requestBody: AnalysisRequest = {
        imageData,
        analyzerType,
        speedMode,
      };

      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `API error: ${response.status}`);
      }

      return response.json();
    },
    retry: 1,
  });
}
