import React, { useState, lazy, Suspense } from 'react';
import { motion } from 'framer-motion';
import { Card } from '../ui/card';

// Lazy load tool components
const MoodBoardCreator = lazy(() => import('./concept-exploration/MoodBoardCreator').then(m => ({ default: m.MoodBoardCreator })));

// Tool category types
type ToolCategory = 'brand' | 'concept' | 'campaign' | 'production' | 'all';

// Tool definition interface
interface ProTool {
  id: string;
  name: string;
  description: string;
  category: ToolCategory;
  icon: string;
  color: string;
  comingSoon?: boolean;
}

// Available Pro tools
const proTools: ProTool[] = [
  // Brand & Identity Tools
  {
    id: 'style-tile',
    name: 'Style Tile Generator',
    description: 'Create brand element snapshots with color palettes, typography, buttons, and textures',
    category: 'brand',
    icon: '🎨',
    color: 'from-blue-500 to-cyan-500',
  },
  {
    id: 'color-story',
    name: 'Color Story Builder',
    description: 'Build palette-focused boards with proportions, pairings, and material applications',
    category: 'brand',
    icon: '🌈',
    color: 'from-pink-500 to-rose-500',
  },
  {
    id: 'typography-specimen',
    name: 'Typography Specimen',
    description: 'Showcase font families, hierarchy, letterspacing, and optical sizes',
    category: 'brand',
    icon: '✏️',
    color: 'from-purple-500 to-indigo-500',
  },
  {
    id: 'visual-style-guide',
    name: 'Visual Style Guide',
    description: 'Create codified brand rules for color, type, spacing, and imagery',
    category: 'brand',
    icon: '📐',
    color: 'from-violet-500 to-purple-500',
  },

  // Concept Exploration Tools
  {
    id: 'inspiration-collage',
    name: 'Inspiration Collage',
    description: 'Quick vibe exploration with eclectic images, textures, and color chips',
    category: 'concept',
    icon: '✨',
    color: 'from-amber-500 to-orange-500',
  },
  {
    id: 'mood-board',
    name: 'Mood Board Creator',
    description: 'Structured inspiration grids with 12-20 curated images and color palettes',
    category: 'concept',
    icon: '🖼️',
    color: 'from-teal-500 to-emerald-500',
  },
  {
    id: 'concept-boards',
    name: 'Concept Boards',
    description: 'Compare multiple creative routes side-by-side with separate boards per concept',
    category: 'concept',
    icon: '🎯',
    color: 'from-green-500 to-teal-500',
  },
  {
    id: 'wireframe-mood',
    name: 'Wireframe Mood Board',
    description: 'Explore UX/structure aesthetics with grayscale layout blocks and spacing',
    category: 'concept',
    icon: '📱',
    color: 'from-slate-500 to-gray-500',
  },

  // Campaign & Marketing Tools
  {
    id: 'lookbook',
    name: 'Lookbook Creator',
    description: 'Create sequenced campaign pages showing concepts in context',
    category: 'campaign',
    icon: '📖',
    color: 'from-red-500 to-pink-500',
  },
  {
    id: 'reference-deck',
    name: 'Reference Deck Builder',
    description: 'Build slide decks with annotated references and clear rationale',
    category: 'campaign',
    icon: '📊',
    color: 'from-orange-500 to-amber-500',
  },
  {
    id: 'narrative-tone',
    name: 'Narrative Tone Board',
    description: 'Align messaging with visuals using quotes, adjectives, and microcopy',
    category: 'campaign',
    icon: '💬',
    color: 'from-cyan-500 to-blue-500',
  },
  {
    id: 'competitive-audit',
    name: 'Competitive Visual Audit',
    description: 'Analyze competitor visuals to identify gaps and opportunities',
    category: 'campaign',
    icon: '🔍',
    color: 'from-indigo-500 to-violet-500',
  },

  // Production Planning Tools
  {
    id: 'shot-list',
    name: 'Shot List with Visual Refs',
    description: 'Production-ready shot lists with framing, lighting notes, and reference images',
    category: 'production',
    icon: '🎬',
    color: 'from-emerald-500 to-green-500',
  },
  {
    id: 'lighting-lookdev',
    name: 'Lighting/Look Dev Board',
    description: 'Cinematic lighting references with camera angles and color grade examples',
    category: 'production',
    icon: '💡',
    color: 'from-yellow-500 to-amber-500',
  },
  {
    id: 'texture-material',
    name: 'Texture/Material Board',
    description: 'Physical and digital texture swatches, patterns, and finish demonstrations',
    category: 'production',
    icon: '🧱',
    color: 'from-stone-500 to-amber-500',
  },
  {
    id: 'storyboard-pro',
    name: 'Storyboard Pro',
    description: 'Enhanced storyboards with improved UI/UX and advanced features',
    category: 'production',
    icon: '🎞️',
    color: 'from-purple-500 to-pink-500',
  },
];

