// PromptsGenie Pro AI Assistant - System Prompts and Context Templates
// Used to provide context-aware guidance with Gemini

import { toolsKnowledge, workflows, categories, type ToolKnowledge } from './proKnowledgeBase';

export interface ChatContext {
  currentTool?: string;
  userInput?: Record<string, any>;
  conversationHistory?: { role: 'user' | 'assistant'; content: string }[];
}

/**
 * Base system prompt with complete PromptsGenie Pro knowledge
 */
export const getBaseSystemPrompt = (): string => {
  return `You are the PromptsGenie Pro AI Assistant, an expert in visual planning, creative ideation, and design workflow optimization.

# YOUR EXPERTISE

You have complete knowledge of PromptsGenie Pro, a professional creative toolkit with 16 specialized tools across 4 categories:

## BRAND & IDENTITY TOOLS (4)
1. **Style Tile Generator** - Brand element snapshots with color palettes, typography, buttons, and textures
2. **Color Story Builder** - Palette-focused boards with proportions, pairings, and material applications
3. **Typography Specimen** - Font families, hierarchy, letterspacing, and optical sizes
4. **Visual Style Guide** - Codified brand rules for color, type, spacing, and imagery

## CONCEPT EXPLORATION TOOLS (4)
5. **Inspiration Collage** - Quick vibe exploration with eclectic images and textures
6. **Mood Board Creator** - Structured 12-20 image grids with curated visuals and color palettes
7. **Concept Boards** - Multiple creative routes compared side-by-side
8. **Wireframe Mood Board** - UX/structure aesthetics with grayscale layouts

## CAMPAIGN & MARKETING TOOLS (4)
9. **Lookbook Creator** - Sequenced campaign pages showing concepts in context
10. **Reference Deck Builder** - Slide decks with annotated references and clear rationale
11. **Narrative Tone Board** - Messaging aligned with visuals using quotes and adjectives
12. **Competitive Visual Audit** - Competitor visual analysis for gaps and opportunities

## PRODUCTION PLANNING TOOLS (4)
13. **Shot List with Visual Refs** - Production-ready shot lists with framing and lighting notes
14. **Lighting/Look Dev Board** - Cinematic lighting references with camera angles and color grades
15. **Texture/Material Board** - Physical and digital texture swatches, patterns, and finishes
16. **Storyboard Pro** - Enhanced storyboards with frame-by-frame visuals and action notes

# COMMON WORKFLOWS

**Complete Brand Identity:**
Mood Board → Color Story → Typography Specimen → Style Tile → Visual Style Guide

**Campaign Development:**
Competitive Audit → Mood Board → Concept Boards → Narrative Tone → Lookbook

**Video Production:**
Reference Deck → Storyboard Pro → Shot List → Lighting/Look Dev

**Quick Exploration:**
Inspiration Collage → Mood Board → Style Tile

**Product Design:**
Mood Board → Color Story → Texture/Material → Lookbook

# YOUR ROLE

1. **Guide Tool Selection** - Recommend the right tool(s) for user's goals
2. **Optimize Inputs** - Help craft better themes, keywords, and descriptions
3. **Suggest Workflows** - Recommend multi-tool sequences for complex projects
4. **Provide Best Practices** - Share tips and best practices for each tool
5. **Offer Creative Inspiration** - Help users when they're stuck or need ideas
6. **Troubleshoot Issues** - Help with common problems and questions

# COMMUNICATION STYLE

- Be **concise** and actionable (2-4 sentences typically)
- Use **bullet points** for multiple suggestions
- Reference **specific tools by name** when relevant
- Be **encouraging** and creative
- Ask **clarifying questions** when user's intent is unclear
- Provide **concrete examples** when helpful
- Use **formatting** (bold, bullets) for clarity

# IMPORTANT GUIDELINES

- Always reference tools by their full name (e.g., "Style Tile Generator" not just "style tile")
- When suggesting workflows, explain why in 1 sentence
- Keep responses focused and practical
- If user asks about a tool they're already using, provide context-specific tips
- Suggest related tools when relevant
- Don't make up features or capabilities not in the tool descriptions

Ready to assist with PromptsGenie Pro!`;
};

/**
 * Generate context-aware prompt based on current tool
 */
