import React, { useState } from 'react';
import { ToolLayout } from '../shared/ToolLayout';
import { Card } from '../../ui/card';
import { Button } from '../../ui/button';

interface FontFamily {
  name: string;
  weights: string[];
  sizes: { label: string; size: string }[];
}

interface TypographySpecimenProps {
  onBack?: () => void;
}

export const TypographySpecimen: React.FC<TypographySpecimenProps> = ({ onBack }) => {
  const [brandStyle, setBrandStyle] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [specimen, setSpecimen] = useState<FontFamily[]>([]);

  const handleGenerate = async () => {
    if (!brandStyle.trim()) {
      alert('Please enter a brand style');
      return;
    }

    setIsGenerating(true);

    try {
      await new Promise(resolve => setTimeout(resolve, 1500));

      const mockSpecimen: FontFamily[] = [
        {
          name: 'Inter',
          weights: ['Regular', 'Medium', 'Semibold', 'Bold'],
          sizes: [
            { label: 'H1', size: '48px' },
            { label: 'H2', size: '36px' },
            { label: 'Body', size: '16px' },
            { label: 'Caption', size: '12px' },
          ],
        },
      ];

      setSpecimen(mockSpecimen);
    } catch (error) {
      console.error('Failed to generate typography specimen:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <ToolLayout
      title="Typography Specimen"
      description="Showcase font families, hierarchy, letterspacing, and optical sizes"
      onBack={onBack}
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="p-6 bg-gray-800/50 border-gray-700">
          <h3 className="text-xl font-semibold text-white mb-4">Settings</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Brand Style
              </label>
              <input
                type="text"
                value={brandStyle}
                onChange={(e) => setBrandStyle(e.target.value)}
                placeholder="Modern, Classic, Playful..."
                className="w-full px-4 py-2 bg-gray-900/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-accent"
              />
            </div>
            <Button onClick={handleGenerate} disabled={isGenerating} className="w-full">
              {isGenerating ? 'Generating...' : 'Generate Specimen'}
            </Button>
          </div>
        </Card>

        <Card className="lg:col-span-2 p-6 bg-gray-800/50 border-gray-700">
          <h3 className="text-xl font-semibold text-white mb-4">Typography Preview</h3>
          {specimen.length === 0 ? (
            <div className="flex items-center justify-center h-[400px] text-gray-400">
              <p>Generate a specimen to see typography</p>
            </div>
          ) : (
            <div className="space-y-8">
              {specimen.map((family, idx) => (
                <div key={idx}>
                  <h4 className="text-lg font-semibold text-brand-accent mb-4">{family.name}</h4>
                  <div className="space-y-6">
                    {family.sizes.map((size, i) => (
                      <div key={i}>
                        <p className="text-xs text-gray-400 mb-2">{size.label} - {size.size}</p>
                        <p className="text-white" style={{ fontSize: size.size }}>
                          The quick brown fox jumps over the lazy dog
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </ToolLayout>
  );
};
