import { config } from './config';

export type Alias = 'flash' | 'pro' | 'flash-8b';
export type Mode = 'fast' | 'quality';
export type ModelTier = 'flash' | 'pro' | 'flash-8b';

const REGISTRY = {
  flash: ['gemini-2.5-flash', 'gemini-2.5-flash-lite', 'gemini-2.0-flash', 'gemini-1.5-flash'],
  pro: ['gemini-2.5-pro', 'gemini-2.0-flash', 'gemini-1.5-pro'],
  'flash-8b': ['gemini-2.5-flash-lite', 'gemini-1.5-flash-8b'],
} as const;

function preferredMajors(): string[] {
  const pref = String(config.preferredMajor || '2.5');
  const majors = ['2.5', '2.0', '1.5'];
  const idx = majors.indexOf(pref);
  if (idx === -1) return majors;
  return majors.slice(idx).concat(majors.slice(0, idx));
}

export function resolveAlias(alias: Alias): string {
  const majors = preferredMajors();
  const candidates = REGISTRY[alias];
  for (const m of majors) {
    const found = candidates.find(c => c.includes(`gemini-${m}`));
    if (found) return found;
  }
  return candidates[0];
}

export function resolvePrimaryFallback() {
  const primaryAlias = (config.geminiPrimary || 'flash') as Alias;
  const fallbackAlias = (config.geminiFallback || 'pro') as Alias;
  const primary = resolveAlias(primaryAlias);
  const fallback = resolveAlias(fallbackAlias);
  return { primary, fallback };
}

export function resolveModel(tier: ModelTier): string {
  const candidates = REGISTRY[tier];
  const preferredMajor = String(config.preferredMajor || '2.5');
  const preferred = candidates.find(m => m.includes(preferredMajor));
  return preferred || candidates[0];
}

export function getPrimaryModel(): string {
  return resolveModel(config.geminiPrimary as ModelTier);
}

export function getFallbackModel(): string {
  return resolveModel(config.geminiFallback as ModelTier);
}

export function shouldUseABTest(): boolean {
  return Math.random() < (config.abRatio || 0);
}

export function chooseModelByPolicy(
  mode: Mode,
  opts: { detail?: 'short'|'medium'|'long'; ocrHint?: boolean; abRatio?: number; shadow?: boolean }
) {
  const { primary, fallback } = resolvePrimaryFallback();
  const abRatio = typeof opts.abRatio === 'number' ? opts.abRatio : (config.abRatio || 0);
  let chosen = primary;
  if (opts.detail === 'long' || opts.ocrHint) chosen = fallback;
  else if (mode === 'quality' && abRatio > 0) { if (Math.random() < abRatio) chosen = fallback; }
  if (mode === 'fast') chosen = primary;
  const shadowDefault = typeof opts.shadow === 'boolean' ? opts.shadow : !!config.shadowMode;
  return { chosen, fallback, shadow: shadowDefault };
}