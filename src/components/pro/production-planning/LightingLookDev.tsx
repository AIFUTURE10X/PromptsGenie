import React, { useState } from 'react';
import { ToolLayout } from '../shared/ToolLayout';
import { Card } from '../../ui/card';
import { Button } from '../../ui/button';

interface LightingLookDevProps {
  onBack?: () => void;
}

export const LightingLookDev: React.FC<LightingLookDevProps> = ({ onBack }) => {
  const [style, setStyle] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [lookDev, setLookDev] = useState<any>(null);

  const handleGenerate = async () => {
    if (!style.trim()) {
      alert('Please enter a lighting style');
      return;
    }
    setIsGenerating(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    setLookDev({
      styles: ['Golden hour', 'High contrast', 'Soft diffused', 'Dramatic shadow'],
      angles: ['Eye level', 'Low angle', 'High angle', 'Dutch tilt'],
      luts: ['Cinematic warm', 'Cool teal-orange', 'Vintage film', 'Modern clean'],
    });
    setIsGenerating(false);
  };

  return (
    <ToolLayout title="Lighting/Look Dev Board" description="Cinematic lighting references with camera angles and color grade examples" onBack={onBack}>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6 bg-gray-800/50 border-gray-700">
          <h3 className="text-xl font-semibold text-white mb-4">Lighting Style</h3>
          <input type="text" value={style} onChange={(e) => setStyle(e.target.value)} placeholder="Cinematic, moody, bright..." className="w-full px-4 py-2 bg-gray-900/50 border border-gray-600 rounded-lg text-white mb-4" />
          <Button onClick={handleGenerate} disabled={isGenerating} className="w-full">{isGenerating ? 'Generating...' : 'Generate Look Dev'}</Button>
        </Card>
        <Card className="p-6 bg-gray-800/50 border-gray-700">
          {!lookDev ? <div className="flex items-center justify-center h-[300px] text-gray-400"><p>Generate to see look dev</p></div> : (
            <div className="space-y-4">
              <div>
                <h4 className="text-brand-accent font-semibold mb-2">Lighting Styles</h4>
                <div className="grid grid-cols-2 gap-2">
                  {lookDev.styles.map((s: string, i: number) => (
                    <div key={i} className="p-2 bg-gray-900/50 rounded text-white text-sm">{s}</div>
                  ))}
                </div>
              </div>
              <div>
                <h4 className="text-brand-accent font-semibold mb-2">Camera Angles</h4>
                <div className="grid grid-cols-2 gap-2">
                  {lookDev.angles.map((a: string, i: number) => (
                    <div key={i} className="p-2 bg-gray-900/50 rounded text-white text-sm">{a}</div>
                  ))}
                </div>
              </div>
              <div>
                <h4 className="text-brand-accent font-semibold mb-2">Color Grades / LUTs</h4>
                <div className="grid grid-cols-2 gap-2">
                  {lookDev.luts.map((l: string, i: number) => (
                    <div key={i} className="p-2 bg-gray-900/50 rounded text-white text-sm">{l}</div>
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
