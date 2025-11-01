import React, { useState } from 'react';
import { ToolLayout } from '../shared/ToolLayout';
import { Card } from '../../ui/card';
import { Button } from '../../ui/button';
import { Textarea } from '../../ui/textarea';

interface NarrativeToneBoardProps {
  onBack?: () => void;
}

export const NarrativeToneBoard: React.FC<NarrativeToneBoardProps> = ({ onBack }) => {
  const [brandVoice, setBrandVoice] = useState('');
  const [messaging, setMessaging] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [toneBoard, setToneBoard] = useState<any>(null);

  const handleGenerate = async () => {
    if (!brandVoice.trim()) {
      alert('Please describe brand voice');
      return;
    }
    setIsGenerating(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    setToneBoard({
      quotes: ['Empowering creators', 'Innovation meets simplicity', 'Design for everyone'],
      adjectives: ['Bold', 'Innovative', 'Accessible', 'Professional', 'Modern'],
      microcopy: ['Get started', 'Learn more', 'Join the community', 'Explore features'],
    });
    setIsGenerating(false);
  };

  return (
    <ToolLayout title="Narrative Tone Board" description="Align messaging with visuals using quotes, adjectives, and microcopy" onBack={onBack}>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6 bg-gray-800/50 border-gray-700">
          <h3 className="text-xl font-semibold text-white mb-4">Brand Voice</h3>
          <input type="text" value={brandVoice} onChange={(e) => setBrandVoice(e.target.value)} placeholder="Brand voice..." className="w-full px-4 py-2 bg-gray-900/50 border border-gray-600 rounded-lg text-white mb-4" />
          <Textarea value={messaging} onChange={(e) => setMessaging(e.target.value)} placeholder="Key messaging..." className="min-h-[120px] bg-gray-900/50 border-gray-600 text-white mb-4" />
          <Button onClick={handleGenerate} disabled={isGenerating} className="w-full">{isGenerating ? 'Generating...' : 'Generate Tone Board'}</Button>
        </Card>
        <Card className="p-6 bg-gray-800/50 border-gray-700">
          {!toneBoard ? <div className="flex items-center justify-center h-[400px] text-gray-400"><p>Generate to see tone board</p></div> : (
            <div className="space-y-6">
              <div>
                <h4 className="text-brand-accent font-semibold mb-3">Key Quotes</h4>
                <div className="space-y-2">
                  {toneBoard.quotes.map((quote: string, i: number) => (
                    <div key={i} className="p-3 bg-gray-900/50 rounded-lg text-white italic">"{quote}"</div>
                  ))}
                </div>
              </div>
              <div>
                <h4 className="text-brand-accent font-semibold mb-3">Brand Adjectives</h4>
                <div className="flex flex-wrap gap-2">
                  {toneBoard.adjectives.map((adj: string, i: number) => (
                    <span key={i} className="px-3 py-1 bg-brand-accent/20 text-brand-accent rounded-full text-sm">{adj}</span>
                  ))}
                </div>
              </div>
              <div>
                <h4 className="text-brand-accent font-semibold mb-3">Microcopy Examples</h4>
                <div className="grid grid-cols-2 gap-2">
                  {toneBoard.microcopy.map((copy: string, i: number) => (
                    <div key={i} className="p-2 bg-gray-900/50 rounded text-white text-sm text-center">{copy}</div>
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
