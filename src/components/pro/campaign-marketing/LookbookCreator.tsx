import React, { useState } from 'react';
import { ToolLayout } from '../shared/ToolLayout';
import { Card } from '../../ui/card';
import { Button } from '../../ui/button';
import { Textarea } from '../../ui/textarea';

interface LookbookCreatorProps {
  onBack?: () => void;
}

export const LookbookCreator: React.FC<LookbookCreatorProps> = ({ onBack }) => {
  const [campaignName, setCampaignName] = useState('');
  const [concept, setConcept] = useState('');
  const [pageCount, setPageCount] = useState(6);
  const [isGenerating, setIsGenerating] = useState(false);
  const [pages, setPages] = useState<any[]>([]);

  const handleGenerate = async () => {
    if (!campaignName.trim()) {
      alert('Please enter a campaign name');
      return;
    }
    setIsGenerating(true);
    await new Promise(resolve => setTimeout(resolve, 2000));
    setPages(Array(pageCount).fill(0).map((_, i) => ({ id: i, title: `Page ${i + 1}`, image: `https://placehold.co/800x600?text=Page+${i + 1}` })));
    setIsGenerating(false);
  };

  return (
    <ToolLayout title="Lookbook Creator" description="Create sequenced campaign pages showing concepts in context" onBack={onBack}>
      <div className="space-y-6">
        <Card className="p-6 bg-gray-800/50 border-gray-700">
          <h3 className="text-xl font-semibold text-white mb-4">Lookbook Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input type="text" value={campaignName} onChange={(e) => setCampaignName(e.target.value)} placeholder="Campaign name..." className="px-4 py-2 bg-gray-900/50 border border-gray-600 rounded-lg text-white" />
            <input type="number" value={pageCount} onChange={(e) => setPageCount(Number(e.target.value))} min="3" max="12" placeholder="Page count..." className="px-4 py-2 bg-gray-900/50 border border-gray-600 rounded-lg text-white" />
          </div>
          <Textarea value={concept} onChange={(e) => setConcept(e.target.value)} placeholder="Campaign concept..." className="mt-4 min-h-[100px] bg-gray-900/50 border-gray-600 text-white" />
          <Button onClick={handleGenerate} disabled={isGenerating} className="w-full mt-4">{isGenerating ? 'Generating...' : 'Generate Lookbook'}</Button>
        </Card>
        {pages.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {pages.map((page) => (
              <Card key={page.id} className="p-4 bg-gray-800/50 border-gray-700">
                <div className="aspect-[4/3] bg-gray-700 rounded-lg mb-3">
                  <img src={page.image} alt={page.title} className="w-full h-full object-cover rounded-lg" />
                </div>
                <h4 className="text-white font-semibold">{page.title}</h4>
              </Card>
            ))}
          </div>
        )}
      </div>
    </ToolLayout>
  );
};
