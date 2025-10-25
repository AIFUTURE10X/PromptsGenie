import { PromptToTextInput, PromptToTextResponse } from '../types/api';
import { config } from '../config';
import { logger } from '../logger';
import { getPrimaryModel, getFallbackModel } from '../model-resolver';
import { callGemini } from './geminiClient';
import { getPromptRefineSystemPrompt, getPromptEvaluateSystemPrompt, getPromptSimplifySystemPrompt } from '../prompts';
import { metricsStore } from '../metrics';
import { randomUUID } from 'crypto';

export async function promptToText(
  input: PromptToTextInput,
  headers: Record<string, string>
): Promise<PromptToTextResponse> {
  const traceId = randomUUID();
  const startTime = Date.now();
  
  const mode = headers['x-analyze-mode'] as 'fast' | 'quality' || input.mode || 'fast';
  const model = mode === 'fast' ? getPrimaryModel() : getFallbackModel();
  const timeout = mode === 'fast' ? config.timeoutMsFast : config.timeoutMsQuality;

  let systemPrompt: string;
  let userPrompt: string;

  switch (input.task) {
    case 'refine':
      systemPrompt = getPromptRefineSystemPrompt();
      userPrompt = `Prompt to refine: ${input.prompt}`;
      if (input.target_length) {
        userPrompt += `\nTarget length: approximately ${input.target_length} characters`;
      }
      break;
    
    case 'evaluate':
      systemPrompt = getPromptEvaluateSystemPrompt();
      userPrompt = `Prompt to evaluate: ${input.prompt}`;
      break;
    
    case 'simplify':
      systemPrompt = getPromptSimplifySystemPrompt();
      userPrompt = `Prompt to simplify: ${input.prompt}`;
      if (input.target_length) {
        userPrompt += `\nTarget length: approximately ${input.target_length} characters`;
      }
      break;
  }

  const fullPrompt = `${systemPrompt}\n\n${userPrompt}`;

  try {
    const result = await callGemini({
      model,
      prompt: fullPrompt,
      timeout,
    });

    let score = 0.8; // Default score
    let suggestions: string[] = [];
    let resultText = result.text;

    // Parse evaluation response
    if (input.task === 'evaluate') {
      const scoreMatch = result.text.match(/score:?\s*(0?\.\d+|1\.0)/i);
      if (scoreMatch) {
        score = parseFloat(scoreMatch[1]);
      }

      const suggestionLines = result.text
        .split('\n')
        .filter(line => line.trim().startsWith('-') || line.trim().startsWith('•'))
        .map(line => line.replace(/^[-•]\s*/, '').trim());
      
      suggestions = suggestionLines.slice(0, 5);
    }

    const latency = Date.now() - startTime;

    metricsStore.addRequest({
      trace_id: traceId,
      endpoint: '/prompt-to-text',
      mode,
      chosen_model: model,
      used_model: model,
      fallback_used: false,
      shadow_ran: false,
      latency_ms: latency,
    });

    logger.info({ trace_id: traceId, model, latency, task: input.task }, 'Prompt-to-text complete');

    return {
      result: resultText,
      score,
      suggestions,
    };
  } catch (error: any) {
    const latency = Date.now() - startTime;
    
    metricsStore.addRequest({
      trace_id: traceId,
      endpoint: '/prompt-to-text',
      mode,
      chosen_model: model,
      fallback_used: false,
      shadow_ran: false,
      latency_ms: latency,
      error: error.message,
    });

    logger.error({ trace_id: traceId, error: error.message }, 'Prompt-to-text failed');
    throw error;
  }
}