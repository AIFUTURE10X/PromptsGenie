import React, { useState } from 'react';
import { ToolLayout } from '../shared/ToolLayout';
import { Card } from '../../ui/card';
import { Button } from '../../ui/button';

interface ConceptBoardsProps {
  onBack?: () => void;
}

export const ConceptBoards: React.FC<ConceptBoardsProps> = ({ onBack }) => {
  const [concepts, setConcepts] = useState<string[]>(['']);
  const [isGenerating, setIsGenerating] = useState(false);
  const [boards, setBoards] = useState<any[]>([]);

  const addConcept = () => setConcepts([...concepts, '']);
  const updateConcept = (index: number, value: string) => {
    const newConcepts = [...concepts];
    newConcepts[index] = value;
    setConcepts(newConcepts);
  };

  const handleGenerate = async () => {
    const validConcepts = concepts.filter(c => c.trim());
    if (validConcepts.length === 0) {
      alert('Please enter at least one concept');
      return;
    }
    setIsGenerating(true);
    await new Promise(resolve => setTimeout(resolve, 2000));
    setBoards(validConcepts.map(concept => ({ name: concept, images: Array(6).fill(0) })));
    setIsGenerating(false);
  };

  return (
    <ToolLayout title="Concept Boards" description="Compare multiple creative routes side-by-side with separate boards per concept" onBack={onBack}>
      <div className="space-y-6">
        <Card className="p-6 bg-gray-800/50 border-gray-700">
          <h3 className="text-xl font-semibold text-white mb-4">Concepts</h3>
          <div className="space-y-2 mb-4">
            {concepts.map((concept, i) => (
              <input key={i} type="text" value={concept} onChange={(e) => updateConcept(i, e.target.value)} placeholder={`Concept ${i + 1}...`} className="w-full px-4 py-2 bg-gray-900/50 border border-gray-600 rounded-lg text-white" />
            ))}
          </div>
          <div className="flex gap-2">
            <Button onClick={addConcept} variant="outline">Add Concept</Button>
            <Button onClick={handleGenerate} disabled={isGenerating} className="flex-1">{isGenerating ? 'Generating...' : 'Generate Boards'}</Button>
          </div>
        </Card>
        {boards.length > 0 && (
          <div className="grid gap-6">
            {boards.map((board, i) => (
              <Card key={i} className="p-6 bg-gray-800/50 border-gray-700">
                <h4 className="text-lg font-semibold text-brand-accent mb-4">{board.name}</h4>
                <div className="grid grid-cols-3 gap-4">
                  {board.images.map((_: any, j: number) => (
                    <div key={j} className="aspect-video bg-gray-700 rounded-lg" />
                  ))}
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </ToolLayout>
  );
};
