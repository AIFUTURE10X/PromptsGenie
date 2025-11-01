import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ToolLayout } from '../shared/ToolLayout';
import { Card } from '../../ui/card';
import { Button } from '../../ui/button';
import { Textarea } from '../../ui/textarea';

interface StyleElement {
  colors: string[];
  typography: {
    heading: string;
    body: string;
  };
  buttons: string[];
  textures: string[];
}

interface StyleTileGeneratorProps {
  onBack?: () => void;
}

export const StyleTileGenerator: React.FC<StyleTileGeneratorProps> = ({ onBack }) => {
  const [brandName, setBrandName] = useState('');
  const [brandDescription, setBrandDescription] = useState('');
  const [adjectives, setAdjectives] = useState<string[]>([]);
  const [adjectiveInput, setAdjectiveInput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [styleTile, setStyleTile] = useState<StyleElement | null>(null);

  const handleAddAdjective = () => {
    if (adjectiveInput.trim() && adjectives.length < 5) {
      setAdjectives([...adjectives, adjectiveInput.trim()]);
      setAdjectiveInput('');
    }
  };

  const handleRemoveAdjective = (index: number) => {
    setAdjectives(adjectives.filter((_, i) => i !== index));
  };

  const handleGenerate = async () => {
    if (!brandName.trim() || !brandDescription.trim()) {
      alert('Please enter brand name and description');
      return;
    }

    setIsGenerating(true);

    try {
      // TODO: Integrate with Gemini API for style generation
      await new Promise(resolve => setTimeout(resolve, 2000));

      const mockStyleTile: StyleElement = {
        colors: ['#1E3A8A', '#3B82F6', '#60A5FA', '#93C5FD', '#DBEAFE'],
        typography: {
          heading: 'Inter Bold, 32px',
          body: 'Inter Regular, 16px',
        },
        buttons: ['Primary: Rounded, Bold', 'Secondary: Outlined', 'Ghost: Text only'],
        textures: ['Subtle grain', 'Smooth gradient', 'Matte finish'],
      };

      setStyleTile(mockStyleTile);
    } catch (error) {
      console.error('Failed to generate style tile:', error);
      alert('Failed to generate style tile. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleExport = () => {
    alert('Export functionality coming soon!');
  };

  const handleClear = () => {
    setBrandName('');
    setBrandDescription('');
    setAdjectives([]);
    setStyleTile(null);
  };

  return (
    <ToolLayout
      title="Style Tile Generator"
      description="Create brand element snapshots with color palettes, typography, buttons, and textures"
      onBack={onBack}
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input Section */}
        <Card className="p-6 bg-gray-800/50 border-gray-700">
          <h3 className="text-xl font-semibold text-white mb-4">Brand Details</h3>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Brand Name
              </label>
              <input
                type="text"
                value={brandName}
                onChange={(e) => setBrandName(e.target.value)}
                placeholder="Enter brand name..."
                className="w-full px-4 py-2 bg-gray-900/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-accent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Brand Description
              </label>
              <Textarea
                value={brandDescription}
                onChange={(e) => setBrandDescription(e.target.value)}
                placeholder="Describe your brand identity, values, and aesthetic..."
                className="min-h-[120px] bg-gray-900/50 border-gray-600 text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Brand Adjectives (up to 5)
              </label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={adjectiveInput}
                  onChange={(e) => setAdjectiveInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAddAdjective()}
                  placeholder="modern, bold, elegant..."
                  className="flex-1 px-4 py-2 bg-gray-900/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-accent"
                />
                <Button onClick={handleAddAdjective} variant="outline" size="sm">
                  Add
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {adjectives.map((adj, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="px-3 py-1 bg-brand-accent/20 text-brand-accent rounded-full text-sm flex items-center gap-2"
                  >
                    {adj}
                    <button
                      onClick={() => handleRemoveAdjective(index)}
                      className="hover:text-white transition-colors"
                    >
                      ×
                    </button>
                  </motion.div>
                ))}
              </div>
            </div>

            <div className="flex gap-2 pt-4">
              <Button
                onClick={handleGenerate}
                disabled={isGenerating}
                className="flex-1"
              >
                {isGenerating ? 'Generating...' : 'Generate Style Tile'}
              </Button>
              <Button onClick={handleClear} variant="outline">
                Clear
              </Button>
            </div>
          </div>
        </Card>

        {/* Preview Section */}
        <Card className="p-6 bg-gray-800/50 border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-semibold text-white">Style Tile Preview</h3>
            {styleTile && (
              <Button onClick={handleExport} variant="outline" size="sm">
                Export
              </Button>
            )}
          </div>

          {!styleTile ? (
            <div className="flex items-center justify-center h-[500px] text-gray-400">
              <p>Generate a style tile to see preview</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Color Palette */}
              <div>
                <h4 className="text-sm font-semibold text-gray-300 mb-3">Color Palette</h4>
                <div className="flex gap-2">
                  {styleTile.colors.map((color, index) => (
                    <div key={index} className="flex-1">
                      <div
                        className="h-20 rounded-lg mb-2"
                        style={{ backgroundColor: color }}
                      />
                      <p className="text-xs text-gray-400 text-center">{color}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Typography */}
              <div>
                <h4 className="text-sm font-semibold text-gray-300 mb-3">Typography</h4>
                <div className="space-y-2">
                  <div className="p-4 bg-gray-900/50 rounded-lg">
                    <p className="text-xs text-gray-400 mb-1">Heading</p>
                    <p className="text-white font-bold text-xl">{styleTile.typography.heading}</p>
                  </div>
                  <div className="p-4 bg-gray-900/50 rounded-lg">
                    <p className="text-xs text-gray-400 mb-1">Body</p>
                    <p className="text-white">{styleTile.typography.body}</p>
                  </div>
                </div>
              </div>

              {/* Buttons */}
              <div>
                <h4 className="text-sm font-semibold text-gray-300 mb-3">Button Styles</h4>
                <div className="space-y-2">
                  {styleTile.buttons.map((button, index) => (
                    <div key={index} className="p-3 bg-gray-900/50 rounded-lg text-white text-sm">
                      {button}
                    </div>
                  ))}
                </div>
              </div>

              {/* Textures */}
              <div>
                <h4 className="text-sm font-semibold text-gray-300 mb-3">Textures & Materials</h4>
                <div className="space-y-2">
                  {styleTile.textures.map((texture, index) => (
                    <div key={index} className="p-3 bg-gray-900/50 rounded-lg text-white text-sm">
                      {texture}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </Card>
      </div>
    </ToolLayout>
  );
};
