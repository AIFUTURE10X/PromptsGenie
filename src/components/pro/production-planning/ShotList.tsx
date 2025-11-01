import React, { useState } from 'react';
import { ToolLayout } from '../shared/ToolLayout';
import { Card } from '../../ui/card';
import { Button } from '../../ui/button';

interface Shot {
  id: number;
  name: string;
  framing: string;
  lighting: string;
  notes: string;
}

interface ShotListProps {
  onBack?: () => void;
}

export const ShotList: React.FC<ShotListProps> = ({ onBack }) => {
  const [projectName, setProjectName] = useState('');
  const [shotCount, setShotCount] = useState(5);
  const [isGenerating, setIsGenerating] = useState(false);
  const [shots, setShots] = useState<Shot[]>([]);

  const handleGenerate = async () => {
    if (!projectName.trim()) {
      alert('Please enter a project name');
      return;
    }
    setIsGenerating(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    const generatedShots = Array.from({ length: shotCount }, (_, i) => ({
      id: i + 1,
      name: `Shot ${i + 1}`,
      framing: ['Wide', 'Medium', 'Close-up'][i % 3],
      lighting: ['Natural', 'Soft box', 'Dramatic'][i % 3],
      notes: `Shot notes for scene ${i + 1}`,
    }));
    setShots(generatedShots);
    setIsGenerating(false);
  };

  return (
    <ToolLayout title="Shot List with Visual Refs" description="Production-ready shot lists with framing, lighting notes, and reference images" onBack={onBack}>
      <div className="space-y-6">
        <Card className="p-6 bg-gray-800/50 border-gray-700">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input type="text" value={projectName} onChange={(e) => setProjectName(e.target.value)} placeholder="Project name..." className="px-4 py-2 bg-gray-900/50 border border-gray-600 rounded-lg text-white" />
            <input type="number" value={shotCount} onChange={(e) => setShotCount(Number(e.target.value))} min="1" max="20" placeholder="Number of shots..." className="px-4 py-2 bg-gray-900/50 border border-gray-600 rounded-lg text-white" />
          </div>
          <Button onClick={handleGenerate} disabled={isGenerating} className="w-full mt-4">{isGenerating ? 'Generating...' : 'Generate Shot List'}</Button>
        </Card>
        {shots.length > 0 && (
          <div className="space-y-3">
            {shots.map((shot) => (
              <Card key={shot.id} className="p-4 bg-gray-800/50 border-gray-700">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-xs text-gray-400 mb-1">Shot Name</p>
                    <p className="text-white font-semibold">{shot.name}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 mb-1">Framing</p>
                    <p className="text-white">{shot.framing}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 mb-1">Lighting</p>
                    <p className="text-white">{shot.lighting}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 mb-1">Notes</p>
                    <p className="text-white text-sm">{shot.notes}</p>
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
