import React, { useState } from 'react';
import { ToolLayout } from '../shared/ToolLayout';
import { Card } from '../../ui/card';
import { Button } from '../../ui/button';
import { Textarea } from '../../ui/textarea';

interface StyleGuideProps {
  onBack?: () => void;
}

export const VisualStyleGuide: React.FC<StyleGuideProps> = ({ onBack }) => {
  const [brandName, setBrandName] = useState('');
  const [guidelines, setGuidelines] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [styleGuide, setStyleGuide] = useState<any>(null);

  const handleGenerate = async () => {
    if (!brandName.trim()) {
      alert('Please enter a brand name');
      return;
    }
    setIsGenerating(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    setStyleGuide({
      colors: { dos: ['Use primary colors', 'Maintain contrast'], donts: ['Avoid neon', 'No color clashing'] },
      typography: { dos: ['Keep hierarchy clear'], donts: ['Avoid mixing too many fonts'] },
      spacing: { dos: ['Use 8px grid'], donts: ['Avoid inconsistent margins'] },
    });
    setIsGenerating(false);
  };

  return (
    <ToolLayout title="Visual Style Guide" description="Create codified brand rules for color, type, spacing, and imagery" onBack={onBack}>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6 bg-gray-800/50 border-gray-700">
          <h3 className="text-xl font-semibold text-white mb-4">Brand Information</h3>
          <div className="space-y-4">
            <input type="text" value={brandName} onChange={(e) => setBrandName(e.target.value)} placeholder="Brand name..." className="w-full px-4 py-2 bg-gray-900/50 border border-gray-600 rounded-lg text-white" />
            <Textarea value={guidelines} onChange={(e) => setGuidelines(e.target.value)} placeholder="Brand guidelines..." className="min-h-[150px] bg-gray-900/50 border-gray-600 text-white" />
            <Button onClick={handleGenerate} disabled={isGenerating} className="w-full">{isGenerating ? 'Generating...' : 'Generate Style Guide'}</Button>
          </div>
        </Card>
        <Card className="p-6 bg-gray-800/50 border-gray-700">
          <h3 className="text-xl font-semibold text-white mb-4">Style Guide</h3>
          {!styleGuide ? <div className="flex items-center justify-center h-[400px] text-gray-400"><p>Generate to see style guide</p></div> : (
            <div className="space-y-4">
              <div className="p-4 bg-gray-900/50 rounded-lg">
                <h4 className="text-brand-accent font-semibold mb-2">Colors</h4>
                <p className="text-sm text-green-400">Do: {styleGuide.colors.dos.join(', ')}</p>
                <p className="text-sm text-red-400">Don't: {styleGuide.colors.donts.join(', ')}</p>
              </div>
            </div>
          )}
        </Card>
      </div>
    </ToolLayout>
  );
};
