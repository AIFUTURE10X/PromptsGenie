import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ToolLayout } from '../shared/ToolLayout';
import { Card } from '../../ui/card';
import { Button } from '../../ui/button';
import { Textarea } from '../../ui/textarea';

interface MoodBoardImage {
  id: string;
  url: string;
  prompt: string;
}

interface ColorPalette {
  hex: string;
  name: string;
}

interface MoodBoardCreatorProps {
  onBack?: () => void;
}

export const MoodBoardCreator: React.FC<MoodBoardCreatorProps> = ({ onBack }) => {
  const [theme, setTheme] = useState('');
  const [keywords, setKeywords] = useState<string[]>([]);
  const [keywordInput, setKeywordInput] = useState('');
  const [imageCount, setImageCount] = useState(12);
  const [isGenerating, setIsGenerating] = useState(false);
  const [images, setImages] = useState<MoodBoardImage[]>([]);
  const [colorPalette, setColorPalette] = useState<ColorPalette[]>([]);
  const [selectedLayout, setSelectedLayout] = useState<'grid' | 'masonry'>('grid');

  // Add keyword
  const handleAddKeyword = () => {
    if (keywordInput.trim() && keywords.length < 10) {
      setKeywords([...keywords, keywordInput.trim()]);
      setKeywordInput('');
    }
  };

  // Remove keyword
  const handleRemoveKeyword = (index: number) => {
    setKeywords(keywords.filter((_, i) => i !== index));
  };

  // Generate mood board
  const handleGenerate = async () => {
    if (!theme.trim() && keywords.length === 0) {
      alert('Please enter a theme or add some keywords');
      return;
    }

    setIsGenerating(true);

    try {
      // TODO: Integrate with Gemini API for image generation
      // For now, simulate with placeholder
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Generate placeholder images
      const mockImages: MoodBoardImage[] = Array.from({ length: imageCount }, (_, i) => ({
        id: `img-${i}`,
        url: `https://placehold.co/600x400/${Math.floor(Math.random() * 16777215).toString(16)}/FFF?text=Image+${i + 1}`,
        prompt: `${theme} ${keywords.join(' ')} - variation ${i + 1}`,
      }));

      setImages(mockImages);

      // Generate mock color palette
      const mockPalette: ColorPalette[] = [
        { hex: '#1E3A8A', name: 'Deep Blue' },
        { hex: '#10B981', name: 'Emerald' },
        { hex: '#F59E0B', name: 'Amber' },
        { hex: '#EF4444', name: 'Red' },
        { hex: '#8B5CF6', name: 'Purple' },
      ];

      setColorPalette(mockPalette);
    } catch (error) {
      console.error('Failed to generate mood board:', error);
      alert('Failed to generate mood board. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  // Export mood board
  const handleExport = () => {
    // TODO: Implement export functionality
    alert('Export functionality coming soon!');
  };

  // Clear all
  const handleClear = () => {
    setTheme('');
    setKeywords([]);
    setImages([]);
    setColorPalette([]);
  };

  return (
    <ToolLayout
      title="Mood Board Creator"
      description="Create structured inspiration grids with curated images and color palettes"
      icon="🖼️"
      onBack={onBack}
      maxWidth="2xl"
      primaryAction={{
        label: isGenerating ? 'Generating...' : 'Generate Mood Board',
        onClick: handleGenerate,
        loading: isGenerating,
        disabled: !theme.trim() && keywords.length === 0,
      }}
      secondaryActions={
        images.length > 0 && (
          <>
            <Button
              onClick={handleExport}
              className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg"
            >
              Export
            </Button>
            <Button
              onClick={handleClear}
              variant="outline"
              className="text-gray-400 hover:text-white"
            >
              Clear
            </Button>
          </>
        )
      }
    >
      <div className="space-y-8">
        {/* Configuration Section */}
        <Card className="p-6 bg-gray-800/30 border-gray-700">
          <h2 className="text-xl font-semibold text-white mb-4">Configuration</h2>

          <div className="space-y-6">
            {/* Theme Input */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Theme Description
              </label>
              <Textarea
                value={theme}
                onChange={(e) => setTheme(e.target.value)}
                placeholder="E.g., Modern minimalist interior design with warm tones and natural materials"
                className="w-full min-h-[100px] bg-gray-900/50 border-gray-600 text-white placeholder-gray-500"
              />
            </div>

            {/* Keywords */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Keywords (up to 10)
              </label>
              <div className="flex gap-2 mb-3">
                <input
                  type="text"
                  value={keywordInput}
                  onChange={(e) => setKeywordInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAddKeyword()}
                  placeholder="Add a keyword..."
                  className="flex-1 px-4 py-2 bg-gray-900/50 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-accent"
                  disabled={keywords.length >= 10}
                />
                <Button
                  onClick={handleAddKeyword}
                  disabled={!keywordInput.trim() || keywords.length >= 10}
                  className="bg-brand-accent hover:bg-brand-accent/90 text-white px-4"
                >
                  Add
                </Button>
              </div>

              {/* Keyword Tags */}
              {keywords.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {keywords.map((keyword, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center gap-2 px-3 py-1 bg-brand-accent/20 text-brand-accent rounded-full text-sm"
                    >
                      {keyword}
                      <button
                        onClick={() => handleRemoveKeyword(index)}
                        className="hover:text-white transition-colors"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Settings Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Image Count */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Number of Images
                </label>
                <select
                  value={imageCount}
                  onChange={(e) => setImageCount(Number(e.target.value))}
                  className="w-full px-4 py-2 bg-gray-900/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-brand-accent"
                >
                  <option value={6}>6 images</option>
                  <option value={9}>9 images</option>
                  <option value={12}>12 images (recommended)</option>
                  <option value={15}>15 images</option>
                  <option value={20}>20 images</option>
                </select>
              </div>

              {/* Layout Style */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Layout Style
                </label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setSelectedLayout('grid')}
                    className={`flex-1 px-4 py-2 rounded-lg font-medium transition-all ${
                      selectedLayout === 'grid'
                        ? 'bg-brand-accent text-white'
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                  >
                    Grid
                  </button>
                  <button
                    onClick={() => setSelectedLayout('masonry')}
                    className={`flex-1 px-4 py-2 rounded-lg font-medium transition-all ${
                      selectedLayout === 'masonry'
                        ? 'bg-brand-accent text-white'
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                  >
                    Masonry
                  </button>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Generated Mood Board */}
        {images.length > 0 && (
          <>
            {/* Color Palette */}
            {colorPalette.length > 0 && (
              <Card className="p-6 bg-gray-800/30 border-gray-700">
                <h2 className="text-xl font-semibold text-white mb-4">Color Palette</h2>
                <div className="flex flex-wrap gap-3">
                  {colorPalette.map((color, index) => (
                    <div key={index} className="flex items-center gap-3">
                      <div
                        className="w-16 h-16 rounded-lg shadow-lg border-2 border-white/20"
                        style={{ backgroundColor: color.hex }}
                      />
                      <div>
                        <div className="text-white font-medium">{color.name}</div>
                        <div className="text-gray-400 text-sm font-mono">{color.hex}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* Images Grid */}
            <Card className="p-6 bg-gray-800/30 border-gray-700">
              <h2 className="text-xl font-semibold text-white mb-4">Mood Board Images</h2>
              <div
                className={
                  selectedLayout === 'grid'
                    ? 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4'
                    : 'columns-2 md:columns-3 lg:columns-4 gap-4 space-y-4'
                }
              >
                {images.map((image, index) => (
                  <motion.div
                    key={image.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.05 }}
                    className="group relative overflow-hidden rounded-lg shadow-lg hover:shadow-xl transition-shadow cursor-pointer"
                  >
                    <img
                      src={image.url}
                      alt={image.prompt}
                      className="w-full h-auto object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <div className="text-white text-center p-4">
                        <p className="text-xs">{image.prompt}</p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </Card>
          </>
        )}

        {/* Empty State */}
        {images.length === 0 && !isGenerating && (
          <Card className="p-12 bg-gray-800/30 border-gray-700 border-dashed">
            <div className="text-center">
              <div className="text-6xl mb-4">🖼️</div>
              <h3 className="text-xl font-semibold text-white mb-2">No Mood Board Yet</h3>
              <p className="text-gray-400 mb-4">
                Enter a theme and keywords above, then click "Generate Mood Board"
              </p>
              <div className="text-sm text-gray-500">
                Tip: Be specific about style, colors, and mood for best results
              </div>
            </div>
          </Card>
        )}
      </div>
    </ToolLayout>
  );
};
