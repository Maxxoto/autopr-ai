import { callAI } from "./registry.js";
import type { ConventionalCommit, CommitType } from "../../types/index.js";

const VALID_COMMIT_TYPES: readonly string[] = [
  "feat",
  "fix",
  "docs",
  "style",
  "refactor",
  "perf",
  "test",
  "build",
  "ci",
  "chore",
  "revert",
] as const;

function isValidCommitType(value: string): value is CommitType {
  return VALID_COMMIT_TYPES.includes(value);
}

function heuristicCommitType(diff: string): CommitType {
  const lower = diff.toLowerCase();

  if (/test|spec|\.test\.|\.spec\./i.test(diff)) return "test";
  if (/\.md$|readme|changelog|docs/i.test(diff)) return "docs";
  if (/package\.json|tsconfig|\.yml$|\.yaml$|dockerfile|makefile/i.test(diff))
    return "ci";
  if (
    /import |export |function |class |interface |const |=>/i.test(diff) &&
    !/fix|bug|issue/i.test(lower)
  )
    return "feat";
  if (/fix|bug|issue|patch|resolve/i.test(lower)) return "fix";

  return "chore";
}

export async function generateCommitMessage(
  diff: string,
  recentCommits?: string[]
): Promise<ConventionalCommit> {
  try {
    const userParts: string[] = [`Diff:\n${diff}`];
    if (recentCommits && recentCommits.length > 0) {
      userParts.push(
        `\nRecent commits for style reference:\n${recentCommits.join("\n")}`
      );
    }

    const raw = await callAI({
      system: 'You are a commit message generator following Conventional Commits v1.0.0. Analyze the diff and generate a commit message. Return ONLY valid JSON: {"type": "feat|fix|...", "scope": "optional", "description": "imperative mood ≤72 chars", "body": "optional detail", "breaking": false}',
      user: userParts.join('\n'),
      temperature: 0.3,
    });

    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("No JSON object found in AI response");
    }

    const parsed: Record<string, unknown> = JSON.parse(jsonMatch[0]);

    const type = String(parsed.type ?? "");
    if (!isValidCommitType(type)) {
      throw new Error(`Invalid commit type from AI: ${type}`);
    }

    const commit: ConventionalCommit = {
      type,
      description: String(parsed.description ?? "").slice(0, 72),
      breaking: Boolean(parsed.breaking),
    };

    if (parsed.scope) {
      commit.scope = String(parsed.scope);
    }
    if (parsed.body) {
      commit.body = String(parsed.body);
    }

    return commit;
  } catch {
    const type = heuristicCommitType(diff);
    const filesChanged = diff.match(/^---\s+a\/(.+)$/gm) ?? [];
    const fileSummary =
      filesChanged.length > 0
        ? `update ${filesChanged.length} file(s)`
        : "update files";

    return {
      type,
      description: fileSummary.slice(0, 72),
      breaking: false,
    };
  }
}

export function formatCommitMessage(commit: ConventionalCommit): string {
  const scope = commit.scope ? `(${commit.scope})` : "";
  const breaking = commit.breaking ? "!" : "";
  const header = `${commit.type}${scope}${breaking}: ${commit.description}`;

  if (commit.body) {
    return `${header}\n\n${commit.body}`;
  }

  return header;
}
