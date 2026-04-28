import { Octokit } from '@octokit/rest';
import {
  getGitHubToken,
  setGitHubToken,
  getGitHubUser,
  setGitHubUser,
  clearAll,
} from '../config/store.js';

export async function loginWithToken(token: string): Promise<{ username: string; hostname: string }> {
  const octokit = new Octokit({ auth: token });

  const { data } = await octokit.rest.users.getAuthenticated();

  const username = data.login;
  const hostname = 'api.github.com';

  setGitHubToken(token);
  setGitHubUser(username, hostname);

  return { username, hostname };
}

export function logout(): void {
  clearAll();
}

export function getAuthStatus(): { authenticated: boolean; username?: string; hostname?: string } {
  const token = getGitHubToken();
  const user = getGitHubUser();

  if (token && user) {
    return {
      authenticated: true,
      username: user.username,
      hostname: user.hostname,
    };
  }

  return { authenticated: false };
}

export async function requireAuth(): Promise<string> {
  const token = getGitHubToken();
  if (!token) {
    throw new Error(
      'Not authenticated. Run `autopr auth login` to authenticate with GitHub.',
    );
  }
  return token;
}
