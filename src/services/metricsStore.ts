import type { RequestContext } from '../types/api';

interface MetricsStore {
  requests: RequestContext[];
  addRequest: (context: RequestContext) => void;
  getMetrics: () => any;
  clear: () => void;
}

class InMemoryMetricsStore implements MetricsStore {
  public requests: RequestContext[] = [];

  addRequest(context: RequestContext): void {
    this.requests.push(context);
    
    // Keep only last 1000 requests to prevent memory issues
    if (this.requests.length > 1000) {
      this.requests = this.requests.slice(-1000);
    }
  }

  getMetrics() {
    const total = this.requests.length;
    const successful = this.requests.filter(r => !r.error).length;
    const withFallback = this.requests.filter(r => r.fallback_used).length;
    const withShadow = this.requests.filter(r => r.shadow_ran).length;
    
    const avgLatency = total > 0 
      ? this.requests.reduce((sum, r) => sum + r.latency_ms, 0) / total 
      : 0;
    
    const avgConfidence = this.requests
      .filter(r => r.confidence !== undefined)
      .reduce((sum, r, _, arr) => sum + (r.confidence || 0) / arr.length, 0);

    const abOutcomes = this.requests.reduce(
      (acc, r) => {
        if (r.chosen_model?.includes('flash')) acc.flash_count++;
        if (r.chosen_model?.includes('pro')) acc.pro_count++;
        return acc;
      },
      { flash_count: 0, pro_count: 0 }
    );

    return {
      total_requests: total,
      success_count: successful,
      error_count: total - successful,
      success_rate: total > 0 ? successful / total : 0,
      fallback_rate: total > 0 ? withFallback / total : 0,
      avg_latency_ms: avgLatency,
      avg_confidence: avgConfidence,
      ab_outcomes: abOutcomes,
      shadow_comparisons: withShadow
    };
  }

  clear(): void {
    this.requests = [];
  }
}

export const metricsStore = new InMemoryMetricsStore();