import React, { useState } from 'react';
import { ToolLayout } from '../shared/ToolLayout';
import { Card } from '../../ui/card';
import { Button } from '../../ui/button';

interface WireframeMoodBoardProps {
  onBack?: () => void;
}

export const WireframeMoodBoard: React.FC<WireframeMoodBoardProps> = ({ onBack }) => {
  const [projectType, setProjectType] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [wireframes, setWireframes] = useState<any>(null);

  const handleGenerate = async () => {
    if (!projectType.trim()) {
      alert('Please enter project type');
      return;
    }
    setIsGenerating(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    setWireframes({ layouts: Array(6).fill(0), spacing: '8px grid', typeScale: ['48px', '36px', '24px', '16px', '12px'] });
    setIsGenerating(false);
  };

  return (
    <ToolLayout title="Wireframe Mood Board" description="Explore UX/structure aesthetics with grayscale layout blocks and spacing" onBack={onBack}>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="p-6 bg-gray-800/50 border-gray-700">
          <h3 className="text-xl font-semibold text-white mb-4">Project Settings</h3>
          <input type="text" value={projectType} onChange={(e) => setProjectType(e.target.value)} placeholder="Project type (web, mobile, etc.)" className="w-full px-4 py-2 bg-gray-900/50 border border-gray-600 rounded-lg text-white mb-4" />
          <Button onClick={handleGenerate} disabled={isGenerating} className="w-full">{isGenerating ? 'Generating...' : 'Generate Wireframes'}</Button>
        </Card>
        <Card className="lg:col-span-2 p-6 bg-gray-800/50 border-gray-700">
          {!wireframes ? <div className="flex items-center justify-center h-[400px] text-gray-400"><p>Generate wireframes to see layout</p></div> : (
            <div className="grid grid-cols-2 gap-4">
              {wireframes.layouts.map((_: any, i: number) => (
                <div key={i} className="aspect-video bg-gradient-to-br from-gray-700 to-gray-800 rounded-lg p-4">
                  <div className="h-8 bg-gray-600 rounded mb-2" />
                  <div className="space-y-2">
                    <div className="h-4 bg-gray-600 rounded w-3/4" />
                    <div className="h-4 bg-gray-600 rounded w-1/2" />
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
