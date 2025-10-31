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
}

interface ImageGeneratorProps {
  prompt: string;
}

export function ImageGenerator({ prompt }: ImageGeneratorProps) {
  const [imageCount, setImageCount] = useState(2);
  const [aspectRatio, setAspectRatio] = useState('1:1');
  const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [seed, setSeed] = useState<number | undefined>(undefined);

  // Prompt enhancement states
  const [useEnhancement, setUseEnhancement] = useState(true);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [enhancedPrompt, setEnhancedPrompt] = useState<string>('');
  const [isEditingEnhanced, setIsEditingEnhanced] = useState(false);

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
        body: JSON.stringify({ prompt })
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

      setGeneratedImages(data.images);
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
      className="w-full px-4"
    >
      <Card className="bg-[#F77000] backdrop-blur-sm border-[#F77000]">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl text-white flex items-center gap-2">
                <Sparkles className="w-6 h-6" />
                Image Generator
              </CardTitle>
              <p className="text-sm text-black mt-1">
                {useEnhancement ? 'Gemini Flash 2.5 + Imagen 3' : 'Imagen 3'}
              </p>
            </div>
            {generatedImages.length > 0 && (
              <Button
                onClick={handleClearAll}
                variant="secondary"
                size="sm"
                className="flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Clear All
              </Button>
            )}
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Prompt Enhancement Toggle */}
          <div className="flex items-center justify-between p-3 rounded-lg bg-black/10 border border-black/20">
            <div className="flex items-center gap-3">
              <Wand2 className="w-5 h-5 text-white" />
              <div>
                <p className="text-sm font-semibold text-white">Enhance Prompt with Gemini Flash 2.5</p>
                <p className="text-xs text-white/80">AI improves your prompt for better images</p>
              </div>
            </div>
            <button
              onClick={handleToggleEnhancement}
              className={`relative w-12 h-6 rounded-full transition-colors ${
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

          {/* Controls Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Image Count Selector */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-white uppercase">Number of Images</label>
              <div className="flex gap-2">
                {[1, 2, 3, 4].map((count) => (
                  <button
                    key={count}
                    onClick={() => setImageCount(count)}
                    className={`flex-1 px-4 py-3 rounded-md font-bold text-lg transition-all ${
                      imageCount === count
                        ? 'bg-black text-white shadow-lg'
                        : 'bg-black/20 text-white hover:bg-black/30'
                    }`}
                  >
                    {count}
                  </button>
                ))}
              </div>
            </div>

            {/* Seed Input (Optional) */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-white uppercase">
                Seed (Optional)
              </label>
              <input
                type="number"
                value={seed ?? ''}
                onChange={(e) => setSeed(e.target.value ? parseInt(e.target.value) : undefined)}
                placeholder="Random"
                className="w-full px-4 py-3 rounded-md bg-black/20 border border-black/30 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/50"
              />
            </div>
          </div>

          {/* Aspect Ratio Selector */}
          <AspectRatioSelector
            selectedRatio={aspectRatio}
            onRatioChange={setAspectRatio}
          />

          {/* Prompt Display */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-semibold text-white uppercase">
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
                <Wand2 className="w-4 h-4 text-white animate-spin" />
                <p className="text-sm text-white">Enhancing prompt with Gemini Flash 2.5...</p>
              </div>
            ) : isEditingEnhanced && useEnhancement && enhancedPrompt ? (
              <textarea
                value={enhancedPrompt}
                onChange={(e) => setEnhancedPrompt(e.target.value)}
                className="w-full p-3 rounded-lg bg-black/20 border border-black/30 text-white resize-none focus:outline-none focus:ring-2 focus:ring-white/50 text-sm"
                rows={4}
              />
            ) : (
              <div className="p-3 rounded-lg bg-black/20 border border-black/30">
                <p className="text-sm text-white whitespace-pre-wrap">{displayPrompt}</p>
              </div>
            )}

            {/* Show original prompt if enhancement is active */}
            {useEnhancement && enhancedPrompt && !isEditingEnhanced && (
              <details className="text-xs">
                <summary className="cursor-pointer text-white/60 hover:text-white/80">
                  Show original prompt
                </summary>
                <div className="mt-2 p-2 rounded bg-black/10 text-white/80">
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
              className="w-full flex items-center justify-center gap-2"
            >
              <Wand2 className="w-4 h-4" />
              Re-enhance Prompt
            </Button>
          )}

          {/* Generate Button */}
          <Button
            onClick={handleGenerate}
            disabled={isGenerating || isEnhancing || !prompt}
            className="w-full py-6 text-lg font-bold"
            size="lg"
          >
            {isGenerating ? (
              <>
                <Sparkles className="w-5 h-5 mr-2 animate-spin" />
                Generating {imageCount} {imageCount === 1 ? 'Image' : 'Images'}...
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5 mr-2" />
                Generate {imageCount} {imageCount === 1 ? 'Image' : 'Images'}
              </>
            )}
          </Button>

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
              />
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
