import { useState } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Trash2 } from 'lucide-react';
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

  const handleGenerate = async () => {
    if (!prompt || prompt.trim().length === 0) {
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
          prompt,
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

  if (!prompt) {
    return null; // Don't show generator if there's no prompt
  }

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
                Generate images using Gemini Flash 2.5
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
            <label className="text-sm font-semibold text-white uppercase">Current Prompt</label>
            <div className="p-3 rounded-lg bg-black/20 border border-black/30">
              <p className="text-sm text-white line-clamp-3">{prompt}</p>
            </div>
          </div>

          {/* Generate Button */}
          <Button
            onClick={handleGenerate}
            disabled={isGenerating || !prompt}
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
