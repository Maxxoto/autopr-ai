import OpenAI from "openai";
import { getAIConfig } from "../config/store.js";
import type { ConventionalCommit, CommitType, AIConfig } from "../../types/index.js";

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

let aiClient: OpenAI | null = null;

export function getAIClient(config?: AIConfig): OpenAI {
  if (aiClient) {
    return aiClient;
  }

  const aiConfig = config ?? getAIConfig();
  const apiKey = aiConfig.apiKey || process.env.OPENAI_API_KEY;
  const baseURL =
    aiConfig.baseURL ||
    process.env.OPENAI_BASE_URL ||
    "https://api.openai.com/v1";

  if (!apiKey) {
    throw new Error(
      "OpenAI API key not configured. Set it via `autopr config` or OPENAI_API_KEY env var."
    );
  }

  aiClient = new OpenAI({
    apiKey,
    baseURL,
  });

  return aiClient;
}

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
  const config = getAIConfig();

  try {
    const client = getAIClient(config);
    const model = config.model || "gpt-4o";

    const userParts: string[] = [`Diff:\n${diff}`];
    if (recentCommits && recentCommits.length > 0) {
      userParts.push(
        `\nRecent commits for style reference:\n${recentCommits.join("\n")}`
      );
    }

    const response = await client.chat.completions.create({
      model,
      messages: [
        {
          role: "system",
          content:
            'You are a commit message generator following Conventional Commits v1.0.0. Analyze the diff and generate a commit message. Return ONLY valid JSON: {"type": "feat|fix|...", "scope": "optional", "description": "imperative mood ≤72 chars", "body": "optional detail", "breaking": false}',
        },
        {
          role: "user",
          content: userParts.join("\n"),
        },
      ],
      temperature: 0.3,
      max_tokens: 500,
    });

    const raw = response.choices[0]?.message?.content?.trim() ?? "";
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
