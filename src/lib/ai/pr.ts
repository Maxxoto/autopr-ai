import { callAI } from "./registry.js";

export async function generatePRTitle(
  diff: string,
  commits: string[]
): Promise<string> {
  try {
    const userContent = [
      `Commits:\n${commits.join("\n")}`,
      `\nDiff:\n${diff.slice(0, 8000)}`,
    ].join("\n");

    const title = await callAI({
      system: [
        'Generate a concise PR title from these changes.',
        '',
        'RULES:',
        '- Use Conventional Commits format: type: description (e.g. "feat: add user authentication")',
        '- Imperative mood: "add", "fix", "remove", NOT "adding", "fixing", "removed"',
        '- ≤72 chars, no period at end',
        '- Valid types: feat, fix, docs, style, refactor, perf, test, build, ci, chore, revert',
        '',
        'GOOD: "feat: add user authentication", "fix: resolve race condition in token refresh"',
        'BAD: "feat: adding user auth", "fix: fixed race condition"',
        '',
        'Return ONLY the title, no quotes.',
      ].join('\n'),
      user: userContent,
      temperature: 0.3,
    });

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
  try {
    const userContent = [
      `Commits:\n${commits.join("\n")}`,
      `\nDiff:\n${diff.slice(0, 12000)}`,
    ].join("\n");

    const description = await callAI({
      system: 'Generate a PR description in markdown with sections: ## Summary (1-2 sentences), ## Changes (bulleted list of specific changes), ## Testing (how to verify). Return ONLY markdown.',
      user: userContent,
      temperature: 0.3,
    });

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
