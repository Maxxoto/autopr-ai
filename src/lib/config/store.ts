import Conf from 'conf';
import type { AIConfig } from '../../types/index.js';

type ConfigSchema = {
  github: {
    token?: string;
    username?: string;
    hostname?: string;
  };
  ai: {
    baseURL?: string;
    apiKey?: string;
    model?: string;
    maxTokens?: number;
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

export function getAIConfig(): AIConfig {
  const config = getConfig();
  return {
    apiKey: config.get('ai.apiKey') ?? process.env.OPENAI_API_KEY ?? '',
    baseURL: config.get('ai.baseURL') ?? process.env.OPENAI_BASE_URL ?? 'https://api.openai.com/v1',
    model: config.get('ai.model') ?? process.env.OPENAI_MODEL ?? 'gpt-4',
    maxTokens: config.get('ai.maxTokens') ?? 4096,
  };
}

export function setAIConfig(partial: Partial<AIConfig>): void {
  const config = getConfig();
  if (partial.apiKey !== undefined) config.set('ai.apiKey', partial.apiKey);
  if (partial.baseURL !== undefined) config.set('ai.baseURL', partial.baseURL);
  if (partial.model !== undefined) config.set('ai.model', partial.model);
  if (partial.maxTokens !== undefined) config.set('ai.maxTokens', partial.maxTokens);
}

export function getWatchInterval(): number {
  return getConfig().get('watchInterval') ?? 60;
}

export function isAuthenticated(): boolean {
  return typeof getGitHubToken() === 'string' && getGitHubToken()!.length > 0;
}

export function clearAll(): void {
  getConfig().clear();
}
