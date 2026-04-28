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
      system: 'You are a friendly code reviewer. Review the PR diff and respond in this format:\n\nIf the code looks good with no issues:\n## LGTM ✅\n\nBrief note on what the change does well (1-2 sentences).\n\nIf there are issues:\n## Issues\n- [issue] — one line per issue, plain language\n\n## Suggestions (only if you have them)\n- [suggestion] — one line per suggestion, plain language\n\nRules:\n- Use plain language, not robotic analysis\n- Focus only on actual code changes, not boilerplate\n- Skip obvious things (like "add tests") unless critical\n- Each issue/suggestion must be one simple, clear sentence\n- No need for detailed explanations unless something is genuinely confusing\n- If code is clean, just say LGTM — no forced feedback\n- Never add filler sections like "Good Practices" or "Summary"',
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

function generateHeuristicReview(diff: string, _prTitle: string): string {
  const lines = diff.split("\n");
  const addedLines = lines.filter((l) => l.startsWith("+") && !l.startsWith("+++"));

  const issues: string[] = [];
  const suggestions: string[] = [];

  // Check for console.log
  const consoleLogCount = addedLines.filter((l) =>
    /console\.log/.test(l)
  ).length;
  if (consoleLogCount > 0) {
    issues.push(`Found ${consoleLogCount} console.log — remove before merge`);
  }

  // Check for hardcoded secrets
  const secretPatterns = addedLines.filter((l) =>
    /password\s*=\s*['"]|api_key\s*=\s*['"]|secret\s*=\s*['"]/i.test(l)
  ).length;
  if (secretPatterns > 0) {
    issues.push("Possible hardcoded secrets — use env variables");
  }

  // Check for TODO/FIXME
  const todoCount = addedLines.filter((l) =>
    /TODO|FIXME|HACK|XXX/i.test(l)
  ).length;
  if (todoCount > 0) {
    suggestions.push(`${todoCount} TODO/FIXME comment(s) — consider resolving`);
  }

  // Check for large diff
  if (addedLines.length > 500) {
    suggestions.push("Large diff — consider splitting into smaller PRs");
  }

  // Build output
  if (issues.length === 0 && suggestions.length === 0) {
    return "## LGTM ✅\n\nCode changes look clean. No issues spotted.";
  }

  const sections: string[] = [];

  if (issues.length > 0) {
    sections.push("## Issues");
    sections.push(...issues.map((i) => `- ${i}`));
    sections.push("");
  }

  if (suggestions.length > 0) {
    sections.push("## Suggestions");
    sections.push(...suggestions.map((s) => `- ${s}`));
    sections.push("");
  }

  return sections.join("\n").trimEnd();
}
