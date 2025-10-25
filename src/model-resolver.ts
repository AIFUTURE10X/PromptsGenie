import { resolveAlias, resolvePrimaryFallback, getPrimaryModel as getModelPrimary, getFallbackModel as getModelFallback, shouldUseABTest as shouldABTest } from './models';

export function getPrimaryModel(): string {
  return getModelPrimary();
}

export function getFallbackModel(): string {
  return getModelFallback();
}

export function shouldUseABTest(): boolean {
  return shouldABTest();
}

export { resolveAlias, resolvePrimaryFallback };