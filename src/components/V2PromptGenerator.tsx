import React from 'react';
import { PromptGenerationOptions, PromptGenerationResult } from '../services/imageToPrompt';
import { PROMPT_TEMPLATES, TemplateType } from '../lib/promptTemplates';

interface V2PromptGeneratorProps {
  v2PromptMode: boolean;
  setV2PromptMode: (mode: boolean) => void;
  selectedTemplate: TemplateType;
  setSelectedTemplate: (template: TemplateType) => void;
  v2PromptOptions: PromptGenerationOptions;
  updateV2Options: (options: Partial<PromptGenerationOptions>) => void;
  v2PromptResult: PromptGenerationResult | null;
  v2PromptVariations: PromptGenerationResult[];
  isGeneratingV2Prompt: boolean;
  generateV2Prompt: () => void;
  generateV2Variations: (count?: number) => void;
  applyV2PromptVariation: (variation: PromptGenerationResult) => void;
  hasImages: boolean;
}

const V2PromptGenerator: React.FC<V2PromptGeneratorProps> = ({
  v2PromptMode,
  setV2PromptMode,
  selectedTemplate,
  setSelectedTemplate,
  v2PromptOptions,
  updateV2Options,
  v2PromptResult,
  v2PromptVariations,
  isGeneratingV2Prompt,
  generateV2Prompt,
  generateV2Variations,
  applyV2PromptVariation,
  hasImages
}) => {
  return (
    <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white">V2 Image-to-Prompt Generator</h3>
        <label className="flex items-center space-x-2">
          <input
            type="checkbox"
            checked={v2PromptMode}
            onChange={(e) => setV2PromptMode(e.target.checked)}
            className="rounded"
          />
          <span className="text-white text-sm">Enable V2 Mode</span>
        </label>
      </div>

      {v2PromptMode && (
        <div className="space-y-4">
          {/* Template Selection */}
          <div>
            <label className="block text-white text-sm font-medium mb-2">
              Prompt Template
            </label>
            <select
              value={selectedTemplate}
              onChange={(e) => setSelectedTemplate(e.target.value as TemplateType)}
              className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-md text-white"
            >
              {Object.entries(PROMPT_TEMPLATES).map(([key, template]) => (
                <option key={key} value={key} className="bg-gray-800">
                  {template.name}
                </option>
              ))}
            </select>
            <p className="text-white/70 text-xs mt-1">
              {PROMPT_TEMPLATES[selectedTemplate].description}
            </p>
          </div>

          {/* Options Configuration */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-white text-sm font-medium mb-2">
                Style
              </label>
              <select
                value={v2PromptOptions.style || 'descriptive'}
                onChange={(e) => updateV2Options({ style: e.target.value as any })}
                className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-md text-white"
              >
                <option value="creative" className="bg-gray-800">Creative</option>
                <option value="technical" className="bg-gray-800">Technical</option>
                <option value="artistic" className="bg-gray-800">Artistic</option>
                <option value="descriptive" className="bg-gray-800">Descriptive</option>
                <option value="storytelling" className="bg-gray-800">Storytelling</option>
              </select>
            </div>

            <div>
              <label className="block text-white text-sm font-medium mb-2">
                Length
              </label>
              <select
                value={v2PromptOptions.length || 'medium'}
                onChange={(e) => updateV2Options({ length: e.target.value as any })}
                className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-md text-white"
              >
                <option value="short" className="bg-gray-800">Short</option>
                <option value="medium" className="bg-gray-800">Medium</option>
                <option value="long" className="bg-gray-800">Long</option>
                <option value="detailed" className="bg-gray-800">Detailed</option>
              </select>
            </div>

            <div>
              <label className="block text-white text-sm font-medium mb-2">
                Focus
              </label>
              <select
                value={v2PromptOptions.focus || 'all'}
                onChange={(e) => updateV2Options({ focus: e.target.value as any })}
                className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-md text-white"
              >
                <option value="all" className="bg-gray-800">All Elements</option>
                <option value="composition" className="bg-gray-800">Composition</option>
                <option value="colors" className="bg-gray-800">Colors</option>
                <option value="mood" className="bg-gray-800">Mood</option>
                <option value="subjects" className="bg-gray-800">Subjects</option>
                <option value="lighting" className="bg-gray-800">Lighting</option>
                <option value="style" className="bg-gray-800">Style</option>
              </select>
            </div>

            <div>
              <label className="block text-white text-sm font-medium mb-2">
                Use Case
              </label>
              <select
                value={v2PromptOptions.useCase || 'art_generation'}
                onChange={(e) => updateV2Options({ useCase: e.target.value as any })}
                className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-md text-white"
              >
                <option value="art_generation" className="bg-gray-800">Art Generation</option>
                <option value="photography" className="bg-gray-800">Photography</option>
                <option value="design" className="bg-gray-800">Design</option>
                <option value="writing" className="bg-gray-800">Writing</option>
                <option value="analysis" className="bg-gray-800">Analysis</option>
              </select>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-3">
            <button
              onClick={generateV2Prompt}
              disabled={!hasImages || isGeneratingV2Prompt}
              className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-md transition-colors"
            >
              {isGeneratingV2Prompt ? 'Generating...' : 'Generate V2 Prompt'}
            </button>
            <button
              onClick={() => generateV2Variations(3)}
              disabled={!hasImages || isGeneratingV2Prompt}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-md transition-colors"
            >
              Generate Variations
            </button>
          </div>

          {/* Results Display */}
          {v2PromptResult && (
            <div className="mt-6 space-y-4">
              <h4 className="text-white font-medium">Generated Prompt</h4>
              <div className="bg-black/20 rounded-lg p-4 space-y-3">
                <div>
                  <label className="block text-white/70 text-sm font-medium mb-1">
                    Main Prompt
                  </label>
                  <p className="text-white text-sm bg-white/5 rounded p-2">
                    {v2PromptResult.mainPrompt}
                  </p>
                </div>

                {v2PromptResult.negativePrompt && (
                  <div>
                    <label className="block text-white/70 text-sm font-medium mb-1">
                      Negative Prompt
                    </label>
                    <p className="text-white text-sm bg-white/5 rounded p-2">
                      {v2PromptResult.negativePrompt}
                    </p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-white/70 text-sm font-medium mb-1">
                      Style Keywords
                    </label>
                    <div className="flex flex-wrap gap-1">
                      {v2PromptResult.styleKeywords.map((keyword, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 bg-blue-600/30 text-white text-xs rounded"
                        >
                          {keyword}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-white/70 text-sm font-medium mb-1">
                      Mood: {v2PromptResult.mood}
                    </label>
                    <div className="text-white/70 text-sm">
                      Confidence: {Math.round(v2PromptResult.confidence * 100)}%
                    </div>
                  </div>
                </div>

                {v2PromptResult.suggestions.length > 0 && (
                  <div>
                    <label className="block text-white/70 text-sm font-medium mb-1">
                      Suggestions
                    </label>
                    <ul className="text-white text-sm space-y-1">
                      {v2PromptResult.suggestions.map((suggestion, index) => (
                        <li key={index} className="text-white/80">
                          • {suggestion}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Variations Display */}
          {v2PromptVariations.length > 0 && (
            <div className="mt-6">
              <h4 className="text-white font-medium mb-3">Prompt Variations</h4>
              <div className="space-y-3">
                {v2PromptVariations.map((variation, index) => (
                  <div
                    key={index}
                    className="bg-black/20 rounded-lg p-3 cursor-pointer hover:bg-black/30 transition-colors"
                    onClick={() => applyV2PromptVariation(variation)}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-white/70 text-sm font-medium">
                        Variation {index + 1}
                      </span>
                      <span className="text-white/60 text-xs">
                        {Math.round(variation.confidence * 100)}% confidence
                      </span>
                    </div>
                    <p className="text-white text-sm line-clamp-3">
                      {variation.mainPrompt}
                    </p>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {variation.styleKeywords.slice(0, 3).map((keyword, kIndex) => (
                        <span
                          key={kIndex}
                          className="px-2 py-1 bg-purple-600/30 text-white text-xs rounded"
                        >
                          {keyword}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default V2PromptGenerator;