export const getContextPrompt = (context: ChatContext): string => {
  const { currentTool, userInput } = context;

  if (!currentTool) {
    return ''; // No specific context
  }

  const tool = toolsKnowledge[currentTool];
  if (!tool) {
    return '';
  }

  let contextPrompt = `\n\n# CURRENT CONTEXT - IMPORTANT!\n\nThe user is currently inside the **${tool.name}** tool and asking about THIS SPECIFIC TOOL.\n\n**CRITICAL: Use the detailed information below to answer. Do NOT use generic knowledge about style tiles or design tools. Reference the SPECIFIC windows and controls listed here.**\n\n`;

  // Add tool-specific information
  contextPrompt += `**Tool Purpose:** ${tool.purpose}\n\n`;
  contextPrompt += `**Category:** ${categories[tool.category].name}\n\n`;

  // Add input requirements
  const requiredInputs = tool.inputs.filter(i => i.required);
  if (requiredInputs.length > 0) {
    contextPrompt += `**Required Inputs:**\n`;
    requiredInputs.forEach(input => {
      contextPrompt += `- ${input.name}: ${input.description}\n`;
    });
    contextPrompt += `\n`;
  }

  // Add user's current input if available
  if (userInput && Object.keys(userInput).length > 0) {
    contextPrompt += `**User's Current Input:**\n`;
    Object.entries(userInput).forEach(([key, value]) => {
      if (value && value !== '' && (!Array.isArray(value) || value.length > 0)) {
        contextPrompt += `- ${key}: ${JSON.stringify(value)}\n`;
      }
    });
    contextPrompt += `\n`;
  }

  // Add best practices
  if (tool.bestPractices.length > 0) {
    contextPrompt += `**Best Practices:**\n`;
    tool.bestPractices.slice(0, 3).forEach(practice => {
      contextPrompt += `- ${practice}\n`;
    });
    contextPrompt += `\n`;
  }

  // Add window/section information for detailed guidance
  if (tool.windows && tool.windows.length > 0) {
    contextPrompt += `\n## TOOL STRUCTURE - USE THIS INFORMATION!\n\n`;
    contextPrompt += `**IMPORTANT:** When the user asks about "${tool.name}", reference these ${tool.windows.length} SPECIFIC windows/sections. DO NOT give generic descriptions.\n\n`;
    contextPrompt += `**The ${tool.name} has exactly ${tool.windows.length} windows:**\n\n`;
    tool.windows.forEach((window, index) => {
      contextPrompt += `### ${index + 1}. ${window.name}\n`;
      contextPrompt += `**Function:** ${window.function}\n`;
      contextPrompt += `**Controls:** ${window.controls.map(c => c.name).join(', ')}\n`;
      contextPrompt += `**Impact:** ${window.impact}\n`;

      // Add example usage for all controls with examples
      if (window.controls.length > 0) {
        contextPrompt += `**Example Usage:**\n`;
        window.controls.slice(0, 3).forEach(control => {
          if (control.examples && control.examples.length > 0) {
            contextPrompt += `  - ${control.name}: "${control.examples[0]}"\n`;
          }
        });
      }
      contextPrompt += `\n`;
    });
    contextPrompt += `**YOU MUST reference these specific windows when answering questions about ${tool.name}.**\n\n`;
  }

  // Add related tools
  if (tool.relatedTools.length > 0) {
    const relatedToolNames = tool.relatedTools
      .map(id => toolsKnowledge[id]?.name)
      .filter(name => name)
      .slice(0, 3);
    if (relatedToolNames.length > 0) {
      contextPrompt += `**Related Tools:** ${relatedToolNames.join(', ')}\n\n`;
    }
  }

  contextPrompt += `\n---\n\n**INSTRUCTIONS FOR THIS RESPONSE:**\n`;
  contextPrompt += `1. If asked "what windows" or "what sections", list the ${tool.windows?.length || 0} specific windows by name\n`;
  contextPrompt += `2. Reference window names (e.g., "Brand Information Panel") not generic terms\n`;
  contextPrompt += `3. Provide concrete examples from the controls listed above\n`;
  contextPrompt += `4. Explain the impact/effect of each window's settings\n`;
  contextPrompt += `5. Do NOT say "it doesn't have windows" - it has ${tool.windows?.length || 0} defined windows\n`;

  return contextPrompt;
};

/**
 * Generate prompt for tool recommendation
 */
export const getToolRecommendationPrompt = (userGoal: string): string => {
  return `The user wants to: "${userGoal}"

Recommend the most appropriate PromptsGenie Pro tool(s) for this goal.

Format your response as:
1. **Primary Tool**: [Tool Name] - Brief reason why (1 sentence)
2. **Optional Next Steps**: [Related tools if this is part of a bigger workflow]

Keep it concise and actionable.`;
};

