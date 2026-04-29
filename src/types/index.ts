// Shared types for the autopr CLI tool

export type AIProvider = 
  | 'openai' 
  | 'anthropic' 
  | 'deepseek' 
  | 'groq' 
  | 'openrouter' 
  | 'openai-compatible';

export interface AIProviderConfig {
  provider: AIProvider;
  apiKey: string;
  model: string;
  maxTokens?: number;
  baseURL?: string;  // only for 'openai-compatible'
}

export const PROVIDER_DEFAULTS: Record<AIProvider, { 
  model: string; 
  envKey: string;
  label: string;
  costTier: string;
  needsBaseURL: boolean;
}> = {
  openai: {
    model: 'gpt-4o',
    envKey: 'OPENAI_API_KEY',
    label: 'OpenAI (GPT-4o)',
    costTier: '$$$ — Pay-per-use',
    needsBaseURL: false,
  },
  anthropic: {
    model: 'claude-sonnet-4-20250514',
    envKey: 'ANTHROPIC_API_KEY',
    label: 'Anthropic (Claude Sonnet)',
    costTier: '$$$ — Pay-per-use',
    needsBaseURL: false,
  },
  deepseek: {
    model: 'deepseek-chat',
    envKey: 'DEEPSEEK_API_KEY',
    label: 'DeepSeek (DeepSeek Chat)',
    costTier: '$ — Very affordable',
    needsBaseURL: false,
  },
  groq: {
    model: 'openai/gpt-oss-20b',
    envKey: 'GROQ_API_KEY',
    label: 'Groq (GPT-OSS 20B)',
    costTier: 'Free tier available',
    needsBaseURL: false,
  },
  openrouter: {
    model: 'anthropic/claude-sonnet-4-20250514',
    envKey: 'OPENROUTER_API_KEY',
    label: 'OpenRouter (Multi-model)',
    costTier: '$$ — Depends on model',
    needsBaseURL: false,
  },
  'openai-compatible': {
    model: 'llama3',
    envKey: 'OPENAI_COMPAT_API_KEY',
    label: 'OpenAI-Compatible (LiteLLM/Ollama/Custom)',
    costTier: 'Free — Self-hosted',
    needsBaseURL: true,
  },
};

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

export type AIConfig = AIProviderConfig;

export interface GitHubAuth {
  token: string;
  username: string;
  hostname: string;
}

export interface Config {
  github: GitHubAuth;
  ai: AIProviderConfig;
  watchInterval: number;
}
