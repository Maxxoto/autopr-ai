import { generateText } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { createAnthropic } from '@ai-sdk/anthropic';
import { createDeepSeek } from '@ai-sdk/deepseek';
import { createGroq } from '@ai-sdk/groq';
import { createOpenRouter } from '@openrouter/ai-sdk-provider';
import { getAIConfig } from '../config/store.js';
import type { AIProviderConfig } from '../../types/index.js';

interface CallAIOptions {
  system: string;
  user: string;
  temperature?: number;
  maxTokens?: number;
}

type AIModel = ReturnType<ReturnType<typeof createOpenAI>>;

function buildProvider(config: AIProviderConfig) {
  switch (config.provider) {
    case 'openai':
      return createOpenAI({ apiKey: config.apiKey }) as unknown as ReturnType<typeof createOpenAI>;
    case 'anthropic':
      return createAnthropic({ apiKey: config.apiKey }) as unknown as ReturnType<typeof createOpenAI>;
    case 'deepseek':
      return createDeepSeek({ apiKey: config.apiKey }) as unknown as ReturnType<typeof createOpenAI>;
    case 'groq':
      return createGroq({ apiKey: config.apiKey }) as unknown as ReturnType<typeof createOpenAI>;
    case 'openrouter':
      return createOpenRouter({ apiKey: config.apiKey }) as unknown as ReturnType<typeof createOpenAI>;
    case 'openai-compatible':
      return createOpenAI({
        apiKey: config.apiKey || 'dummy',
        baseURL: config.baseURL || 'http://localhost:11434/v1',
      }) as unknown as ReturnType<typeof createOpenAI>;
    default:
      return createOpenAI({ apiKey: config.apiKey }) as unknown as ReturnType<typeof createOpenAI>;
  }
}

function getAIModel(): AIModel {
  const config = getAIConfig();
  const provider = buildProvider(config);
  return provider(config.model);
}

export async function callAI(opts: CallAIOptions): Promise<string> {
  const model = getAIModel();
  const { text } = await generateText({
    model,
    messages: [
      { role: 'system', content: opts.system },
      { role: 'user', content: opts.user },
    ],
    temperature: opts.temperature ?? 0.3,
    maxOutputTokens: opts.maxTokens ?? 1000,
  });
  return text;
}