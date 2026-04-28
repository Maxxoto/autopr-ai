import { simpleGit, type SimpleGit } from 'simple-git';

let client: SimpleGit | null = null;

export function getGitClient(cwd?: string): SimpleGit {
  if (!client || cwd) {
    client = simpleGit(cwd ?? process.cwd());
  }
  return client;
}

export async function isGitRepo(cwd?: string): Promise<boolean> {
  try {
    const git = simpleGit(cwd ?? process.cwd());
    return git.checkIsRepo();
  } catch {
    return false;
  }
}

export async function getRepoRoot(cwd?: string): Promise<string> {
  const git = simpleGit(cwd ?? process.cwd());
  const raw = await git.revparse(['--show-toplevel']);
  return raw.trim();
}
