import { Octokit } from '@octokit/rest';
import { requireAuth } from './auth.js';

export function createOctokit(token: string): Octokit {
  return new Octokit({
    auth: token,
    userAgent: 'autopr-cli/0.1.0',
    baseUrl: 'https://api.github.com',
  });
}

let cachedClient: Octokit | null = null;

export async function getClient(): Promise<Octokit> {
  if (cachedClient) {
    return cachedClient;
  }

  const token = await requireAuth();
  cachedClient = createOctokit(token);
  return cachedClient;
}

export type { Octokit };
