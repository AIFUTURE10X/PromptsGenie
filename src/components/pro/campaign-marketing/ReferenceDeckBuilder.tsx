import React, { useState } from 'react';
import { ToolLayout } from '../shared/ToolLayout';
import { Card } from '../../ui/card';
import { Button } from '../../ui/button';

interface ReferenceDeckBuilderProps {
  onBack?: () => void;
}

export const ReferenceDeckBuilder: React.FC<ReferenceDeckBuilderProps> = ({ onBack }) => {
  const [projectName, setProjectName] = useState('');
  const [references, setReferences] = useState<any[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = async () => {
    if (!projectName.trim()) {
      alert('Please enter a project name');
      return;
    }
    setIsGenerating(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    setReferences(Array(6).fill(0).map((_, i) => ({ id: i, image: `https://placehold.co/600x400?text=Ref+${i + 1}`, note: `Reference note ${i + 1}` })));
    setIsGenerating(false);
  };

  return (
    <ToolLayout title="Reference Deck Builder" description="Build slide decks with annotated references and clear rationale" onBack={onBack}>
      <div className="space-y-6">
        <Card className="p-6 bg-gray-800/50 border-gray-700">
          <div className="flex gap-4">
            <input type="text" value={projectName} onChange={(e) => setProjectName(e.target.value)} placeholder="Project name..." className="flex-1 px-4 py-2 bg-gray-900/50 border border-gray-600 rounded-lg text-white" />
            <Button onClick={handleGenerate} disabled={isGenerating}>{isGenerating ? 'Generating...' : 'Generate Deck'}</Button>
          </div>
        </Card>
        {references.length > 0 && (
          <div className="space-y-4">
            {references.map((ref) => (
              <Card key={ref.id} className="p-4 bg-gray-800/50 border-gray-700 flex gap-4">
                <div className="w-48 h-32 bg-gray-700 rounded-lg flex-shrink-0">
                  <img src={ref.image} alt={`Reference ${ref.id + 1}`} className="w-full h-full object-cover rounded-lg" />
                </div>
                <div className="flex-1">
                  <h4 className="text-white font-semibold mb-2">Reference {ref.id + 1}</h4>
                  <p className="text-gray-400 text-sm">{ref.note}</p>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </ToolLayout>
  );
};
