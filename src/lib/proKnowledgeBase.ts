// PromptsGenie Pro - Complete Knowledge Base
// All 16 tools with detailed documentation for AI assistant

export interface ToolWindow {
  name: string;
  function: string;
  controls: {
    name: string;
    type: string;
    purpose: string;
    examples: string[];
  }[];
  impact: string;
}

export interface ToolKnowledge {
  id: string;
  name: string;
  category: 'brand' | 'concept' | 'campaign' | 'production';
  purpose: string;
  description: string;
  inputs: {
    name: string;
    type: string;
    required: boolean;
    description: string;
    examples?: string[];
  }[];
  windows?: ToolWindow[]; // Detailed window-level information
  outputs: string[];
  bestPractices: string[];
  tips: string[];
  relatedTools: string[];
  useCases: string[];
  workflow?: string;
}

export interface ToolWorkflow {
  name: string;
  description: string;
  steps: string[];
  useCase: string;
}

export const toolsKnowledge: Record<string, ToolKnowledge> = {
  // BRAND & IDENTITY TOOLS
  'style-tile': {
    id: 'style-tile',
    name: 'Style Tile Generator',
    category: 'brand',
    purpose: 'Create brand element snapshots with color palettes, typography, buttons, and textures',
    description: 'A style tile is a single-page snapshot of brand elements that translates a mood into concrete UI/brand components. It includes color palettes, typography samples, button styles, and texture/material examples.',
    inputs: [
      {
        name: 'brandName',
        type: 'text',
        required: true,
        description: 'The name of the brand or project',
        examples: ['TechFlow', 'Organic Harvest', 'Urban Loft'],
      },
      {
        name: 'brandDescription',
        type: 'textarea',
        required: true,
        description: 'Description of brand identity, values, and aesthetic direction',
        examples: [
          'A modern tech startup focused on AI-powered productivity tools for creative professionals',
          'A sustainable fashion brand celebrating natural materials and ethical production',
        ],
      },
      {
        name: 'adjectives',
        type: 'tags',
        required: false,
        description: 'Brand adjectives (3-5 recommended)',
        examples: ['modern', 'bold', 'minimalist', 'professional', 'innovative'],
      },
    ],
    windows: [
      {
        name: 'Brand Information Panel',
        function: 'Define core brand identity and personality attributes',
        controls: [
          {
            name: 'Brand Name',
            type: 'Text input',
            purpose: 'Specify the project or brand name that will appear on the style tile',
            examples: ['TechFlow', 'Organic Harvest', 'Urban Loft', 'Coastal Living'],
          },
          {
            name: 'Brand Description',
            type: 'Textarea',
            purpose: 'Describe brand values, target audience, and aesthetic direction',
            examples: [
              'A modern tech startup focused on AI-powered productivity tools for creative professionals',
              'A sustainable fashion brand celebrating natural materials and ethical production',
              'Luxury real estate showcasing contemporary urban living spaces',
            ],
          },
          {
            name: 'Brand Adjectives',
            type: 'Tag input (3-5 tags)',
            purpose: 'Define personality traits that guide visual direction',
            examples: ['modern, bold, minimalist, professional, innovative', 'warm, organic, authentic, sustainable', 'luxurious, clean, sophisticated, timeless'],
          },
        ],
        impact: 'Directly influences all visual elements generated - color palette mood, typography selection, button style formality, and texture choices. More specific adjectives result in more targeted design elements.',
      },
      {
        name: 'Color Palette Generator',
        function: 'Create a harmonious 5-color brand palette based on personality',
        controls: [
          {
            name: 'Auto-generate Button',
            type: 'Button',
            purpose: 'Trigger AI generation of cohesive color palette from brand attributes',
            examples: ['Click after entering brand info to generate palette'],
          },
          {
            name: 'Color Swatches',
            type: 'Color previews with HEX codes',
            purpose: 'Display generated colors: primary, secondary, accent, neutral, background',
            examples: ['#2563EB (primary blue)', '#F59E0B (accent orange)', '#1F2937 (dark neutral)'],
          },
        ],
        impact: 'Establishes the foundational color system used in buttons, typography accents, and texture overlays. This palette becomes the visual language of the brand.',
      },
      {
        name: 'Typography Section',
        function: 'Define heading and body font pairings with hierarchy',
        controls: [
          {
            name: 'Heading Font',
            type: 'Font selector with preview',
            purpose: 'Choose display/heading typeface that matches brand personality',
            examples: ['Inter Bold', 'Playfair Display', 'Montserrat SemiBold', 'Raleway ExtraBold'],
          },
          {
            name: 'Body Font',
            type: 'Font selector with preview',
            purpose: 'Choose readable body text font that pairs with heading',
            examples: ['Inter Regular', 'Source Sans Pro', 'Open Sans', 'Lato'],
          },
          {
            name: 'Type Scale Preview',
            type: 'Text samples at different sizes',
            purpose: 'Show hierarchy from H1 to body text',
            examples: ['H1: 48px, H2: 36px, Body: 16px'],
          },
        ],
        impact: 'Sets typographic voice and readability standards. Font pairing directly affects brand personality - serif vs sans-serif, condensed vs wide, traditional vs modern.',
      },
      {
        name: 'Button Styles Configurator',
        function: 'Design 3 button variations (primary, secondary, ghost)',
        controls: [
          {
            name: 'Button Style Presets',
            type: 'Style selector',
            purpose: 'Choose button approach based on brand formality',
            examples: ['Rounded (friendly)', 'Sharp (modern)', 'Soft (approachable)', 'Outlined (minimal)'],
          },
          {
            name: 'Button Previews',
            type: 'Interactive button samples',
            purpose: 'Show hover states and color applications',
            examples: ['Primary: Solid color', 'Secondary: Outlined', 'Ghost: Text only with underline'],
          },
        ],
        impact: 'Defines interaction design language. Rounded buttons feel friendly and consumer-facing, sharp buttons feel corporate and modern, ghost buttons feel minimal and elegant.',
      },
      {
        name: 'Texture & Material Library',
        function: 'Select textures and materials that reinforce brand feel',
        controls: [
          {
            name: 'Material Category',
            type: 'Dropdown menu',
            purpose: 'Filter textures by type',
            examples: ['Natural (wood, stone, fabric)', 'Industrial (metal, concrete)', 'Digital (gradients, patterns)', 'Organic (paper, watercolor)'],
          },
          {
            name: 'Texture Thumbnails',
            type: 'Image grid',
            purpose: 'Browse and select textures that match brand aesthetic',
            examples: ['Linen fabric for organic brand', 'Brushed metal for tech brand', 'Handmade paper for artisan brand'],
          },
        ],
        impact: 'Adds depth and tactility to brand visual system. Natural textures convey authenticity, industrial textures convey strength, digital patterns convey innovation.',
      },
    ],
    outputs: ['Color palette (5 colors)', 'Typography samples (heading & body)', 'Button styles (3 variations)', 'Texture/material suggestions'],
    bestPractices: [
      'Use 3-5 descriptive adjectives that capture brand personality',
      'Be specific about brand values and target audience',
      'Include both emotional and functional aspects in description',
      'Consider the medium (web, print, product) when generating',
    ],
    tips: [
      'Start with a mood board first if you need visual inspiration',
      'Style tiles are perfect for presenting to clients before full design',
      'Export as PDF for easy sharing with team members',
      'Use this before building a complete visual style guide',
    ],
    relatedTools: ['color-story', 'typography-specimen', 'visual-style-guide', 'mood-board'],
    useCases: [
      'Presenting initial brand direction to clients',
      'Aligning team on visual direction before full design',
      'Creating brand guidelines for startups',
      'Exploring multiple brand directions quickly',
    ],
    workflow: 'Typically used after Mood Board and before Visual Style Guide',
  },

  'color-story': {
    id: 'color-story',
    name: 'Color Story Builder',
    category: 'brand',
    purpose: 'Build palette-focused boards with proportions, pairings, and material applications',
    description: 'A color story goes beyond simple palettes to show how colors work together, their proportions, pairings, and real-world material applications.',
    inputs: [
      {
        name: 'mood',
        type: 'text',
        required: true,
        description: 'The mood or theme for the color story',
        examples: ['Ocean sunset', 'Modern tech', 'Vintage warmth', 'Nordic minimalism'],
      },
      {
        name: 'inspiration',
        type: 'textarea',
        required: false,
        description: 'What inspires this color direction',
      },
    ],
    windows: [
      {
        name: 'Mood & Inspiration Input',
        function: 'Define the emotional and conceptual foundation for the color story',
        controls: [
          {
            name: 'Mood Field',
            type: 'Text input',
            purpose: 'Specify the core mood, theme, or atmosphere',
            examples: ['Ocean sunset', 'Modern tech', 'Vintage warmth', 'Nordic minimalism', 'Tropical paradise', 'Industrial chic'],
          },
          {
            name: 'Inspiration Description',
            type: 'Textarea',
            purpose: 'Elaborate on visual references, emotions, or environments',
            examples: [
              'Inspired by Santorini sunsets with warm oranges fading into deep blues',
              'Clean Scandinavian interiors with whites, greys, and natural wood tones',
              'Retro 1970s kitchens with avocado green, harvest gold, and burnt orange',
            ],
          },
        ],
        impact: 'Determines the entire color palette generation - warm vs cool tones, saturation levels, and color harmony approach (analogous, complementary, triadic).',
      },
      {
        name: 'Color Proportion Slider',
        function: 'Define specific color proportions and visual weighting (60-30-10 rule)',
        controls: [
          {
            name: 'Primary Color Percentage',
            type: 'Slider (0-100%)',
            purpose: 'Set how much of the design uses the primary color',
            examples: ['60% - Dominant color', '40% - Balanced with secondary', '80% - Monochromatic approach'],
          },
          {
            name: 'Secondary Color Percentage',
            type: 'Slider (0-100%)',
            purpose: 'Set supporting color weight',
            examples: ['30% - Standard complement', '20% - Subtle accent', '50% - Equal weight'],
          },
          {
            name: 'Accent Color Percentage',
            type: 'Slider (0-100%)',
            purpose: 'Set pop/highlight color usage',
            examples: ['10% - Subtle highlights', '15% - Bold accents', '5% - Minimal touches'],
          },
        ],
        impact: 'Directly controls the visual weighting of colors in all brand applications. Altering these proportions dramatically shifts the overall feel - 60% bright yellow feels energetic, 10% yellow feels elegant.',
      },
      {
        name: 'Color Harmony Selector',
        function: 'Choose the color theory approach for palette generation',
        controls: [
          {
            name: 'Harmony Type',
            type: 'Radio buttons / Dropdown',
            purpose: 'Select color relationship strategy',
            examples: ['Analogous (neighbors on color wheel)', 'Complementary (opposites)', 'Triadic (3 equidistant)', 'Split-complementary', 'Monochromatic (single hue variations)'],
          },
        ],
        impact: 'Determines color relationships and visual energy. Complementary creates vibrant contrast, analogous creates harmony, monochromatic creates sophistication.',
      },
      {
        name: 'Material Application Preview',
        function: 'Show how colors appear on different materials and surfaces',
        controls: [
          {
            name: 'Material Swatches',
            type: 'Visual grid with material examples',
            purpose: 'Display colors on fabric, metal, wood, glass, paper',
            examples: ['Primary blue on brushed metal', 'Accent yellow on linen fabric', 'Neutral gray on matte paper'],
          },
          {
            name: 'Texture Overlay Toggle',
            type: 'Checkbox / Toggle',
            purpose: 'Show color with and without material texture',
            examples: ['ON: Color with wood grain', 'OFF: Flat color swatch'],
          },
        ],
        impact: 'Helps visualize real-world color applications. Colors look different on matte vs glossy, fabric vs metal. Essential for product design and packaging.',
      },
      {
        name: 'Accessibility Checker',
        function: 'Test color contrast ratios for WCAG compliance',
        controls: [
          {
            name: 'Text Color',
            type: 'Color picker',
            purpose: 'Choose foreground text color',
            examples: ['#FFFFFF (white)', '#1F2937 (dark gray)', '#000000 (black)'],
          },
          {
            name: 'Background Color',
            type: 'Color picker',
            purpose: 'Choose background color',
            examples: ['#2563EB (primary blue)', '#F3F4F6 (light gray)'],
          },
          {
            name: 'Contrast Ratio Display',
            type: 'Read-only text with pass/fail indicator',
            purpose: 'Show WCAG AA/AAA compliance',
            examples: ['4.5:1 (WCAG AA Pass)', '7:1 (WCAG AAA Pass)', '2.8:1 (Fail)'],
          },
        ],
        impact: 'Ensures color combinations are readable and accessible. Failing combinations must be adjusted before use in UI or typography.',
      },
    ],
    outputs: ['Primary colors', 'Secondary colors', 'Accent colors', 'Color proportions', 'Material applications'],
    bestPractices: [
      'Think about color proportions (60-30-10 rule)',
      'Consider how colors interact in different lighting',
      'Include both saturated and muted variations',
      'Test accessibility and contrast ratios',
    ],
    tips: [
      'Start with emotion or environment for best results',
      'Color stories work great for multi-platform brands',
      'Use this to nail the palette early in the process',
      'Perfect for creating seasonal variations',
    ],
    relatedTools: ['style-tile', 'mood-board', 'visual-style-guide'],
    useCases: [
      'Defining brand color systems',
      'Creating seasonal color variations',
      'Exploring color psychology for campaigns',
      'Product line color coordination',
    ],
  },

  'typography-specimen': {
    id: 'typography-specimen',
    name: 'Typography Specimen',
    category: 'brand',
    purpose: 'Showcase font families, hierarchy, letterspacing, and optical sizes',
    description: 'A typography specimen displays type families in use, showing hierarchy, scale, spacing, and how text works at different sizes.',
    inputs: [
      {
        name: 'brandStyle',
        type: 'text',
        required: true,
        description: 'Brand style or aesthetic',
        examples: ['Modern', 'Classic', 'Playful', 'Editorial', 'Tech'],
      },
    ],
    outputs: ['Font family recommendations', 'Type hierarchy (H1-H6, body, caption)', 'Letterspacing guidelines', 'Optical size variations'],
    bestPractices: [
      'Show all hierarchy levels (H1 through body text)',
      'Include both display and text sizes',
      'Demonstrate letterspacing at different scales',
      'Test readability at actual use sizes',
    ],
    tips: [
      'Typography sets the voice of your brand',
      'Consider pairing display and body fonts',
      'Test on actual devices, not just design files',
      'Include guidelines for web and print if needed',
    ],
    relatedTools: ['style-tile', 'visual-style-guide'],
    useCases: [
      'Locking typographic voice for brand',
      'Creating typography guidelines',
      'Font pairing exploration',
      'Editorial design systems',
    ],
  },

  'visual-style-guide': {
    id: 'visual-style-guide',
    name: 'Visual Style Guide',
    category: 'brand',
    purpose: 'Create codified brand rules for color, type, spacing, and imagery',
    description: 'A visual style guide documents the do\'s and don\'ts for brand consistency across all touchpoints and creators.',
    inputs: [
      {
        name: 'brandName',
        type: 'text',
        required: true,
        description: 'Brand or project name',
      },
      {
        name: 'guidelines',
        type: 'textarea',
        required: false,
        description: 'Specific brand guidelines or requirements',
      },
    ],
    outputs: ['Color rules', 'Typography rules', 'Spacing guidelines', 'Imagery guidelines', 'Do/Don\'t examples'],
    bestPractices: [
      'Be specific about exact values (hex codes, spacing units)',
      'Include visual examples of correct and incorrect usage',
      'Document edge cases and exceptions',
      'Make it accessible to non-designers',
    ],
    tips: [
      'This is the final step after exploring with other tools',
      'Update regularly as brand evolves',
      'Share with all team members and partners',
      'Include rationale for key decisions',
    ],
    relatedTools: ['style-tile', 'color-story', 'typography-specimen'],
    useCases: [
      'Onboarding new designers',
      'Ensuring consistency across teams',
      'Scaling brand across multiple products',
      'Working with external partners/agencies',
    ],
    workflow: 'Final step after Style Tile, Color Story, and Typography Specimen',
  },

  // CONCEPT EXPLORATION TOOLS
  'inspiration-collage': {
    id: 'inspiration-collage',
    name: 'Inspiration Collage',
    category: 'concept',
    purpose: 'Quick vibe exploration with eclectic images, textures, and color chips',
    description: 'A looser, more eclectic version of a mood board. Great for quick vibe exploration without structure or constraints.',
    inputs: [
      {
        name: 'vibe',
        type: 'text',
        required: true,
        description: 'The vibe or feeling to explore',
        examples: ['vintage futuristic', 'cozy autumn', 'bold maximalist', 'minimal zen'],
      },
    ],
    outputs: ['8-12 eclectic images', 'Textures', 'Color chips', 'Visual references'],
    bestPractices: [
      'Be open to unexpected combinations',
      'Don\'t overthink it - this is about feeling',
      'Include diverse imagery types',
      'Look for emotional resonance over perfect matches',
    ],
    tips: [
      'Use this at the very start of projects',
      'Great for breaking creative blocks',
      'Perfect for exploring multiple directions quickly',
      'More intuitive than structured mood boards',
    ],
    relatedTools: ['mood-board', 'concept-boards'],
    useCases: [
      'Initial creative exploration',
      'Breaking out of creative ruts',
      'Exploring unexpected combinations',
      'Personal projects with flexible direction',
    ],
  },

  'mood-board': {
    id: 'mood-board',
    name: 'Mood Board Creator',
    category: 'concept',
    purpose: 'Structured inspiration grids with 12-20 curated images and color palettes',
    description: 'A structured mood board with carefully curated imagery, color palettes, and keywords that define a visual direction.',
    inputs: [
      {
        name: 'theme',
        type: 'text',
        required: true,
        description: 'The theme or concept to explore',
        examples: ['Modern minimalist office', 'Bohemian home decor', 'Tech startup brand'],
      },
      {
        name: 'keywords',
        type: 'tags',
        required: false,
        description: 'Keywords to guide the mood (3-10 recommended)',
        examples: ['clean', 'warm', 'professional', 'inviting'],
      },
      {
        name: 'imageCount',
        type: 'number',
        required: false,
        description: 'Number of images (12-20 recommended)',
      },
    ],
    outputs: ['12-20 curated images', 'Color palette', 'Keywords', 'Layout options (grid/masonry)'],
    bestPractices: [
      'Aim for 12-20 images for best results',
      'Mix photography, textures, and graphic elements',
      'Include some unexpected elements for interest',
      'Derive color palette from the strongest images',
    ],
    tips: [
      'Most popular tool for setting creative direction',
      'Use grid layout for clean presentation',
      'Export as PDF for client presentations',
      'Create multiple boards to compare directions',
    ],
    relatedTools: ['inspiration-collage', 'concept-boards', 'style-tile'],
    useCases: [
      'Setting visual direction for projects',
      'Client presentations',
      'Team alignment on aesthetics',
      'Interior design, fashion, branding',
    ],
    workflow: 'Often the first step before Style Tile or Concept Boards',
  },

  'concept-boards': {
    id: 'concept-boards',
    name: 'Concept Boards',
    category: 'concept',
    purpose: 'Compare multiple creative routes side-by-side with separate boards per concept',
    description: 'Create multiple concept boards side-by-side, each representing a different creative direction. Perfect for comparing routes and making strategic decisions.',
    inputs: [
      {
        name: 'concepts',
        type: 'array',
        required: true,
        description: 'Names for each concept direction',
        examples: ['Bold & Modern', 'Classic & Elegant', 'Playful & Colorful'],
      },
    ],
    outputs: ['Multiple boards (one per concept)', '6-9 images per board', 'Concept statements', 'Color chips per concept'],
    bestPractices: [
      'Create 2-4 distinct concepts for comparison',
      'Give each concept a clear name and statement',
      'Make concepts meaningfully different, not subtle variations',
      'Include notes on target audience for each',
    ],
    tips: [
      'Perfect for presenting options to clients',
      'Use when you\'re exploring multiple directions',
      'Great for A/B testing visual directions',
      'Can lead to hybrid approaches combining concepts',
    ],
    relatedTools: ['mood-board', 'lookbook'],
    useCases: [
      'Client presentations with options',
      'Strategic brand direction decisions',
      'Campaign concept exploration',
      'Product line differentiation',
    ],
  },

  'wireframe-mood': {
    id: 'wireframe-mood',
    name: 'Wireframe Mood Board',
    category: 'concept',
    purpose: 'Explore UX/structure aesthetics with grayscale layout blocks and spacing',
    description: 'Focus on structure and UX aesthetics using grayscale layouts, spacing examples, and type scale - before adding visual design.',
    inputs: [
      {
        name: 'projectType',
        type: 'text',
        required: true,
        description: 'Type of project (web, mobile, etc.)',
        examples: ['E-commerce website', 'Mobile app', 'Dashboard'],
      },
    ],
    outputs: ['6-8 wireframe examples', 'Spacing system (8px grid typical)', 'Type scale', 'Layout patterns'],
    bestPractices: [
      'Stay in grayscale - no color yet',
      'Focus on hierarchy and information architecture',
      'Show spacing relationships clearly',
      'Include multiple layout patterns',
    ],
    tips: [
      'Use before adding visual design',
      'Perfect for UX-focused projects',
      'Helps separate structure from aesthetics',
      'Great for developer handoff clarity',
    ],
    relatedTools: ['typography-specimen'],
    useCases: [
      'UX/UI design exploration',
      'Separating structure from visual design',
      'Developer handoff documentation',
      'Information architecture planning',
    ],
  },

  // CAMPAIGN & MARKETING TOOLS
  'lookbook': {
    id: 'lookbook',
    name: 'Lookbook Creator',
    category: 'campaign',
    purpose: 'Create sequenced campaign pages showing concepts in context',
    description: 'A lookbook shows concepts in context through sequenced pages, telling a visual story and demonstrating how a concept comes to life.',
    inputs: [
      {
        name: 'campaignName',
        type: 'text',
        required: true,
        description: 'Name of the campaign or collection',
      },
      {
        name: 'concept',
        type: 'textarea',
        required: false,
        description: 'Campaign concept description',
      },
      {
        name: 'pageCount',
        type: 'number',
        required: false,
        description: 'Number of pages (3-12 recommended)',
      },
    ],
    outputs: ['Sequenced pages (3-12)', 'Styled product/concept shots', 'Narrative flow', 'Context demonstrations'],
    bestPractices: [
      'Create a narrative arc across pages',
      'Show concepts in realistic contexts',
      'Vary shot types (detail, full, lifestyle)',
      'Maintain consistent visual language',
    ],
    tips: [
      'Perfect for fashion, product, and campaign presentations',
      'Tell a story with page sequence',
      'Include lifestyle and detail shots',
      'Consider print or digital format needs',
    ],
    relatedTools: ['mood-board', 'concept-boards', 'shot-list'],
    useCases: [
      'Fashion collection presentations',
      'Product launch campaigns',
      'Brand campaign rollouts',
      'Portfolio presentations',
    ],
  },

  'reference-deck': {
    id: 'reference-deck',
    name: 'Reference Deck Builder',
    category: 'campaign',
    purpose: 'Build slide decks with annotated references and clear rationale',
    description: 'A reference deck compiles standout visual references with annotations explaining what to borrow from each (composition, lighting, color, etc.).',
    inputs: [
      {
        name: 'projectName',
        type: 'text',
        required: true,
        description: 'Project name',
      },
    ],
    outputs: ['Slide deck format', 'Annotated references', 'Clear rationale per image', 'Specific call-outs (composition, lighting, etc.)'],
    bestPractices: [
      'Annotate what specifically to borrow from each reference',
      'Be clear about what NOT to copy',
      'Include rationale for each choice',
      'Organize by concept or element',
    ],
    tips: [
      'Essential for aligning teams quickly',
      'Great for client presentations',
      'Use before production/shoot planning',
      'Include diverse reference types',
    ],
    relatedTools: ['lookbook', 'shot-list', 'lighting-lookdev'],
    useCases: [
      'Team alignment before production',
      'Client presentations',
      'Photography/video direction',
      'Design inspiration documentation',
    ],
  },

  'narrative-tone': {
    id: 'narrative-tone',
    name: 'Narrative Tone Board',
    category: 'campaign',
    purpose: 'Align messaging with visuals using quotes, adjectives, and microcopy',
    description: 'A narrative tone board pairs visual imagery with quotes, adjectives, and microcopy examples to align tone of voice with visual style.',
    inputs: [
      {
        name: 'brandVoice',
        type: 'text',
        required: true,
        description: 'Brand voice description',
        examples: ['Friendly and approachable', 'Professional yet warm', 'Bold and irreverent'],
      },
      {
        name: 'messaging',
        type: 'textarea',
        required: false,
        description: 'Key messaging points',
      },
    ],
    outputs: ['Key quotes', 'Brand adjectives', 'Microcopy examples', 'Tone guidelines', 'Visual-verbal pairings'],
    bestPractices: [
      'Pair verbal and visual examples',
      'Include do/don\'t examples',
      'Show tone across different contexts',
      'Include actual copy examples',
    ],
    tips: [
      'Essential for copywriters and designers working together',
      'Use early to align tone across touchpoints',
      'Include examples of what NOT to do',
      'Reference during content creation',
    ],
    relatedTools: ['mood-board', 'style-tile'],
    useCases: [
      'Aligning copywriters with designers',
      'Brand voice documentation',
      'Campaign messaging development',
      'Content strategy alignment',
    ],
  },

  'competitive-audit': {
    id: 'competitive-audit',
    name: 'Competitive Visual Audit',
    category: 'campaign',
    purpose: 'Analyze competitor visuals to identify gaps and opportunities',
    description: 'Grid competitor visuals and analyze patterns in color, composition, and tone to identify opportunities for differentiation.',
    inputs: [
      {
        name: 'industry',
        type: 'text',
        required: true,
        description: 'Industry or market',
      },
      {
        name: 'competitors',
        type: 'array',
        required: true,
        description: 'Competitor names',
      },
    ],
    outputs: ['Competitor visual grid', 'Pattern analysis', 'Gap identification', 'Differentiation opportunities'],
    bestPractices: [
      'Include 5-10 key competitors',
      'Analyze visual patterns objectively',
      'Look for what\'s missing in the market',
      'Consider target audience overlap',
    ],
    tips: [
      'Essential before brand development',
      'Update regularly as market evolves',
      'Look for unexpected insights',
      'Helps justify creative decisions to stakeholders',
    ],
    relatedTools: ['mood-board', 'concept-boards'],
    useCases: [
      'Brand positioning strategy',
      'Campaign differentiation',
      'Market entry planning',
      'Rebranding justification',
    ],
  },

  // PRODUCTION PLANNING TOOLS
  'shot-list': {
    id: 'shot-list',
    name: 'Shot List with Visual Refs',
    category: 'production',
    purpose: 'Production-ready shot lists with framing, lighting notes, and reference images',
    description: 'Detailed shot lists for photo/video production with framing specifications, lighting notes, prop requirements, and visual references.',
    inputs: [
      {
        name: 'projectName',
        type: 'text',
        required: true,
        description: 'Project or shoot name',
      },
      {
        name: 'shotCount',
        type: 'number',
        required: false,
        description: 'Number of shots (5-20 typical)',
      },
    ],
    outputs: ['Shot list spreadsheet', 'Shot names/numbers', 'Framing notes', 'Lighting specs', 'Prop requirements', 'Reference images'],
    bestPractices: [
      'Number shots for easy tracking',
      'Include backup/alternate shots',
      'Note specific framing (wide, medium, close-up)',
      'Specify lighting setup per shot',
    ],
    tips: [
      'Essential for efficient production',
      'Share with entire crew before shoot',
      'Include timing estimates',
      'Add notes field for special requirements',
    ],
    relatedTools: ['reference-deck', 'lighting-lookdev', 'storyboard-pro'],
    useCases: [
      'Photo shoot planning',
      'Video production',
      'Commercial production',
      'Content creation schedules',
    ],
  },

  'lighting-lookdev': {
    id: 'lighting-lookdev',
    name: 'Lighting/Look Dev Board',
    category: 'production',
    purpose: 'Cinematic lighting references with camera angles and color grade examples',
    description: 'Examples of lighting styles, camera angles, and color grade references for achieving a specific cinematic look.',
    inputs: [
      {
        name: 'style',
        type: 'text',
        required: true,
        description: 'Desired lighting style',
        examples: ['Golden hour', 'High contrast noir', 'Soft natural', 'Dramatic side-lit'],
      },
    ],
    outputs: ['Lighting style references', 'Camera angle examples', 'Color grade/LUT recommendations', 'Setup diagrams'],
    bestPractices: [
      'Show examples in similar environments',
      'Include lighting setup notes',
      'Reference specific LUTs or grades',
      'Consider time of day and natural light',
    ],
    tips: [
      'Critical for cinematography and photography',
      'Share with DP/photographer before shoot',
      'Include practical setup information',
      'Consider budget constraints in references',
    ],
    relatedTools: ['shot-list', 'reference-deck', 'storyboard-pro'],
    useCases: [
      'Film/video production',
      'Photography direction',
      'Commercial shoots',
      '3D rendering look development',
    ],
  },

  'texture-material': {
    id: 'texture-material',
    name: 'Texture/Material Board',
    category: 'production',
    purpose: 'Physical and digital texture swatches, patterns, and finish demonstrations',
    description: 'Swatches of materials, textures, patterns, and finishes for product design, packaging, interiors, or fashion.',
    inputs: [
      {
        name: 'theme',
        type: 'text',
        required: true,
        description: 'Material theme or application',
        examples: ['Natural materials', 'Tech finishes', 'Luxury textures'],
      },
    ],
    outputs: ['Material swatches', 'Texture samples', 'Finish demonstrations', 'Pattern examples', 'Application notes'],
    bestPractices: [
      'Include physical and visual examples',
      'Show materials in actual lighting',
      'Note sourcing information',
      'Consider production feasibility',
    ],
    tips: [
      'Essential for product/packaging design',
      'Great for interior design projects',
      'Include supplier information',
      'Consider sustainability factors',
    ],
    relatedTools: ['color-story', 'style-tile'],
    useCases: [
      'Product design',
      'Packaging development',
      'Interior design',
      'Fashion/textile design',
    ],
  },

  'storyboard-pro': {
    id: 'storyboard-pro',
    name: 'Storyboard Pro',
    category: 'production',
    purpose: 'Enhanced storyboards with improved UI/UX and advanced features',
    description: 'Frame-by-frame visual sequence with action notes and voiceover for planning motion, ads, or explainer videos.',
    inputs: [
      {
        name: 'title',
        type: 'text',
        required: true,
        description: 'Storyboard title',
      },
      {
        name: 'description',
        type: 'textarea',
        required: false,
        description: 'Story or concept description',
      },
      {
        name: 'frameCount',
        type: 'number',
        required: false,
        description: 'Number of frames (3-12 typical)',
      },
    ],
    windows: [
      {
        name: 'Project Setup Panel',
        function: 'Define storyboard project details and overall structure',
        controls: [
          {
            name: 'Title Field',
            type: 'Text input',
            purpose: 'Name the storyboard project',
            examples: ['Product Launch Commercial 30s', '"Summer Collection" Instagram Story', 'How-To Tutorial: Coffee Brewing'],
          },
          {
            name: 'Description',
            type: 'Textarea',
            purpose: 'Outline the overall story, concept, or message',
            examples: [
              'A 30-second commercial showing our new smartwatch seamlessly integrating into daily life - morning jog, work meeting, evening cooking',
              'Tutorial showing pour-over coffee technique in 6 steps, warm and inviting aesthetic',
            ],
          },
          {
            name: 'Frame Count',
            type: 'Number input (3-12)',
            purpose: 'Set how many frames/scenes to include',
            examples: ['6 frames for social media story', '12 frames for full 30s commercial', '4 frames for quick concept'],
          },
        ],
        impact: 'Sets the scope and structure of the entire storyboard. More frames = more detailed narrative, fewer frames = quick concept sketch.',
      },
      {
        name: 'Frame Editor',
        function: 'Create individual frames with visuals, timing, and action notes',
        controls: [
          {
            name: 'Frame Visual',
            type: 'Image upload or AI generation',
            purpose: 'Add the visual representation for this frame',
            examples: ['Upload reference photo', 'Generate "wide shot of person jogging in park, golden hour"', 'Sketch thumbnail'],
          },
          {
            name: 'Action Description',
            type: 'Textarea',
            purpose: 'Describe what happens in this frame - camera movements, subject actions',
            examples: [
              'Camera starts on close-up of smartwatch, then pulls out to reveal runner checking pace',
              'Cut to overhead shot of coffee being poured into mug, steam rising',
              'Zoom in on product as hand reaches to grab it from shelf',
            ],
          },
          {
            name: 'Duration/Timing',
            type: 'Number input (seconds)',
            purpose: 'Specify how long this frame appears on screen',
            examples: ['2s - Quick product shot', '5s - Establishing shot', '1.5s - Fast-cut montage'],
          },
          {
            name: 'Voiceover/Dialogue',
            type: 'Textarea',
            purpose: 'Add narration, dialogue, or sound notes',
            examples: [
              'VO: "Your day, optimized."',
              'SFX: Upbeat music fade in',
              'Character: "This changed everything for me."',
              '[No dialogue - music only]',
            ],
          },
        ],
        impact: 'Each frame builds the narrative sequence. Action descriptions guide the production team, timing ensures pacing fits duration limits, voiceover aligns audio with visuals.',
      },
      {
        name: 'Camera & Movement Controls',
        function: 'Specify camera angles, movements, and framing for each shot',
        controls: [
          {
            name: 'Shot Type',
            type: 'Dropdown selector',
            purpose: 'Define framing and distance',
            examples: ['Wide Shot (WS)', 'Medium Shot (MS)', 'Close-Up (CU)', 'Extreme Close-Up (ECU)', 'Over-the-Shoulder (OTS)'],
          },
          {
            name: 'Camera Movement',
            type: 'Dropdown selector',
            purpose: 'Specify camera motion',
            examples: ['Static', 'Pan (left/right)', 'Tilt (up/down)', 'Zoom In', 'Zoom Out', 'Dolly', 'Tracking Shot'],
          },
          {
            name: 'Angle',
            type: 'Dropdown selector',
            purpose: 'Set camera perspective',
            examples: ['Eye Level', 'High Angle (looking down)', 'Low Angle (looking up)', 'Bird\'s Eye View', 'Dutch Angle (tilted)'],
          },
        ],
        impact: 'Camera choices dramatically affect emotional impact - low angles make subjects powerful, high angles make them vulnerable, close-ups create intimacy, wide shots establish context.',
      },
      {
        name: 'Transition Manager',
        function: 'Define how frames connect to each other',
        controls: [
          {
            name: 'Transition Type',
            type: 'Dropdown per frame',
            purpose: 'Choose how this frame transitions to the next',
            examples: ['Cut (instant)', 'Fade to Black', 'Cross Dissolve', 'Wipe', 'Match Cut', 'Jump Cut'],
          },
          {
            name: 'Transition Duration',
            type: 'Number input (seconds)',
            purpose: 'Set how long the transition takes',
            examples: ['0s - Hard cut', '0.5s - Quick dissolve', '1.5s - Slow fade'],
          },
        ],
        impact: 'Transitions control pacing and emotional flow. Quick cuts create energy and urgency, slow fades create reflection and passage of time, match cuts create visual poetry.',
      },
      {
        name: 'Sequence Timeline',
        function: 'View and adjust the overall timing and flow of all frames',
        controls: [
          {
            name: 'Timeline Scrubber',
            type: 'Interactive timeline',
            purpose: 'Visualize total duration and frame sequence',
            examples: ['Frame 1: 0-3s', 'Frame 2: 3-6s', 'Frame 3: 6-10s', 'Total: 30s'],
          },
          {
            name: 'Reorder Frames',
            type: 'Drag-and-drop',
            purpose: 'Rearrange frame order to test different narrative sequences',
            examples: ['Drag Frame 3 before Frame 2 to change story flow'],
          },
        ],
        impact: 'Ensures total duration matches required length (e.g., 30s commercial, 60s explainer). Reordering can dramatically change narrative impact and emotional arc.',
      },
    ],
    outputs: ['Frame-by-frame visuals', 'Action descriptions', 'Voiceover/dialogue notes', 'Timing information', 'Transition notes'],
    bestPractices: [
      'Include timing for each frame',
      'Note camera movements',
      'Add dialogue/voiceover exactly',
      'Show key emotional beats',
    ],
    tips: [
      'Essential for video/animation projects',
      'Share with entire production team',
      'Include timing estimates per frame',
      'Note special effects or transitions',
    ],
    relatedTools: ['shot-list', 'lighting-lookdev', 'reference-deck'],
    useCases: [
      'Video production planning',
      'Animation pre-production',
      'Commercial storyboarding',
      'Explainer video planning',
    ],
  },
};

