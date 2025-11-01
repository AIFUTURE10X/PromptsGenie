import React, { useState } from 'react';
import { ToolLayout } from '../shared/ToolLayout';
import { Card } from '../../ui/card';
import { Button } from '../../ui/button';

interface CompetitiveVisualAuditProps {
  onBack?: () => void;
}

export const CompetitiveVisualAudit: React.FC<CompetitiveVisualAuditProps> = ({ onBack }) => {
  const [industry, setIndustry] = useState('');
  const [competitors, setCompetitors] = useState<string[]>(['']);
  const [isGenerating, setIsGenerating] = useState(false);
  const [audit, setAudit] = useState<any>(null);

  const addCompetitor = () => setCompetitors([...competitors, '']);
  const updateCompetitor = (index: number, value: string) => {
    const newComps = [...competitors];
    newComps[index] = value;
    setCompetitors(newComps);
  };

  const handleGenerate = async () => {
    const validComps = competitors.filter(c => c.trim());
    if (!industry.trim() || validComps.length === 0) {
      alert('Please enter industry and at least one competitor');
      return;
    }
    setIsGenerating(true);
    await new Promise(resolve => setTimeout(resolve, 2000));
    setAudit({
      insights: ['Strong use of blue tones', 'Minimalist layouts dominate', 'Photography over illustrations'],
      gaps: ['Lack of warm colors', 'Limited personality', 'No bold typography'],
      opportunities: ['Use vibrant colors', 'Add playful elements', 'Bold brand personality'],
    });
    setIsGenerating(false);
  };

  return (
    <ToolLayout title="Competitive Visual Audit" description="Analyze competitor visuals to identify gaps and opportunities" onBack={onBack}>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6 bg-gray-800/50 border-gray-700">
          <h3 className="text-xl font-semibold text-white mb-4">Audit Setup</h3>
          <input type="text" value={industry} onChange={(e) => setIndustry(e.target.value)} placeholder="Industry..." className="w-full px-4 py-2 bg-gray-900/50 border border-gray-600 rounded-lg text-white mb-4" />
          <h4 className="text-sm font-semibold text-gray-300 mb-2">Competitors</h4>
          <div className="space-y-2 mb-4">
            {competitors.map((comp, i) => (
              <input key={i} type="text" value={comp} onChange={(e) => updateCompetitor(i, e.target.value)} placeholder={`Competitor ${i + 1}...`} className="w-full px-4 py-2 bg-gray-900/50 border border-gray-600 rounded-lg text-white" />
            ))}
          </div>
          <div className="flex gap-2">
            <Button onClick={addCompetitor} variant="outline">Add Competitor</Button>
            <Button onClick={handleGenerate} disabled={isGenerating} className="flex-1">{isGenerating ? 'Analyzing...' : 'Run Audit'}</Button>
          </div>
        </Card>
        <Card className="p-6 bg-gray-800/50 border-gray-700">
          <h3 className="text-xl font-semibold text-white mb-4">Audit Results</h3>
          {!audit ? <div className="flex items-center justify-center h-[400px] text-gray-400"><p>Run audit to see results</p></div> : (
            <div className="space-y-6">
              <div>
                <h4 className="text-blue-400 font-semibold mb-2">Key Insights</h4>
                <ul className="space-y-1">
                  {audit.insights.map((insight: string, i: number) => (
                    <li key={i} className="text-gray-300 text-sm">• {insight}</li>
                  ))}
                </ul>
              </div>
              <div>
                <h4 className="text-yellow-400 font-semibold mb-2">Market Gaps</h4>
                <ul className="space-y-1">
                  {audit.gaps.map((gap: string, i: number) => (
                    <li key={i} className="text-gray-300 text-sm">• {gap}</li>
                  ))}
                </ul>
              </div>
              <div>
                <h4 className="text-green-400 font-semibold mb-2">Opportunities</h4>
                <ul className="space-y-1">
                  {audit.opportunities.map((opp: string, i: number) => (
                    <li key={i} className="text-gray-300 text-sm">• {opp}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </Card>
      </div>
    </ToolLayout>
  );
};
