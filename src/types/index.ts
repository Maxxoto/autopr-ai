// Shared types for the autopr CLI tool

export const COMMIT_TYPES = [
  'feat',
  'fix',
  'docs',
  'style',
  'refactor',
  'perf',
  'test',
  'build',
  'ci',
  'chore',
  'revert',
] as const;

export type CommitType = (typeof COMMIT_TYPES)[number];

export interface ConventionalCommit {
  type: CommitType;
  scope?: string;
  description: string;
  body?: string;
  breaking: boolean;
}

export interface DiffAnalysis {
  filesChanged: string[];
  additions: number;
  deletions: number;
  types: string[];
  scopes: string[];
}

export interface PRInfo {
  number: number;
  title: string;
  html_url: string;
  state: string;
  body: string | null;
  head: { ref: string };
  base: { ref: string };
  author: string;
  created_at: string;
  draft?: boolean;
  requested_reviewers: string[];
}

export interface ReviewInfo {
  id: number;
  prNumber: number;
  state: 'PENDING' | 'APPROVED' | 'CHANGES_REQUESTED' | 'COMMENTED' | 'DISMISSED';
  body: string;
  author: string;
  submitted_at: string;
}

export interface RepoContext {
  owner: string;
  repo: string;
  branch: string;
  remoteUrl: string;
  isClean: boolean;
  staged: string[];
  modified: string[];
  untracked: string[];
  ahead: number;
  behind: number;
  defaultBranch: string;
}

export interface AIConfig {
  baseURL: string;
  apiKey: string;
  model: string;
  maxTokens: number;
}

export interface GitHubAuth {
  token: string;
  username: string;
  hostname: string;
}

export interface Config {
  github: GitHubAuth;
  ai: AIConfig;
  watchInterval: number;
}
