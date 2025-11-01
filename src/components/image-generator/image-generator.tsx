import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Trash2, Wand2, Edit3 } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { AspectRatioSelector } from './aspect-ratio-selector';
import { ImageGrid } from './image-grid';

interface GeneratedImage {
  index: number;
  imageData: string;
  mimeType: string;
  prompt?: string;
}

interface ImageGeneratorProps {
  prompt: string;
  subjectPrompt?: string | null;
  scenePrompt?: string | null;
  stylePrompt?: string | null;
}

export function ImageGenerator({ prompt, subjectPrompt, scenePrompt, stylePrompt }: ImageGeneratorProps) {
  const [imageCount, setImageCount] = useState(2);
  const [aspectRatio, setAspectRatio] = useState('1:1');
  const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [seed, setSeed] = useState<number | undefined>(undefined);
  const [modelInfo, setModelInfo] = useState<string | null>(null);

  // Prompt enhancement states
  const [useEnhancement, setUseEnhancement] = useState(true);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [enhancedPrompt, setEnhancedPrompt] = useState<string>('');
  const [isEditingEnhanced, setIsEditingEnhanced] = useState(false);
  const [styleIntensity, setStyleIntensity] = useState<'subtle' | 'moderate' | 'strong'>('moderate');
  const [preciseReference, setPreciseReference] = useState(false);

  // Auto-enhance when prompt changes and enhancement is enabled
  useEffect(() => {
    if (prompt && useEnhancement && !enhancedPrompt) {
      handleEnhancePrompt();
    }
  }, [prompt, useEnhancement]);

  const handleEnhancePrompt = async () => {
    if (!prompt || prompt.trim().length === 0) {
      return;
    }

    setIsEnhancing(true);
    setError(null);

    try {
      const response = await fetch('/.netlify/functions/gemini-enhance-prompt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt,
          subjectPrompt: subjectPrompt || null,
          scenePrompt: scenePrompt || null,
          stylePrompt: stylePrompt || null,
          styleIntensity: styleIntensity,
          preciseReference: preciseReference
        })
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to enhance prompt');
      }

      setEnhancedPrompt(data.enhancedPrompt);
    } catch (err) {
      console.error('Prompt enhancement error:', err);
      setError(err instanceof Error ? err.message : 'Failed to enhance prompt');
      // Fall back to original prompt if enhancement fails
      setUseEnhancement(false);
    } finally {
      setIsEnhancing(false);
    }
  };

  const handleGenerate = async () => {
    const finalPrompt = useEnhancement && enhancedPrompt ? enhancedPrompt : prompt;

    if (!finalPrompt || finalPrompt.trim().length === 0) {
      setError('Please provide a prompt from the image analyzer above');
      return;
    }

    setIsGenerating(true);
    setError(null);
    setGeneratedImages([]);
    setModelInfo(null);

    try {
      const response = await fetch('/.netlify/functions/gemini-image-gen', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: finalPrompt,
          count: imageCount,
          aspectRatio,
          seed
        })
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to generate images');
      }

      // Add the prompt to each generated image
      const imagesWithPrompt = data.images.map((img: GeneratedImage) => ({
        ...img,
        prompt: finalPrompt
      }));
      setGeneratedImages(imagesWithPrompt);

      // Display model info if fallback was used
      if (data.fallbackUsed) {
        setModelInfo('⚠️ Using Imagen 2 (Imagen 3 quota exceeded)');
      } else if (data.modelUsed) {
        setModelInfo(`✓ Generated with ${data.modelUsed}`);
      }
    } catch (err) {
      console.error('Image generation error:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate images');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleClearAll = () => {
    setGeneratedImages([]);
    setError(null);
  };

  const handleDeleteImage = (index: number) => {
    setGeneratedImages(prevImages => prevImages.filter(img => img.index !== index));
  };

  const handleToggleEnhancement = () => {
    setUseEnhancement(!useEnhancement);
    if (!useEnhancement && !enhancedPrompt && prompt) {
      // Re-enhance when turning on
      handleEnhancePrompt();
    }
  };

  if (!prompt) {
    return null; // Don't show generator if there's no prompt
  }

  const displayPrompt = useEnhancement && enhancedPrompt ? enhancedPrompt : prompt;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="w-full"
    >
      <Card className="bg-[#F77000] backdrop-blur-sm border-[#F77000]">
        <CardHeader className="pb-3 px-3 sm:px-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <CardTitle className="text-lg sm:text-xl text-white flex items-center gap-2">
                <Sparkles className="w-5 h-5 sm:w-6 sm:h-6" />
                Image Generator
              </CardTitle>
              <p className="text-xs sm:text-sm text-black mt-1">
                {useEnhancement ? 'Gemini Flash 2.5 + Imagen 3' : 'Imagen 3'}
              </p>
            </div>
            {generatedImages.length > 0 && (
              <Button
                onClick={handleClearAll}
                variant="secondary"
                size="sm"
                className="flex items-center gap-2 text-xs sm:text-sm w-full sm:w-auto"
              >
                <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                Clear All
              </Button>
            )}
          </div>
        </CardHeader>

        <CardContent className="space-y-4 px-3 sm:px-6">
          {/* Prompt Enhancement Toggle */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3 rounded-lg bg-black/10 border border-black/20">
            <div className="flex items-start gap-3">
              <Wand2 className="w-5 h-5 text-white flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs sm:text-sm font-semibold text-white">Enhance Prompt with Gemini Flash 2.5</p>
                <p className="text-xs text-white/80">AI improves your prompt for better images</p>
              </div>
            </div>
            <button
              onClick={handleToggleEnhancement}
              className={`relative w-12 h-6 rounded-full transition-colors flex-shrink-0 ${
                useEnhancement ? 'bg-white' : 'bg-black/30'
              }`}
            >
              <span
                className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-black transition-transform ${
                  useEnhancement ? 'translate-x-6' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Single Row Settings */}
          <div className="space-y-2">
            <label className="text-xs sm:text-sm font-semibold text-white uppercase">Settings</label>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
              {/* Number of Images Dropdown */}
              <div className="flex flex-col">
                <label className="text-xs text-white/80 mb-1">Images</label>
                <select
                  value={imageCount}
                  onChange={(e) => setImageCount(parseInt(e.target.value))}
                  className="px-3 py-2 rounded-md bg-black/20 border border-black/30 text-white text-sm focus:outline-none focus:ring-2 focus:ring-white/50"
                >
                  {[1, 2, 3, 4].map((count) => (
                    <option key={count} value={count}>{count} {count === 1 ? 'Image' : 'Images'}</option>
                  ))}
                </select>
              </div>

              {/* Aspect Ratio Dropdown */}
              <div className="flex flex-col">
                <label className="text-xs text-white/80 mb-1">Aspect Ratio</label>
                <select
                  value={aspectRatio}
                  onChange={(e) => setAspectRatio(e.target.value)}
                  className="px-3 py-2 rounded-md bg-black/20 border border-black/30 text-white text-sm focus:outline-none focus:ring-2 focus:ring-white/50"
                >
                  <option value="1:1">1:1 Square</option>
                  <option value="16:9">16:9 Landscape</option>
                  <option value="9:16">9:16 Portrait</option>
                  <option value="4:3">4:3 Classic</option>
                  <option value="3:4">3:4 Portrait</option>
                </select>
              </div>

              {/* Seed Input */}
              <div className="flex flex-col">
                <label className="text-xs text-white/80 mb-1">Seed</label>
                <input
                  type="number"
                  value={seed ?? ''}
                  onChange={(e) => setSeed(e.target.value ? parseInt(e.target.value) : undefined)}
                  placeholder="Random"
                  className="px-3 py-2 rounded-md bg-black/20 border border-black/30 text-white text-sm placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/50"
                />
              </div>

              {/* Precise Reference Toggle */}
              <div className="flex flex-col justify-end">
                <label className="text-xs text-white/80 mb-1">Precise Reference</label>
                <button
                  onClick={() => setPreciseReference(!preciseReference)}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                    preciseReference
                      ? 'bg-white text-black'
                      : 'bg-black/20 text-white hover:bg-black/30'
                  }`}
                  title={preciseReference
                    ? "Precise mode ON - Uses uploaded image for precise outputs"
                    : "Precise mode OFF - Whisk will caption and interpret your image"}
                >
                  <span className={`w-2 h-2 rounded-full ${preciseReference ? 'bg-black' : 'bg-white'}`}></span>
                  {preciseReference ? 'ON' : 'OFF'}
                </button>
              </div>
            </div>

            {/* Precise Reference Info */}
            {preciseReference && (
              <div className="p-2 rounded bg-yellow-500/20 border border-yellow-500/30">
                <p className="text-xs text-yellow-100">
                  Precise mode directly uses your uploaded image for more precise outputs. When turned off, Whisk will caption and interpret your image for a more creative output.
                </p>
              </div>
            )}
          </div>

          {/* Style Intensity Control */}
          {stylePrompt && (
            <div className="space-y-2">
              <label className="text-xs sm:text-sm font-semibold text-white uppercase">
                Style Intensity (Accuracy vs Creativity)
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(['subtle', 'moderate', 'strong'] as const).map((intensity) => (
                  <button
                    key={intensity}
                    onClick={() => setStyleIntensity(intensity)}
                    className={`px-3 py-2.5 sm:px-4 sm:py-3 rounded-md font-bold text-xs sm:text-sm transition-all capitalize ${
                      styleIntensity === intensity
                        ? 'bg-black text-white shadow-lg'
                        : 'bg-black/20 text-white hover:bg-black/30'
                    }`}
                  >
                    {intensity}
                  </button>
                ))}
              </div>
              <p className="text-xs text-white/70">
                {styleIntensity === 'subtle' && 'Photorealistic base with subtle style hints - best for preserving subject accuracy'}
                {styleIntensity === 'moderate' && 'Balanced style application while maintaining realism'}
                {styleIntensity === 'strong' && 'Full artistic interpretation - may modify subject appearance'}
              </p>
            </div>
          )}

          {/* Prompt Display */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs sm:text-sm font-semibold text-white uppercase">
                {useEnhancement && enhancedPrompt ? 'Enhanced Prompt' : 'Current Prompt'}
              </label>
              {useEnhancement && enhancedPrompt && (
                <button
                  onClick={() => setIsEditingEnhanced(!isEditingEnhanced)}
                  className="text-xs text-white/80 hover:text-white flex items-center gap-1"
                >
                  <Edit3 className="w-3 h-3" />
                  {isEditingEnhanced ? 'Done' : 'Edit'}
                </button>
              )}
            </div>

            {isEnhancing ? (
              <div className="p-3 rounded-lg bg-black/20 border border-black/30 flex items-center gap-2">
                <Wand2 className="w-4 h-4 text-white animate-spin flex-shrink-0" />
                <p className="text-xs sm:text-sm text-white">Enhancing prompt with Gemini Flash 2.5...</p>
              </div>
            ) : isEditingEnhanced && useEnhancement && enhancedPrompt ? (
              <textarea
                value={enhancedPrompt}
                onChange={(e) => setEnhancedPrompt(e.target.value)}
                className="w-full p-2.5 sm:p-3 rounded-lg bg-black/20 border border-black/30 text-white resize-none focus:outline-none focus:ring-2 focus:ring-white/50 text-xs sm:text-sm"
                rows={4}
              />
            ) : (
              <div className="p-2.5 sm:p-3 rounded-lg bg-black/20 border border-black/30">
                <p className="text-xs sm:text-sm text-white whitespace-pre-wrap break-words">{displayPrompt}</p>
              </div>
            )}

            {/* Show original prompt if enhancement is active */}
            {useEnhancement && enhancedPrompt && !isEditingEnhanced && (
              <details className="text-xs">
                <summary className="cursor-pointer text-white/60 hover:text-white/80">
                  Show original prompt
                </summary>
                <div className="mt-2 p-2 rounded bg-black/10 text-white/80 break-words">
                  {prompt}
                </div>
              </details>
            )}
          </div>

          {/* Re-enhance Button */}
          {useEnhancement && !isEnhancing && (
            <Button
              onClick={handleEnhancePrompt}
              variant="secondary"
              size="sm"
              className="w-full flex items-center justify-center gap-2 text-xs sm:text-sm"
            >
              <Wand2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              Re-enhance Prompt
            </Button>
          )}

          {/* Generate Button */}
          <Button
            onClick={handleGenerate}
            disabled={isGenerating || isEnhancing || !prompt}
            className="w-full py-4 sm:py-6 text-base sm:text-lg font-bold"
            size="lg"
          >
            {isGenerating ? (
              <>
                <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 mr-2 animate-spin" />
                <span className="hidden sm:inline">Generating {imageCount} {imageCount === 1 ? 'Image' : 'Images'}...</span>
                <span className="sm:hidden">Generating...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                <span className="hidden sm:inline">Generate {imageCount} {imageCount === 1 ? 'Image' : 'Images'}</span>
                <span className="sm:hidden">Generate</span>
              </>
            )}
          </Button>

          {/* Model Info Display (Fallback notification) */}
          {modelInfo && !error && (
            <div className={`p-3 rounded-lg ${
              modelInfo.includes('⚠️')
                ? 'bg-yellow-500/20 border border-yellow-500/30'
                : 'bg-green-500/20 border border-green-500/30'
            }`}>
              <p className={`text-xs sm:text-sm font-medium ${
                modelInfo.includes('⚠️')
                  ? 'text-yellow-100'
                  : 'text-green-100'
              }`}>{modelInfo}</p>
            </div>
          )}

          {/* Error Display */}
          {error && (
            <div className="p-4 rounded-lg bg-red-500/20 border border-red-500/30">
              <p className="text-sm text-red-100 font-medium">{error}</p>
            </div>
          )}

          {/* Image Grid */}
          {(generatedImages.length > 0 || isGenerating) && (
            <div className="pt-4">
              <ImageGrid
                images={generatedImages}
                imageCount={imageCount}
                aspectRatio={aspectRatio}
                isGenerating={isGenerating}
                onDeleteImage={handleDeleteImage}
              />
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
