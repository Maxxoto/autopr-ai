import { callAI } from "../ai/registry.js";
import { getClient } from "./client.js";
import type { PRInfo, ReviewInfo } from "../../types/index.js";

function mapPRFromGithub(data: {
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

export async function getReviewRequests(username: string): Promise<PRInfo[]> {
  const octokit = await getClient();

  const searchResponse = await octokit.rest.search.issuesAndPullRequests({
    q: `is:pr is:open review-requested:${username}`,
  });

  const items = searchResponse.data.items;
  const prInfos: PRInfo[] = [];

  for (const item of items) {
    const repoUrlParts = item.repository_url?.split("/");
    if (!repoUrlParts || repoUrlParts.length < 2) continue;

    const owner = repoUrlParts[repoUrlParts.length - 2];
    const repo = repoUrlParts[repoUrlParts.length - 1];

    if (!owner || !repo) continue;

    try {
      const { data: prData } = await octokit.rest.pulls.get({
        owner,
        repo,
        pull_number: item.number,
      });

      prInfos.push(mapPRFromGithub(prData));
    } catch {
      // Skip PRs we can't access
      continue;
    }
  }

  return prInfos;
}

export async function getPRReviews(options: {
  owner: string;
  repo: string;
  pullNumber: number;
}): Promise<ReviewInfo[]> {
  const octokit = await getClient();

  const response = await octokit.rest.pulls.listReviews({
    owner: options.owner,
    repo: options.repo,
    pull_number: options.pullNumber,
  });

  return response.data.map((review) => ({
    id: review.id,
    prNumber: options.pullNumber,
    state: (review.state ?? "COMMENTED") as ReviewInfo["state"],
    body: review.body ?? "",
    author: review.user?.login ?? "unknown",
    submitted_at: review.submitted_at ?? "",
  }));
}

export async function generateAIReview(
  diff: string,
  prTitle: string
): Promise<string> {
  try {
    const truncatedDiff = diff.slice(0, 16000);

    const review = await callAI({
      system: 'You are a senior code reviewer. Analyze the following PR diff and provide a structured review.',
      user: `PR Title: ${prTitle}\n\nDiff:\n${truncatedDiff}`,
      temperature: 0.2,
    });

    if (!review) {
      return generateHeuristicReview(diff, prTitle);
    }

    return review;
  } catch {
    return generateHeuristicReview(diff, prTitle);
  }
}

function generateHeuristicReview(diff: string, prTitle: string): string {
  const sections: string[] = [
    `# Code Review: ${prTitle}`,
    "",
  ];

  const lines = diff.split("\n");
  const addedLines = lines.filter((l) => l.startsWith("+") && !l.startsWith("+++"));
  const removedLines = lines.filter((l) => l.startsWith("-") && !l.startsWith("---"));

  // Check for potential issues
  const issues: string[] = [];
  const suggestions: string[] = [];
  const good: string[] = [];

  // Check for console.log
  const consoleLogCount = addedLines.filter((l) =>
    /console\.log/.test(l)
  ).length;
  if (consoleLogCount > 0) {
    issues.push(
      `- Found ${consoleLogCount} \`console.log\` statement(s) — consider removing before merge`
    );
  }

  // Check for TODO/FIXME
  const todoCount = addedLines.filter((l) =>
    /TODO|FIXME|HACK|XXX/i.test(l)
  ).length;
  if (todoCount > 0) {
    suggestions.push(
      `- Found ${todoCount} TODO/FIXME comment(s) — consider addressing or creating issues`
    );
  }

  // Check for hardcoded secrets
  const secretPatterns = addedLines.filter((l) =>
    /password\s*=\s*['"]|api_key\s*=\s*['"]|secret\s*=\s*['"]/i.test(l)
  ).length;
  if (secretPatterns > 0) {
    issues.push(
      `- **Possible hardcoded secrets detected** — use environment variables instead`
    );
  }

  // Check for large diff
  if (addedLines.length > 500) {
    suggestions.push(
      `- Large diff (${addedLines.length} additions) — consider splitting into smaller PRs`
    );
  }

  // Good practices
  if (addedLines.length > 0 && removedLines.length === 0 && consoleLogCount === 0) {
    good.push("- Clean additions without removals suggests additive change");
  }

  if (issues.length === 0 && secretPatterns === 0) {
    good.push("- No critical issues detected in the diff");
  }

  if (addedLines.some((l) => /test|spec/i.test(l))) {
    good.push("- Test coverage included");
  }

  // Build output
  sections.push("## 🔴 Critical", "");
  if (issues.length > 0) {
    sections.push(...issues);
  } else {
    sections.push("No critical issues found.");
  }

  sections.push("", "## 🟡 Suggestions", "");
  if (suggestions.length > 0) {
    sections.push(...suggestions);
  } else {
    sections.push("No suggestions at this time.");
  }

  sections.push("", "## 🟢 Good Practices", "");
  if (good.length > 0) {
    sections.push(...good);
  } else {
    sections.push("Code changes look reasonable.");
  }

  sections.push(
    "",
    "---",
    "*Review generated automatically. Please verify findings manually.*"
  );

  return sections.join("\n");
}
