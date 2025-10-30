export const BANNED_TOKENS = ["photorealistic","50mm","studio lighting","cinematic","bokeh"] as const;

export type DetailLevel = 'short'|'medium'|'long';

export function sanitizeCaption(input: string, detail: DetailLevel): string {
  let text = (input || '').trim();
  if (!text) return '';
  for (const token of BANNED_TOKENS) {
    const re = new RegExp(token, 'ig');
    text = text.replace(re, '').replace(/\s{2,}/g, ' ').trim();
  }
  // Remove identity claims
  text = text.replace(/\b(\w+\s+){0,2}(man|woman|boy|girl|celebrity|famous|named\s+\w+)\b/gi, (m) => m.toLowerCase().includes('named') ? 'unclear' : m);
  // Trim to detail level
  const sentences = text.split(/(?<=[.!?])\s+/).filter(Boolean);
  if (detail === 'short') return sentences.slice(0, 1).join(' ').trim();
  if (detail === 'medium') return sentences.slice(0, 2).join(' ').trim();
  return sentences.slice(0, 4).join(' ').trim();
}

export function scoreConfidence(caption: string, selfRated?: number): number {
  let score = 0;
  if ((caption || '').length >= 60) score += 0.2;
  const nouns = [/\b(person|book|window|tree|car|dog|cat|building|chair|table|computer|phone|bag|bottle|cup|door|street|house|plant)\b/gi];
  if (nouns.some(re => re.test(caption))) score += 0.3;
  const hasBanned = BANNED_TOKENS.some(t => new RegExp(t, 'i').test(caption));
  if (!hasBanned) score += 0.2;
  if (typeof selfRated === 'number') score += Math.max(0, Math.min(0.2, selfRated * 0.2));
  return Math.max(0, Math.min(1, score));
}

export function detectOCRCue({ imageUrl }: { imageUrl?: string }) {
  if (!imageUrl) return false;
  const cues = ['document','pdf','scan','receipt','invoice','contract','note','handwritten'];
  return cues.some(c => imageUrl.toLowerCase().includes(c));
}

// --- Guardrail helpers (added) ---

const NOUN_HINTS = [
  'person', 'people', 'man', 'woman', 'child',
  'book', 'table', 'chair', 'window', 'door',
  'tree', 'flower', 'sky', 'cloud', 'mountain',
  'car', 'building', 'street', 'room', 'wall',
  'cat', 'dog', 'animal', 'bird', 'water',
];

export function stripBannedTokens(text: string): string {
  let cleaned = text || '';
  for (const token of BANNED_TOKENS) {
    const regex = new RegExp(`\\b${token}\\b`, 'gi');
    cleaned = cleaned.replace(regex, '');
  }
  return cleaned.replace(/\s+/g, ' ').trim();
}

export function hasBannedTokens(text: string): boolean {
  const lower = (text || '').toLowerCase();
  return BANNED_TOKENS.some(token => lower.includes(token.toLowerCase()));
}

export function calculateConfidence(text: string, selfRating?: number): number {
  let score = 0.0;
  if ((text || '').length >= 60) {
    score += 0.2;
  }
  const lower = (text || '').toLowerCase();
  const hasNouns = NOUN_HINTS.some(noun => lower.includes(noun));
  if (hasNouns) {
    score += 0.3;
  }
  if (!hasBannedTokens(text)) {
    score += 0.2;
  }
  if (selfRating !== undefined && selfRating >= 0.7) {
    score += 0.2;
  }
  return Math.min(score, 1.0);
}

export function trimToDetail(text: string, detail: 'short' | 'medium' | 'long'): string {
  const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
  switch (detail) {
    case 'short':
      return sentences.slice(0, 2).join(' ').trim();
    case 'medium':
      return sentences.slice(0, 4).join(' ').trim();
    case 'long':
      return text;
    default:
      return text;
  }
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
  const words = (text || '').toLowerCase().match(/\b[a-z]{3,}\b/g) || [];
  const unique = Array.from(new Set(words));
  return unique.slice(0, 15);
}