/**
 * Generate prompt for input optimization
 */
export const getInputOptimizationPrompt = (toolId: string, currentInput: string): string => {
  const tool = toolsKnowledge[toolId];
  if (!tool) return '';

  return `The user is working with **${tool.name}** and has entered: "${currentInput}"

Help optimize this input by:
1. Suggesting more specific or effective wording
2. Recommending 2-3 additional keywords/adjectives that would improve results
3. Noting what's working well (1 thing)

Keep your response concise (3-4 sentences total).`;
};

/**
 * Generate prompt for workflow suggestion
 */
export const getWorkflowPrompt = (projectType: string): string => {
  return `The user is working on: "${projectType}"

Suggest a multi-tool workflow from PromptsGenie Pro. Reference the common workflows:
- Complete Brand Identity
- Campaign Development
- Video Production
- Quick Exploration
- Product Design

Format your response as:
**Suggested Workflow:**
1. [Tool Name] - Why first
2. [Tool Name] - What this adds
3. [Tool Name] - Final step

Keep it concise and explain the progression.`;
};

/**
 * Generate prompt for troubleshooting
 */
export const getTroubleshootingPrompt = (issue: string, toolId?: string): string => {
  let prompt = `The user is experiencing this issue: "${issue}"\n\n`;

  if (toolId) {
    const tool = toolsKnowledge[toolId];
    if (tool) {
      prompt += `They are using the **${tool.name}** tool.\n\n`;
    }
  }

  prompt += `Provide 2-3 practical troubleshooting steps or solutions. Be specific and actionable.`;

  return prompt;
};

/**
 * Generate prompt for creative inspiration
 */
export const getInspirationPrompt = (toolId: string, theme?: string): string => {
  const tool = toolsKnowledge[toolId];
  if (!tool) return '';

  let prompt = `The user needs creative inspiration for **${tool.name}**.`;

  if (theme) {
    prompt += ` Their theme is: "${theme}"`;
  }

  prompt += `\n\nProvide:
1. **3 specific theme/keyword suggestions** that would work well
2. **1 creative direction** they might not have considered
3. **1 tip** for getting unstuck

Keep it inspiring and actionable.`;

  return prompt;
};

/**
 * Generate welcome message for a specific tool
 */
export const getToolWelcomeMessage = (toolId: string): string => {
  const tool = toolsKnowledge[toolId];
  if (!tool) return "Hi! How can I help you with PromptsGenie Pro?";

  const tips = tool.tips.slice(0, 2);

  return `**Welcome to ${tool.name}!** 🎨\n\n${tool.purpose}\n\n**Quick Tips:**\n${tips.map(tip => `• ${tip}`).join('\n')}\n\nNeed help getting started?`;
};

/**
 * Example prompts users can click
 */
export const getExamplePrompts = (toolId?: string): string[] => {
  if (!toolId) {
    return [
      "Which tool should I use for brand identity?",
      "Show me the complete branding workflow",
      "What's the difference between Mood Board and Inspiration Collage?",
      "Help me plan a product launch campaign",
    ];
  }

  const tool = toolsKnowledge[toolId];
  if (!tool) return [];

  const baseExamples = [
    `How do I get the best results from ${tool.name}?`,
    `What should I do after using ${tool.name}?`,
  ];

  // Add tool-specific examples
  const specificExamples: Record<string, string[]> = {
    'mood-board': [
      "How many images should I include?",
      "Give me theme ideas for a tech startup",
    ],
    'style-tile': [
      "What adjectives work well for modern brands?",
      "How do I describe my brand effectively?",
    ],
    'storyboard-pro': [
      "Help me plan a 30-second commercial",
      "What frame count should I use?",
    ],
  };

  return [...baseExamples, ...(specificExamples[toolId] || [])].slice(0, 4);
};

/**
 * Format conversation history for Gemini
 */
export const formatConversationHistory = (
  history: { role: 'user' | 'assistant'; content: string }[]
): string => {
  if (!history || history.length === 0) return '';

  let formatted = '\n\n# CONVERSATION HISTORY\n\n';
  history.slice(-6).forEach((message) => { // Keep last 6 messages for context
    formatted += `**${message.role === 'user' ? 'User' : 'Assistant'}**: ${message.content}\n\n`;
  });

  return formatted;
};
