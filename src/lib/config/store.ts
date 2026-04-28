import Conf from 'conf';
import type { AIProviderConfig, AIProvider } from '../../types/index.js';
import { PROVIDER_DEFAULTS } from '../../types/index.js';

type ConfigSchema = {
  github: {
    token?: string;
    username?: string;
    hostname?: string;
  };
  ai: {
    provider?: string;
    apiKey?: string;
    model?: string;
    maxTokens?: number;
    baseURL?: string;
  };
  watchInterval?: number;
};

let configInstance: Conf<ConfigSchema> | null = null;

export function getConfig(): Conf<ConfigSchema> {
  if (!configInstance) {
    configInstance = new Conf<ConfigSchema>({
      projectName: 'autopr',
      defaults: {
        github: {},
        ai: {},
        watchInterval: 60,
      },
    });
  }
  return configInstance;
}

export function getGitHubToken(): string | undefined {
  return getConfig().get('github.token');
}

export function setGitHubToken(token: string): void {
  getConfig().set('github.token', token);
}

export function getGitHubUser(): { username: string; hostname: string } | undefined {
  const config = getConfig();
  const username = config.get('github.username');
  const hostname = config.get('github.hostname');
  if (username && hostname) {
    return { username, hostname };
  }
  return undefined;
}

export function setGitHubUser(username: string, hostname: string): void {
  const config = getConfig();
  config.set('github.username', username);
  config.set('github.hostname', hostname);
}

export function getAIConfig(): AIProviderConfig {
  const config = getConfig();
  const provider = (config.get('ai.provider') as AIProvider) || '';

  if (!provider) {
    const baseURL = config.get('ai.baseURL') || process.env.OPENAI_BASE_URL;
    const apiKey = config.get('ai.apiKey') || process.env.OPENAI_API_KEY;
    if (baseURL || apiKey) {
      return {
        provider: 'openai-compatible',
        apiKey: apiKey || '',
        model: config.get('ai.model') || process.env.OPENAI_MODEL || 'gpt-4',
        maxTokens: config.get('ai.maxTokens') ?? 4096,
        baseURL: baseURL || 'https://api.openai.com/v1',
      };
    }
  }

  const defaults = provider ? PROVIDER_DEFAULTS[provider as keyof typeof PROVIDER_DEFAULTS] : undefined;
  const envKey = defaults?.envKey || 'OPENAI_API_KEY';

  return {
    provider: (provider || 'openai') as AIProvider,
    apiKey: config.get('ai.apiKey') || process.env[envKey] || process.env.OPENAI_API_KEY || '',
    model: config.get('ai.model') || defaults?.model || process.env.OPENAI_MODEL || 'gpt-4o',
    maxTokens: config.get('ai.maxTokens') ?? 4096,
    ...(config.get('ai.baseURL') ? { baseURL: config.get('ai.baseURL') } : {}),
  };
}

export function setAIConfig(partial: Partial<AIProviderConfig>): void {
  const config = getConfig();
  if (partial.provider !== undefined) config.set('ai.provider', partial.provider);
  if (partial.apiKey !== undefined) config.set('ai.apiKey', partial.apiKey);
  if (partial.model !== undefined) config.set('ai.model', partial.model);
  if (partial.maxTokens !== undefined) config.set('ai.maxTokens', partial.maxTokens);
  if (partial.baseURL !== undefined) config.set('ai.baseURL', partial.baseURL);
}

export function getWatchInterval(): number {
  return getConfig().get('watchInterval') ?? 60;
}

export function isAuthenticated(): boolean {
  return typeof getGitHubToken() === 'string' && getGitHubToken()!.length > 0;
}

export function isAIConfigured(): boolean {
  const config = getConfig();
  const provider = config.get('ai.provider');
  const apiKey = config.get('ai.apiKey');
  return !!(provider && apiKey);
}

export function isConfigured(): boolean {
  return isAuthenticated() && isAIConfigured();
}

export function clearAll(): void {
  getConfig().clear();
}
