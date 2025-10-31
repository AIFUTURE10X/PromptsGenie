import { useMutation } from '@tanstack/react-query';
import type { AnalyzerType, SpeedMode } from '../lib/schemas';

interface UseImageAnalysisOptions {
  analyzerType: AnalyzerType;
  speedMode: SpeedMode;
}

interface AnalysisResponse {
  success: boolean;
  prompt?: string;
  error?: string;
  details?: {
    finishReason?: string;
    safetyRatings?: any[];
  };
}

export function useImageAnalysis({ analyzerType, speedMode }: UseImageAnalysisOptions) {
  return useMutation({
    mutationFn: async (imageData: string): Promise<AnalysisResponse> => {
      const requestBody = {
        imageData,
        analyzerType,
        speedMode,
      };

      const response = await fetch('/.netlify/functions/gemini-images', {
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
