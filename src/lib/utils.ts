import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export interface ComposeParts {
  userText: string;
  style?: string;
  scene?: string;
  contentSummary?: string;
  useStyle?: boolean;
  useScene?: boolean;
  rewriteStyle?: 'Descriptive' | 'Concise' | 'Marketing' | 'Technical';
}

/**
 * Formats analysis text for better readability by adding proper line breaks and structure
 */
export function formatAnalysisText(text: string): string {
  if (!text || !text.trim()) return text;
  
  let formatted = text.trim();
  
  // Remove any existing "Subject:", "Scene:", "Style:" prefixes that might be duplicated
  formatted = formatted.replace(/^(Subject|Scene|Style):\s*/i, '');
  
  // Aggressive removal of unwanted introductory phrases and meta-text
  formatted = formatted.replace(/Here's\s+(a\s+|an\s+)?(prompt|analysis|description)[^:]*:\s*/gi, '');
  formatted = formatted.replace(/^(Prompt|Analysis):\s*/gmi, '');
  formatted = formatted.replace(/based on the (provided )?image:\s*/gi, '');
  formatted = formatted.replace(/analyzing the environmental design and providing a focused\s+prompt for recreating a similar scene:\s*/gi, '');
  formatted = formatted.replace(/artistic style analysis and a\s+prompt based on the provided image:\s*/gi, '');
  formatted = formatted.replace(/^prompt\s+/gmi, '');
  
  // Remove any remaining "Here's" patterns
  formatted = formatted.replace(/Here's\s+/gi, '');
  
  // Remove "artistic style analysis and a" patterns
  formatted = formatted.replace(/artistic style analysis and a\s*/gi, '');
  
  // Clean up all asterisk formatting markers
  formatted = formatted.replace(/\*\*\s*/g, '');
  formatted = formatted.replace(/\s*\*\*/g, '');
  formatted = formatted.replace(/^\s*\*\s*/gm, ''); // Remove asterisks at start of lines
  formatted = formatted.replace(/\s*\*\s*$/gm, ''); // Remove asterisks at end of lines
  
  // Clean up bullet point markers and convert to proper bullets
  formatted = formatted.replace(/^\s*•\s*/gm, '• ');
  formatted = formatted.replace(/^\s*-\s+/gm, '• ');
  
  // Remove section headers that are redundant or unwanted
  formatted = formatted.replace(/^(Artistic Style Analysis|Analysis):\s*/gmi, '');
  
  // Remove quotes around the entire text if present
  formatted = formatted.replace(/^"(.*)"$/s, '$1');
  
  // Clean up orphaned words at the beginning
  formatted = formatted.replace(/^(prompt|analysis)\s+/gmi, '');
  
  // Add line breaks before important section markers only
  formatted = formatted.replace(/\b(Physical characteristics|The color scheme|Her pose|She wears|Distinctive features|Core Artistic Essence|Rendering Technique|Art Movement|Color Theory|Cultural Influences|Aesthetic Approach|Atmosphere|Composition)\b/gi, '\n\n$1');
  
  // Ensure proper spacing around colons for section headers
  formatted = formatted.replace(/([^:\s]):([^\s])/g, '$1: $2');
  
  // Clean up multiple consecutive line breaks (max 2)
  formatted = formatted.replace(/\n{3,}/g, '\n\n');
  
  // Clean up any leading/trailing whitespace on lines but preserve natural text flow
  formatted = formatted.split('\n').map(line => line.trim()).filter(line => line.length > 0).join('\n');
  
  return formatted.trim();
}

/**
 * Apply rewrite style transformations to the prompt text
 */
export function applyRewriteStyle(text: string, rewriteStyle: 'Descriptive' | 'Concise' | 'Marketing' | 'Technical'): string {
  console.log('🎯 applyRewriteStyle called with:', { text: text.substring(0, 100) + '...', rewriteStyle });
  
  if (!text || !rewriteStyle || rewriteStyle === 'Descriptive') {
    console.log('🔄 Returning original text (no transformation needed)');
    return text; // Default style, no transformation needed
  }

  switch (rewriteStyle) {
    case 'Marketing':
      console.log('🚀 Starting Marketing transformation for text:', text);
      // Transform text to be more marketing-focused with compelling language
      const marketingPrefixes = [
        'Stunning, commercially powerful',
        'Captivating, audience-engaging',
        'Show-stopping, market-dominating',
        'Mesmerizing, brand-elevating',
        'Eye-catching, conversion-optimized',
        'Compelling, viral-ready'
      ];
      const marketingSuffixes = [
        ' engineered for maximum visual impact and instant audience connection',
        ' crafted to captivate viewers and drive engagement',
        ' optimized for viral potential and brand memorability',
        ' designed to command attention and inspire action',
        ' perfect for high-converting marketing campaigns',
        ' guaranteed to stop scrollers and boost engagement'
      ];
      
      // Comprehensive marketing vocabulary transformations
      const marketingTransforms = {
        'character': 'compelling protagonist',
        'person': 'captivating figure',
        'individual': 'magnetic personality',
        'subject': 'star attraction',
        'figure': 'show-stopping centerpiece',
        'woman': 'stunning female lead',
        'man': 'charismatic male lead',
        'cyberpunk': 'cutting-edge futuristic',
        'cybernetic': 'high-tech revolutionary',
        'augmentations': 'premium enhancements',
        'headpiece': 'signature statement piece',
        'collar': 'luxury accent feature',
        'expression': 'compelling emotional appeal',
        'gaze': 'magnetic eye contact',
        'eyes': 'mesmerizing gaze',
        'hair': 'stunning locks',
        'skin': 'flawless complexion',
        'bright': 'electrifying',
        'glowing': 'luminous and mesmerizing',
        'pale': 'striking porcelain',
        'serene': 'confidently composed',
        'intelligent': 'sophisticatedly aware',
        'direct': 'powerfully engaging',
        'unwavering': 'confidently commanding',
        'blue': 'captivating azure',
        'metal': 'premium metallic',
        'wires': 'sleek conduits',
        'spheres': 'elegant orbs',
        'circuit': 'sophisticated tech',
        'lines': 'striking patterns',
        'posed': 'expertly positioned',
        'facial': 'premium facial',
        'embedded': 'seamlessly integrated',
        'exposed': 'artfully displayed',
        'plating': 'luxury finishing',
        'integrated': 'masterfully combined',
        'conduits': 'elegant channels'
      };
      
      let marketingText = text;
      console.log('📝 Original text before transformations:', marketingText);
      
      // Apply marketing vocabulary transformations
      Object.entries(marketingTransforms).forEach(([original, marketing]) => {
        const regex = new RegExp(`\\b${original}\\b`, 'gi');
        const beforeReplace = marketingText;
        marketingText = marketingText.replace(regex, marketing);
        if (beforeReplace !== marketingText) {
          console.log(`🔄 Replaced "${original}" with "${marketing}"`);
        }
      });
      console.log('📝 After vocabulary transformations:', marketingText);
      
      // Remove any existing prefixes and clean up
      marketingText = marketingText.replace(/^(create|generate|make|design|subject:?\s*)/i, '');
      marketingText = marketingText.trim();
      console.log('📝 After prefix cleanup:', marketingText);
      
      // Add marketing prefix and suffix only if text doesn't already have them
      if (!marketingText.toLowerCase().includes('stunning') && 
          !marketingText.toLowerCase().includes('captivating') && 
          !marketingText.toLowerCase().includes('compelling')) {
        const prefix = marketingPrefixes[Math.floor(Math.random() * marketingPrefixes.length)];
        marketingText = `${prefix} ${marketingText.toLowerCase()}`;
      }
      
      if (!marketingText.includes('engineered for') && 
          !marketingText.includes('optimized for') && 
          !marketingText.includes('designed to')) {
        const suffix = marketingSuffixes[Math.floor(Math.random() * marketingSuffixes.length)];
        marketingText = `${marketingText}${suffix}`;
      }
      
      // Add commercial appeal elements
      marketingText = marketingText.replace(/;/g, ' featuring');
      marketingText = marketingText.replace(/\bwith\b/g, 'showcasing');
      marketingText = marketingText.replace(/\band\b/g, 'plus');
      marketingText = marketingText.replace(/\bincorporating\b/g, 'featuring');
      console.log('📝 After commercial appeal elements:', marketingText);
      
      console.log('✅ Final Marketing transformation result:', marketingText);
      return marketingText;

    case 'Concise':
      // Make the text more concise by removing unnecessary words
      return text
        .replace(/\b(very|really|quite|rather|extremely|incredibly|absolutely)\s+/gi, '')
        .replace(/\b(in order to|so as to)\b/gi, 'to')
        .replace(/\b(due to the fact that|owing to the fact that)\b/gi, 'because')
        .replace(/\b(at this point in time|at the present time)\b/gi, 'now')
        .replace(/\b(a large number of|a great deal of)\b/gi, 'many')
        .replace(/\s+/g, ' ')
        .trim();

    case 'Technical':
      // Add technical terminology and precision
      const technicalTerms = {
        'lighting': 'illumination parameters',
        'colors': 'color palette and chromatic values',
        'style': 'artistic methodology and rendering technique',
        'composition': 'visual arrangement and compositional structure',
        'image': 'visual output with specified technical parameters',
        'create': 'render using advanced algorithms',
        'design': 'engineer with precise specifications'
      };
      
      let technicalText = text;
      Object.entries(technicalTerms).forEach(([simple, technical]) => {
        const regex = new RegExp(`\\b${simple}\\b`, 'gi');
        technicalText = technicalText.replace(regex, technical);
      });
      
      // Add technical precision language
      technicalText = technicalText
        .replace(/\b(good|nice|beautiful)\b/gi, 'optimized')
        .replace(/\b(bright|dark)\b/gi, 'calibrated luminance')
        .replace(/\bwith\b/gi, 'incorporating');
      
      return technicalText;

    default:
      return text;
  }
}

export function composePrompt(parts: ComposeParts): string {
  console.log('🎯 composePrompt called with rewriteStyle:', parts.rewriteStyle);
  const { userText, style, scene, contentSummary, useStyle = true, useScene = true, rewriteStyle } = parts;
  const sections: string[] = [];
  const body = userText?.trim() || "";
  
  // Add subject/content summary with heading and formatting
  if (contentSummary && contentSummary.trim()) {
    let content = contentSummary.trim();
    // Apply rewrite style transformation to content before formatting
    if (rewriteStyle && rewriteStyle !== 'Descriptive') {
      content = applyRewriteStyle(content, rewriteStyle);
    }
    const formattedContent = formatAnalysisText(content);
    sections.push(`Subject: ${formattedContent}`);
  }
  
  // Add scene information with heading and formatting
  if (useScene && scene && scene.trim()) {
    let cleanScene = scene.trim().replace(/^Scene:\s*/i, '');
    // Apply rewrite style transformation to scene before formatting
    if (rewriteStyle && rewriteStyle !== 'Descriptive') {
      cleanScene = applyRewriteStyle(cleanScene, rewriteStyle);
    }
    const formattedScene = formatAnalysisText(cleanScene);
    sections.push(`Scene: ${formattedScene}`);
  }
  
  // Add style information with heading and formatting
  if (useStyle && style && style.trim()) {
    let cleanStyle = style.trim().replace(/^Style:\s*/i, '');
    // Apply rewrite style transformation to style before formatting
    if (rewriteStyle && rewriteStyle !== 'Descriptive') {
      cleanStyle = applyRewriteStyle(cleanStyle, rewriteStyle);
    }
    const formattedStyle = formatAnalysisText(cleanStyle);
    sections.push(`Style: ${formattedStyle}`);
  }
  
  // Create a clean prompt with each category separated by single line breaks
  let finalPrompt = '';
  if (sections.length === 0) {
    finalPrompt = body;
    // Apply rewrite style to body if no sections
    if (rewriteStyle && rewriteStyle !== 'Descriptive') {
      finalPrompt = applyRewriteStyle(finalPrompt, rewriteStyle);
    }
  } else if (body) {
    // If we have a user text body, apply rewrite style to it and append the analysis sections
    let transformedBody = body;
    if (rewriteStyle && rewriteStyle !== 'Descriptive') {
      transformedBody = applyRewriteStyle(body, rewriteStyle);
    }
    finalPrompt = `${transformedBody}\n\n${sections.join('\n')}`;
  } else {
    // If no user text, create a structured prompt with proper spacing between sections
    finalPrompt = sections.join('\n');
  }
  
  return finalPrompt;
}