// Workflows: Multi-tool processes
export const workflows: ToolWorkflow[] = [
  {
    name: 'Complete Brand Identity',
    description: 'Full brand identity development from exploration to guidelines',
    steps: ['mood-board', 'color-story', 'typography-specimen', 'style-tile', 'visual-style-guide'],
    useCase: 'New brand development or complete rebrand',
  },
  {
    name: 'Campaign Development',
    description: 'From concept exploration to production planning',
    steps: ['competitive-audit', 'mood-board', 'concept-boards', 'narrative-tone', 'lookbook'],
    useCase: 'Marketing campaign or product launch',
  },
  {
    name: 'Video Production',
    description: 'Complete pre-production workflow',
    steps: ['reference-deck', 'storyboard-pro', 'shot-list', 'lighting-lookdev'],
    useCase: 'Video, commercial, or film production',
  },
  {
    name: 'Quick Exploration',
    description: 'Fast creative direction finding',
    steps: ['inspiration-collage', 'mood-board', 'style-tile'],
    useCase: 'Quick projects or initial explorations',
  },
  {
    name: 'Product Design',
    description: 'Physical product visual development',
    steps: ['mood-board', 'color-story', 'texture-material', 'lookbook'],
    useCase: 'Product design and packaging',
  },
];

// Categories for filtering
export const categories = {
  brand: {
    name: 'Brand & Identity',
    icon: '🎨',
    description: 'Tools for building brand systems, guidelines, and visual identity',
  },
  concept: {
    name: 'Concept Exploration',
    icon: '✨',
    description: 'Tools for exploring creative directions and visual concepts',
  },
  campaign: {
    name: 'Campaign & Marketing',
    icon: '📊',
    description: 'Tools for campaign development and market positioning',
  },
  production: {
    name: 'Production Planning',
    icon: '🎬',
    description: 'Tools for planning photo, video, and production work',
  },
};

// Helper functions
export const getToolById = (toolId: string): ToolKnowledge | undefined => {
  return toolsKnowledge[toolId];
};

export const getToolsByCategory = (category: string): ToolKnowledge[] => {
  return Object.values(toolsKnowledge).filter((tool) => tool.category === category);
};

export const getRelatedTools = (toolId: string): ToolKnowledge[] => {
  const tool = toolsKnowledge[toolId];
  if (!tool) return [];
  return tool.relatedTools
    .map((id) => toolsKnowledge[id])
    .filter((t) => t !== undefined);
};

export const searchTools = (query: string): ToolKnowledge[] => {
  const lowercaseQuery = query.toLowerCase();
  return Object.values(toolsKnowledge).filter(
    (tool) =>
      tool.name.toLowerCase().includes(lowercaseQuery) ||
      tool.description.toLowerCase().includes(lowercaseQuery) ||
      tool.purpose.toLowerCase().includes(lowercaseQuery) ||
      tool.useCases.some((useCase) => useCase.toLowerCase().includes(lowercaseQuery))
  );
};
