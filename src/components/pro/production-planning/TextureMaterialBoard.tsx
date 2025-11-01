import React, { useState } from 'react';
import { ToolLayout } from '../shared/ToolLayout';
import { Card } from '../../ui/card';
import { Button } from '../../ui/button';

interface TextureMaterialBoardProps {
  onBack?: () => void;
}

export const TextureMaterialBoard: React.FC<TextureMaterialBoardProps> = ({ onBack }) => {
  const [theme, setTheme] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [materials, setMaterials] = useState<any[]>([]);

  const handleGenerate = async () => {
    if (!theme.trim()) {
      alert('Please enter a theme');
      return;
    }
    setIsGenerating(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    const mockMaterials = [
      { name: 'Brushed Metal', finish: 'Satin', texture: 'Fine grain' },
      { name: 'Natural Wood', finish: 'Matte', texture: 'Wood grain' },
      { name: 'Soft Fabric', finish: 'Matte', texture: 'Woven' },
      { name: 'Ceramic', finish: 'Glossy', texture: 'Smooth' },
    ];
    setMaterials(mockMaterials);
    setIsGenerating(false);
  };

  return (
    <ToolLayout title="Texture/Material Board" description="Physical and digital texture swatches, patterns, and finish demonstrations" onBack={onBack}>
      <div className="space-y-6">
        <Card className="p-6 bg-gray-800/50 border-gray-700">
          <div className="flex gap-4">
            <input type="text" value={theme} onChange={(e) => setTheme(e.target.value)} placeholder="Material theme..." className="flex-1 px-4 py-2 bg-gray-900/50 border border-gray-600 rounded-lg text-white" />
            <Button onClick={handleGenerate} disabled={isGenerating}>{isGenerating ? 'Generating...' : 'Generate Board'}</Button>
          </div>
        </Card>
        {materials.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {materials.map((material, i) => (
              <Card key={i} className="p-6 bg-gray-800/50 border-gray-700">
                <div className="w-full h-32 bg-gradient-to-br from-gray-600 to-gray-800 rounded-lg mb-4" />
                <h4 className="text-white font-semibold mb-2">{material.name}</h4>
                <div className="space-y-1 text-sm">
                  <p className="text-gray-400">Finish: <span className="text-white">{material.finish}</span></p>
                  <p className="text-gray-400">Texture: <span className="text-white">{material.texture}</span></p>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </ToolLayout>
  );
};
