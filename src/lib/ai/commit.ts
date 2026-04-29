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
      system: [
        'You are a commit message generator following Conventional Commits v1.0.0.',
        'Analyze the diff and generate a commit message.',
        '',
        'CRITICAL RULES:',
        '- description MUST be imperative mood (as if giving an order): "add", "fix", "remove", "update", NOT "adding", "fixing", "removed", "updates", "improvement", "reporting"',
        '- Valid types: feat, fix, docs, style, refactor, perf, test, build, ci, chore, revert',
        '- description ≤72 chars, no period at end',
        '- scope is optional, omit if unclear',
        '',
        'GOOD examples:',
        '- {"type":"fix","description":"report correct status code in error handler"}',
        '- {"type":"feat","description":"add pagination to user list endpoint"}',
        '- {"type":"chore","description":"improve performance of database queries"}',
        '- {"type":"revert","description":"revert database migration"}',
        '- {"type":"docs","description":"update installation instructions"}',
        '',
        'BAD examples (DO NOT generate these):',
        '- {"type":"fix","description":"reporting abc"} ← "reporting" is NOT imperative',
        '- {"type":"chore","description":"improvement performance"} ← "improvement" is NOT imperative',
        '- {"type":"feat","description":"added new feature"} ← "added" is past tense, NOT imperative',
        '',
        'Return ONLY valid JSON: {"type":"feat|fix|...","scope":"optional","description":"imperative mood ≤72 chars","body":"optional detail","breaking":false}',
      ].join('\n'),
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
