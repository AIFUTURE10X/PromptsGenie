import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ToolLayout } from '../shared/ToolLayout';
import { Card } from '../../ui/card';
import { Button } from '../../ui/button';
import { Textarea } from '../../ui/textarea';

interface ColorStory {
  primary: string[];
  secondary: string[];
  accent: string[];
  proportions: { color: string; percentage: number }[];
  materials: string[];
}

interface ColorStoryBuilderProps {
  onBack?: () => void;
}

export const ColorStoryBuilder: React.FC<ColorStoryBuilderProps> = ({ onBack }) => {
  const [mood, setMood] = useState('');
  const [inspiration, setInspiration] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [colorStory, setColorStory] = useState<ColorStory | null>(null);

  const handleGenerate = async () => {
    if (!mood.trim()) {
      alert('Please enter a mood or theme');
      return;
    }

    setIsGenerating(true);

    try {
      await new Promise(resolve => setTimeout(resolve, 2000));

      const mockColorStory: ColorStory = {
        primary: ['#2563EB', '#1E40AF', '#1E3A8A'],
        secondary: ['#10B981', '#059669', '#047857'],
        accent: ['#F59E0B', '#D97706', '#B45309'],
        proportions: [
          { color: '#2563EB', percentage: 60 },
          { color: '#10B981', percentage: 25 },
          { color: '#F59E0B', percentage: 15 },
        ],
        materials: ['Matte ceramic', 'Brushed metal', 'Natural wood', 'Soft fabric'],
      };

      setColorStory(mockColorStory);
    } catch (error) {
      console.error('Failed to generate color story:', error);
      alert('Failed to generate color story. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <ToolLayout
      title="Color Story Builder"
      description="Build palette-focused boards with proportions, pairings, and material applications"
      onBack={onBack}
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6 bg-gray-800/50 border-gray-700">
          <h3 className="text-xl font-semibold text-white mb-4">Color Story Input</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Mood / Theme
              </label>
              <input
                type="text"
                value={mood}
                onChange={(e) => setMood(e.target.value)}
                placeholder="e.g., Ocean sunset, Modern tech, Vintage warmth..."
                className="w-full px-4 py-2 bg-gray-900/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-accent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Inspiration (Optional)
              </label>
              <Textarea
                value={inspiration}
                onChange={(e) => setInspiration(e.target.value)}
                placeholder="Describe what inspires this color story..."
                className="min-h-[120px] bg-gray-900/50 border-gray-600 text-white"
              />
            </div>

            <Button onClick={handleGenerate} disabled={isGenerating} className="w-full">
              {isGenerating ? 'Generating...' : 'Generate Color Story'}
            </Button>
          </div>
        </Card>

        <Card className="p-6 bg-gray-800/50 border-gray-700">
          <h3 className="text-xl font-semibold text-white mb-4">Color Story</h3>
          {!colorStory ? (
            <div className="flex items-center justify-center h-[400px] text-gray-400">
              <p>Generate a color story to see results</p>
            </div>
          ) : (
            <div className="space-y-6">
              <div>
                <h4 className="text-sm font-semibold text-gray-300 mb-3">Primary Colors</h4>
                <div className="flex gap-2">
                  {colorStory.primary.map((color, i) => (
                    <div key={i} className="flex-1 h-16 rounded-lg" style={{ backgroundColor: color }} />
                  ))}
                </div>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-gray-300 mb-3">Color Proportions</h4>
                <div className="flex h-8 rounded-lg overflow-hidden">
                  {colorStory.proportions.map((item, i) => (
                    <div
                      key={i}
                      style={{ backgroundColor: item.color, width: `${item.percentage}%` }}
                      className="flex items-center justify-center text-white text-xs font-semibold"
                    >
                      {item.percentage}%
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-gray-300 mb-3">Material Applications</h4>
                <div className="grid grid-cols-2 gap-2">
                  {colorStory.materials.map((material, i) => (
                    <div key={i} className="p-3 bg-gray-900/50 rounded-lg text-white text-sm">
                      {material}
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
