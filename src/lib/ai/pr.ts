import OpenAI from "openai";
import { getAIConfig } from "../config/store.js";
import type { AIConfig } from "../../types/index.js";

let aiClient: OpenAI | null = null;

function getClient(config?: AIConfig): OpenAI {
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

export async function generatePRTitle(
  diff: string,
  commits: string[]
): Promise<string> {
  const config = getAIConfig();

  try {
    const client = getClient(config);
    const model = config.model || "gpt-4o";

    const userContent = [
      `Commits:\n${commits.join("\n")}`,
      `\nDiff:\n${diff.slice(0, 8000)}`,
    ].join("\n");

    const response = await client.chat.completions.create({
      model,
      messages: [
        {
          role: "system",
          content:
            "Generate a concise PR title (≤72 chars, imperative mood) from these changes. Return ONLY the title, no quotes.",
        },
        {
          role: "user",
          content: userContent,
        },
      ],
      temperature: 0.3,
      max_tokens: 100,
    });

    const title = response.choices[0]?.message?.content?.trim() ?? "";
    if (!title) {
      throw new Error("Empty title from AI");
    }

    return title.slice(0, 72);
  } catch {
    // Fallback: use first commit message as title
    if (commits.length > 0) {
      const firstLine = commits[0].split("\n")[0] ?? "Update files";
      return firstLine.slice(0, 72);
    }
    return "Update files";
  }
}

export async function generatePRDescription(
  diff: string,
  commits: string[]
): Promise<string> {
  const config = getAIConfig();

  try {
    const client = getClient(config);
    const model = config.model || "gpt-4o";

    const userContent = [
      `Commits:\n${commits.join("\n")}`,
      `\nDiff:\n${diff.slice(0, 12000)}`,
    ].join("\n");

    const response = await client.chat.completions.create({
      model,
      messages: [
        {
          role: "system",
          content:
            "Generate a PR description in markdown with sections: ## Summary (1-2 sentences), ## Changes (bulleted list of specific changes), ## Testing (how to verify). Return ONLY markdown.",
        },
        {
          role: "user",
          content: userContent,
        },
      ],
      temperature: 0.3,
      max_tokens: 1000,
    });

    const description = response.choices[0]?.message?.content?.trim() ?? "";
    if (!description) {
      throw new Error("Empty description from AI");
    }

    return description;
  } catch {
    // Fallback: list files as description
    const fileMatches =
      diff.match(/^diff --git a\/(.+?) b\/(.+?)$/gm) ?? [];
    const files = fileMatches.map((line) => {
      const match = line.match(/^diff --git a\/(.+?) b\/(.+?)$/);
      return match ? match[2] : "";
    }).filter(Boolean);

    const bulletList =
      files.length > 0
        ? files.map((f) => `- Update \`${f}\``).join("\n")
        : "- General updates";

    return `## Summary\n\nAutomated changes.\n\n## Changes\n\n${bulletList}\n\n## Testing\n\nReview the changes and verify expected behavior.`;
  }
}

export async function generatePRContent(
  diff: string,
  commits: string[]
): Promise<{ title: string; description: string }> {
  try {
    const [title, description] = await Promise.all([
      generatePRTitle(diff, commits),
      generatePRDescription(diff, commits),
    ]);

    return { title, description };
  } catch {
    // Ultimate fallback
    const title =
      commits.length > 0
        ? (commits[0].split("\n")[0] ?? "Update files").slice(0, 72)
        : "Update files";

    const fileMatches =
      diff.match(/^diff --git a\/(.+?) b\/(.+?)$/gm) ?? [];
    const files = fileMatches.map((line) => {
      const match = line.match(/^diff --git a\/(.+?) b\/(.+?)$/);
      return match ? match[2] : "";
    }).filter(Boolean);

    const bulletList =
      files.length > 0
        ? files.map((f) => `- Update \`${f}\``).join("\n")
        : "- General updates";

    const description = `## Summary\n\nAutomated changes.\n\n## Changes\n\n${bulletList}\n\n## Testing\n\nReview the changes and verify expected behavior.`;

    return { title, description };
  }
}
