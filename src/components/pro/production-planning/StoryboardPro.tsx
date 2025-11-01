import React, { useState } from 'react';
import { ToolLayout } from '../shared/ToolLayout';
import { Card } from '../../ui/card';
import { Button } from '../../ui/button';
import { Textarea } from '../../ui/textarea';

interface Frame {
  id: number;
  scene: string;
  action: string;
  voiceover: string;
}

interface StoryboardProProps {
  onBack?: () => void;
}

export const StoryboardPro: React.FC<StoryboardProProps> = ({ onBack }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [frameCount, setFrameCount] = useState(6);
  const [isGenerating, setIsGenerating] = useState(false);
  const [frames, setFrames] = useState<Frame[]>([]);

  const handleGenerate = async () => {
    if (!title.trim()) {
      alert('Please enter a title');
      return;
    }
    setIsGenerating(true);
    await new Promise(resolve => setTimeout(resolve, 2000));
    const generatedFrames = Array.from({ length: frameCount }, (_, i) => ({
      id: i + 1,
      scene: `Scene ${i + 1}`,
      action: `Action description for frame ${i + 1}`,
      voiceover: `Voiceover text for frame ${i + 1}`,
    }));
    setFrames(generatedFrames);
    setIsGenerating(false);
  };

  return (
    <ToolLayout title="Storyboard Pro" description="Enhanced storyboards with improved UI/UX and advanced features" onBack={onBack}>
      <div className="space-y-6">
        <Card className="p-6 bg-gray-800/50 border-gray-700">
          <h3 className="text-xl font-semibold text-white mb-4">Storyboard Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Storyboard title..." className="px-4 py-2 bg-gray-900/50 border border-gray-600 rounded-lg text-white" />
            <input type="number" value={frameCount} onChange={(e) => setFrameCount(Number(e.target.value))} min="3" max="12" placeholder="Frame count..." className="px-4 py-2 bg-gray-900/50 border border-gray-600 rounded-lg text-white" />
          </div>
          <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Storyboard description..." className="min-h-[100px] bg-gray-900/50 border-gray-600 text-white mb-4" />
          <Button onClick={handleGenerate} disabled={isGenerating} className="w-full">{isGenerating ? 'Generating...' : 'Generate Storyboard'}</Button>
        </Card>
        {frames.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {frames.map((frame) => (
              <Card key={frame.id} className="p-4 bg-gray-800/50 border-gray-700">
                <div className="aspect-video bg-gradient-to-br from-gray-700 to-gray-800 rounded-lg mb-3 flex items-center justify-center">
                  <span className="text-4xl font-bold text-gray-600">{frame.id}</span>
                </div>
                <h4 className="text-white font-semibold mb-2">{frame.scene}</h4>
                <div className="space-y-2 text-sm">
                  <div>
                    <p className="text-gray-400">Action:</p>
                    <p className="text-white">{frame.action}</p>
                  </div>
                  <div>
                    <p className="text-gray-400">Voiceover:</p>
                    <p className="text-white italic">{frame.voiceover}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </ToolLayout>
  );
};