const ProDashboard: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<ToolCategory>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentTool, setCurrentTool] = useState<string | null>(null);

  // Filter tools based on category and search
  const filteredTools = proTools.filter((tool) => {
    const matchesCategory = selectedCategory === 'all' || tool.category === selectedCategory;
    const matchesSearch = tool.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          tool.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Category filter buttons
  const categories: { id: ToolCategory; label: string; icon: string }[] = [
    { id: 'all', label: 'All Tools', icon: '🌟' },
    { id: 'brand', label: 'Brand & Identity', icon: '🎨' },
    { id: 'concept', label: 'Concept Exploration', icon: '✨' },
    { id: 'campaign', label: 'Campaign & Marketing', icon: '📊' },
    { id: 'production', label: 'Production Planning', icon: '🎬' },
  ];

  const handleToolClick = (toolId: string) => {
    // Check if tool is implemented
    const implementedTools = ['mood-board']; // Add more as they're built
    if (implementedTools.includes(toolId)) {
      setCurrentTool(toolId);
    } else {
      alert(`Tool "${toolId}" coming soon! This will open the ${proTools.find(t => t.id === toolId)?.name} interface.`);
    }
  };

  const handleBackToDashboard = () => {
    setCurrentTool(null);
  };

  // Render specific tool if selected
  if (currentTool === 'mood-board') {
    return (
      <Suspense fallback={
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-brand-accent"></div>
            <p className="mt-4 text-gray-400">Loading tool...</p>
          </div>
        </div>
      }>
        <MoodBoardCreator onBack={handleBackToDashboard} />
      </Suspense>
    );
  }

  // Otherwise render dashboard
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="text-center mb-12">
        <motion.h1
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-4xl sm:text-5xl font-bold mb-4 bg-gradient-to-r from-brand-accent via-yellow-500 to-orange-500 bg-clip-text text-transparent"
        >
          PromptsGenie Pro
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-lg text-gray-300 max-w-3xl mx-auto"
        >
          Professional visual planning and ideation tools for designers, marketers, and creators
        </motion.p>
      </div>

      {/* Search Bar */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="mb-8"
      >
        <div className="relative max-w-md mx-auto">
          <input
            type="text"
            placeholder="Search tools..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-3 pl-12 bg-gray-800/50 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-accent focus:border-transparent"
          />
          <svg
            className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </motion.div>

      {/* Category Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="flex flex-wrap justify-center gap-2 mb-12"
      >
        {categories.map((category) => (
          <button
            key={category.id}
            onClick={() => setSelectedCategory(category.id)}
            className={`px-4 py-2 rounded-lg font-medium text-sm transition-all flex items-center gap-2 ${
              selectedCategory === category.id
                ? 'bg-brand-accent text-white shadow-lg'
                : 'bg-gray-800/50 text-gray-300 hover:bg-gray-700/50 hover:text-white'
            }`}
          >
            <span>{category.icon}</span>
            <span className="hidden sm:inline">{category.label}</span>
            <span className="sm:hidden">{category.label.split(' ')[0]}</span>
          </button>
        ))}
      </motion.div>

      {/* Tools Grid */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
      >
        {filteredTools.map((tool, index) => (
          <motion.div
            key={tool.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 * index }}
          >
            <Card
              className="relative h-full bg-gray-800/30 border-gray-700 hover:border-brand-accent hover:shadow-xl hover:shadow-brand-accent/20 transition-all duration-300 cursor-pointer group overflow-hidden"
              onClick={() => handleToolClick(tool.id)}
            >
              {/* Gradient Background */}
              <div className={`absolute inset-0 bg-gradient-to-br ${tool.color} opacity-0 group-hover:opacity-10 transition-opacity duration-300`} />

              {/* Content */}
              <div className="relative p-6">
                {/* Icon */}
                <div className="text-5xl mb-4 transform group-hover:scale-110 transition-transform duration-300">
                  {tool.icon}
                </div>

                {/* Title */}
                <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-brand-accent transition-colors">
                  {tool.name}
                </h3>

                {/* Description */}
                <p className="text-sm text-gray-400 leading-relaxed">
                  {tool.description}
                </p>

                {/* Coming Soon Badge */}
                {tool.comingSoon && (
                  <div className="absolute top-4 right-4 bg-yellow-500/20 text-yellow-500 text-xs font-semibold px-2 py-1 rounded-full">
                    Coming Soon
                  </div>
                )}

                {/* Launch Button (appears on hover) */}
                <div className="mt-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <button className="w-full px-4 py-2 bg-brand-accent/20 hover:bg-brand-accent/30 text-brand-accent rounded-lg font-medium text-sm transition-colors">
                    Launch Tool →
                  </button>
                </div>
              </div>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      {/* No Results Message */}
      {filteredTools.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-12"
        >
          <p className="text-gray-400 text-lg">No tools found matching your search.</p>
        </motion.div>
      )}

      {/* Footer Stats */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="mt-16 pt-8 border-t border-gray-700"
      >
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          <div>
            <div className="text-3xl font-bold text-brand-accent mb-1">{proTools.length}</div>
            <div className="text-sm text-gray-400">Creative Tools</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-brand-accent mb-1">50+</div>
            <div className="text-sm text-gray-400">Templates</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-brand-accent mb-1">10+</div>
            <div className="text-sm text-gray-400">Export Formats</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-brand-accent mb-1">∞</div>
            <div className="text-sm text-gray-400">Possibilities</div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default ProDashboard;
