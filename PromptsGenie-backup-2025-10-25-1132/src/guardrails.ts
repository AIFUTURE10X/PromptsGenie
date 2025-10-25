import { sanitizeCaption } from './quality';

export function trimToDetail(text: string, detail: 'short' | 'medium' | 'long'): string {
  const sanitized = sanitizeCaption(text);
  
  if (detail === 'short') {
    // Keep first 2 sentences
    const sentences = sanitized.split(/[.!?]+/).filter(s => s.trim());
    return sentences.slice(0, 2).join('. ').trim() + (sentences.length > 2 ? '.' : '');
  } else if (detail === 'medium') {
    // Keep first 4 sentences
    const sentences = sanitized.split(/[.!?]+/).filter(s => s.trim());
    return sentences.slice(0, 4).join('. ').trim() + (sentences.length > 4 ? '.' : '');
  }
  
  // For 'long', return as-is (already sanitized)
  return sanitized;
}

export function extractObjects(text: string): Array<{ name: string; count: number }> {
  const patterns = [
    /(\d+)\s+([a-z]+s?)/gi,
    /(a|an|the|some)\s+([a-z]+)/gi,
  ];

  const found = new Map<string, number>();

  for (const pattern of patterns) {
    const matches = text.matchAll(pattern);
    for (const match of matches) {
      const count = /\d+/.test(match[1]) ? parseInt(match[1], 10) : 1;
      const name = match[2].toLowerCase();
      found.set(name, (found.get(name) || 0) + count);
    }
  }

  return Array.from(found.entries())
    .map(([name, count]) => ({ name, count }))
    .slice(0, 10);
}

export function extractTags(text: string): string[] {
  const banned = new Set(["photorealistic","50mm","studio lighting","cinematic","bokeh"]);
  const list = text.split(/[,;\n]/g)
    .map(t => t.trim().toLowerCase().replace(/\s+/g, "_"))
    .filter(t => t && !banned.has(t));
  return Array.from(new Set(list)).slice(0, 10);
}