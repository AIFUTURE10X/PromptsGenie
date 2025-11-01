import React, { useState } from 'react';
import { ToolLayout } from '../shared/ToolLayout';
import { Card } from '../../ui/card';
import { Button } from '../../ui/button';

interface InspirationCollageProps {
  onBack?: () => void;
}

export const InspirationCollage: React.FC<InspirationCollageProps> = ({ onBack }) => {
  const [vibe, setVibe] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [images, setImages] = useState<string[]>([]);

  const handleGenerate = async () => {
    if (!vibe.trim()) {
      alert('Please enter a vibe');
      return;
    }
    setIsGenerating(true);
    await new Promise(resolve => setTimeout(resolve, 2000));
    setImages(Array(8).fill(0).map((_, i) => `https://placehold.co/400x300?text=Image+${i + 1}`));
    setIsGenerating(false);
  };

  return (
    <ToolLayout title="Inspiration Collage" description="Quick vibe exploration with eclectic images, textures, and color chips" onBack={onBack}>
      <div className="space-y-6">
        <Card className="p-6 bg-gray-800/50 border-gray-700">
          <div className="flex gap-4">
            <input type="text" value={vibe} onChange={(e) => setVibe(e.target.value)} placeholder="Enter vibe (e.g., vintage, futuristic, cozy...)" className="flex-1 px-4 py-2 bg-gray-900/50 border border-gray-600 rounded-lg text-white" />
            <Button onClick={handleGenerate} disabled={isGenerating}>{isGenerating ? 'Generating...' : 'Generate Collage'}</Button>
          </div>
        </Card>
        {images.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {images.map((img, i) => (
              <div key={i} className="aspect-square rounded-lg overflow-hidden bg-gray-700">
                <img src={img} alt={`Inspiration ${i + 1}`} className="w-full h-full object-cover" />
              </div>
            ))}
          </div>
        )}
      </div>
    </ToolLayout>
  );
};
