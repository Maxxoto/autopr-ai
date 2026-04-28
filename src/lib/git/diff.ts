import { getGitClient } from './client.js';
import type { DiffAnalysis } from '../../types/index.js';

export async function getStagedDiff(cwd?: string): Promise<string> {
  const git = getGitClient(cwd);
  return git.diff(['--cached']);
}

export async function getUnstagedDiff(cwd?: string): Promise<string> {
  const git = getGitClient(cwd);
  return git.diff();
}

export async function getBranchDiff(baseBranch: string, cwd?: string): Promise<string> {
  const git = getGitClient(cwd);
  return git.diff([`${baseBranch}...HEAD`]);
}

export function getDiffSummary(diff: string): DiffAnalysis {
  const filesChanged: string[] = [];
  const fileRegex = /^diff --git a\/(.+?) b\/(.+)$/gm;
  let match: RegExpExecArray | null;
  while ((match = fileRegex.exec(diff)) !== null) {
    filesChanged.push(match[2]);
  }

  let additions = 0;
  let deletions = 0;
  for (const line of diff.split('\n')) {
    if (line.startsWith('+') && !line.startsWith('+++')) {
      additions++;
    } else if (line.startsWith('-') && !line.startsWith('---')) {
      deletions++;
    }
  }

  const types = new Set<string>();
  const scopes = new Set<string>();

  for (const file of filesChanged) {
    const lower = file.toLowerCase();

    if (
      lower.includes('.test.') ||
      lower.includes('.spec.') ||
      lower.includes('__tests__/') ||
      lower.includes('tests/') ||
      lower.includes('test/')
    ) {
      types.add('test');
    } else if (lower.endsWith('.md') || lower.endsWith('.txt')) {
      types.add('docs');
    } else if (
      lower.endsWith('.json') ||
      lower.endsWith('.yaml') ||
      lower.endsWith('.yml') ||
      lower.endsWith('.toml') ||
      lower.includes('.config.') ||
      lower.includes('tsconfig') ||
      lower.includes('.eslintrc') ||
      lower.includes('.prettierrc')
    ) {
      types.add('chore');
    } else {
      types.add('feat');
    }

    const topDir = file.split('/')[0];
    if (topDir && topDir !== file) {
      scopes.add(topDir);
    }
  }

  return {
    filesChanged,
    additions,
    deletions,
    types: [...types],
    scopes: [...scopes],
  };
}

export function truncateDiff(diff: string, maxLines: number = 500): string {
  const lines = diff.split('\n');
  if (lines.length <= maxLines) {
    return diff;
  }
  return lines.slice(0, maxLines).join('\n') + '\n... (truncated)';
}

export async function getRecentCommits(count: number = 10, cwd?: string): Promise<string[]> {
  const git = getGitClient(cwd);
  const log = await git.log([`-${count}`]);
  return log.all.map((entry) => entry.message);
}
