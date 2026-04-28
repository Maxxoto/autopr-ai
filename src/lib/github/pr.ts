import { getClient } from "./client.js";
import type { PRInfo } from "../../types/index.js";

function extractPRInfo(data: {
  number: number;
  title: string;
  html_url: string;
  state: string;
  body: string | null;
  head: { ref: string };
  base: { ref: string };
  user: { login: string } | null;
  created_at: string;
  draft?: boolean | null;
  requested_reviewers?: Array<{ login: string }> | null;
}): PRInfo {
  return {
    number: data.number,
    title: data.title,
    html_url: data.html_url,
    state: data.state,
    body: data.body,
    head: { ref: data.head.ref },
    base: { ref: data.base.ref },
    author: data.user?.login ?? "unknown",
    created_at: data.created_at,
    draft: data.draft ?? false,
    requested_reviewers: (data.requested_reviewers ?? []).map((r) => r.login),
  };
}

export async function createPR(options: {
  owner: string;
  repo: string;
  title: string;
  body: string;
  head: string;
  base: string;
  draft?: boolean;
}): Promise<PRInfo> {
  const octokit = await getClient();

  const { data } = await octokit.rest.pulls.create({
    owner: options.owner,
    repo: options.repo,
    title: options.title,
    body: options.body,
    head: options.head,
    base: options.base,
    draft: options.draft,
  });

  return extractPRInfo(data);
}

export async function listPRs(options: {
  owner: string;
  repo: string;
  state?: "open" | "closed" | "all";
}): Promise<PRInfo[]> {
  const octokit = await getClient();

  const { data } = await octokit.rest.pulls.list({
    owner: options.owner,
    repo: options.repo,
    state: options.state ?? "open",
  });

  return data.map((item) => extractPRInfo(item));
}

export async function getPR(options: {
  owner: string;
  repo: string;
  pullNumber: number;
}): Promise<PRInfo> {
  const octokit = await getClient();

  const { data } = await octokit.rest.pulls.get({
    owner: options.owner,
    repo: options.repo,
    pull_number: options.pullNumber,
  });

  return extractPRInfo(data);
}

export async function getPRDiff(options: {
  owner: string;
  repo: string;
  pullNumber: number;
}): Promise<string> {
  const octokit = await getClient();

  const response = await octokit.rest.pulls.get({
    owner: options.owner,
    repo: options.repo,
    pull_number: options.pullNumber,
    mediaType: {
      format: "diff",
    },
  });

  return response.data as unknown as string;
}

export async function getDefaultBranch(options: {
  owner: string;
  repo: string;
}): Promise<string> {
  const octokit = await getClient();

  const { data } = await octokit.rest.repos.get({
    owner: options.owner,
    repo: options.repo,
  });

  return data.default_branch;
}

export async function findPRForBranch(options: {
  owner: string;
  repo: string;
  branch: string;
}): Promise<PRInfo | null> {
  const octokit = await getClient();

  const { data } = await octokit.rest.pulls.list({
    owner: options.owner,
    repo: options.repo,
    head: `${options.owner}:${options.branch}`,
    state: "open",
  });

  if (data.length === 0) {
    return null;
  }

  return extractPRInfo(data[0]);
}
