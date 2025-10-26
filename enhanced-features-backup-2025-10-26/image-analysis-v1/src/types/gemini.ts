export interface TextPart {
  text: string;
}

export interface ImagePart {
  inlineData: {
    mimeType: string;
    data: string;
  };
}

export type DetailLevel = 'short' | 'medium' | 'detailed';

export interface GeminiAnalysisOptions {
  detail?: DetailLevel;
  tags?: boolean;
  analysisType?: 'general' | 'subject' | 'scene' | 'style' | 'composition' | 'mood' | 'technical';
  includeColors?: boolean;
  includeLighting?: boolean;
  includeComposition?: boolean;
  includeMood?: boolean;
  includeStyle?: boolean;
  includeTechnical?: boolean;
}

export interface GeminiAnalysisResult {
  description: string;
  tags?: string[];
  confidence?: number;
  colors?: string[];
  lighting?: string;
  composition?: string;
  mood?: string;
  style?: string;
  technical?: string;
  objects?: string[];
  scene?: string;
}