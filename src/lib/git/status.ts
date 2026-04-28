import { getGitClient } from './client.js';
import type { RepoContext } from '../../types/index.js';

function parseRemoteUrl(remoteUrl: string): { owner: string; repo: string } {
  // Handle https://github.com/owner/repo.git
  const httpsMatch = remoteUrl.match(/github\.com[:/]([^/]+)\/([^/]+?)(?:\.git)?$/);
  if (httpsMatch) {
    return { owner: httpsMatch[1], repo: httpsMatch[2] };
  }
  throw new Error(`Could not parse owner/repo from remote URL: ${remoteUrl}`);
}

async function getDefaultBranch(cwd?: string): Promise<string> {
  const git = getGitClient(cwd);
  try {
    const ref = await git.revparse(['--abbrev-ref', 'origin/HEAD']);
    const trimmed = ref.trim();
    // origin/HEAD → origin/main, extract just "main"
    const branch = trimmed.replace(/^origin\//, '');
    return branch || 'main';
  } catch {
    return 'main';
  }
}

export async function getRepoContext(cwd?: string): Promise<RepoContext> {
  const git = getGitClient(cwd);

  const [status, remotes, defaultBranch] = await Promise.all([
    git.status(),
    git.getRemotes(true),
    getDefaultBranch(cwd),
  ]);

  const origin = remotes.find((r) => r.name === 'origin');
  const remoteUrl = origin?.refs?.fetch ?? '';

  let owner = '';
  let repo = '';
  if (remoteUrl) {
    const parsed = parseRemoteUrl(remoteUrl);
    owner = parsed.owner;
    repo = parsed.repo;
  }

  return {
    owner,
    repo,
    branch: status.current ?? '',
    remoteUrl,
    isClean: status.isClean(),
    staged: status.staged,
    modified: status.modified,
    untracked: status.not_added,
    ahead: status.ahead,
    behind: status.behind,
    defaultBranch,
  };
}
