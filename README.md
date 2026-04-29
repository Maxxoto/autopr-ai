<div align="center">

# `autopr-ai⚡`

**Stop writing commit messages. Stop writing PR descriptions. Start shipping.**

[![npm version](https://img.shields.io/npm/v/autopr-ai?color=blue)](https://www.npmjs.com/package/autopr-ai)
[![license](https://img.shields.io/github/license/Maxxoto/autopr-ai)](https://github.com/Maxxoto/autopr-ai/blob/main/LICENSE)
[![node](https://img.shields.io/node/v/autopr)](https://nodejs.org)

AI-powered CLI that watches your repo, generates conventional commits,<br>
creates pull requests, and reviews code — all from your terminal.

[Install](#install) · [Quick Start](#quick-start) · [Commands](#commands) · [Configuration](#configuration) · [Contributing](CONTRIBUTING.md)

</div>

---

## What it does

```
┌──────────────────────────────────────────────────────────────┐
│                                                              │
│   $ autopr-ai cm                                                │
│                                                              │
│   ⠹ Analyzing changes...                                    │
│   ✔ feat(api): add JWT refresh token rotation               │
│                                                              │
│   Committed: feat(api): add JWT refresh token rotation       │
│                                                              │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│   $ autopr-ai cr                                                │
│                                                              │
│   ⠹ Generating PR content...                                │
│   Title: Implement token refresh with rotation strategy      │
│                                                              │
│   ✔ Created PR #47 → https://github.com/org/repo/pull/47    │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

**One command to set up, then three commands to ship.**

| Command          | Alias    | What happens                                                                            |
| ---------------- | -------- | --------------------------------------------------------------------------------------- |
| `autopr-ai onboard` | —        | First-time setup: GitHub auth + AI provider → ready to go                               |
| `autopr-ai cm`      | `commit` | Reads your staged diff → generates a conventional commit → commits                      |
| `autopr-ai cr`      | `create` | Reads your branch diff → generates PR title + description → pushes + creates PR         |
| `autopr-ai watch`   | —        | Polls GitHub → notifies when you're assigned as reviewer → AI review or open in browser |

Plus `autopr-ai auth` to manage your GitHub token and `autopr-ai review` to AI-review any PR.

---

## Install

### npm (recommended)

```bash
npm install -g autopr-ai
```

### Homebrew

```bash
brew install @maxxoto/tap/autopr
```

### From source

```bash
git clone https://github.com/Maxxoto/autopr-ai.git
cd autopr-ai
npm install
npm link        # makes `autopr` available globally
```

<details>
<summary>Run without installing (npx)</summary>

```bash
npx autopr-ai --help
```

Or use the dev script:

```bash
git clone https://github.com/Maxxoto/autopr-ai.git
cd autopr-ai
npm install
npm run autopr -- --help
npm run autopr -- cm          # commit
npm run autopr -- cr          # create PR
```

</details>

**Requirements:** Node.js 18+

---

## Quick Start

### 1. Onboard (one-time setup)

```bash
$ autopr-ai onboard
```

```
  Welcome to autopr! Let's get you set up.
  ════════════════════════════════════════

  Step 1/2: GitHub Authentication
  ────────────────────────────────
  You'll need a Personal Access Token with:
    ✓ repo   (full control of repositories)
    ✓ read:org (read org membership)
  ? Open GitHub token page in browser? Yes
  Opening browser...
  ? Paste your token: ****
  ✔ Authenticated as your-username

  Step 2/2: AI Provider Setup
  ───────────────────────────
  ? Choose your AI provider:
  ❯ OpenAI (GPT-4o) — $$$ Pay-per-use
    Anthropic (Claude Sonnet) — $$$ Pay-per-use
    DeepSeek (DeepSeek Chat) — $ Very affordable
    Groq (Llama 3.3 70B) — Free tier available
    OpenRouter (Multi-model) — $$ Depends on model
    OpenAI-Compatible (LiteLLM/Ollama/Custom) — Free Self-hosted

  ? Enter your OpenAI API key: ****
  ✔ API key saved

  ────────────────────────────────
  ✔ Setup complete!

  Configuration summary:
    GitHub:  your-username @ github.com
    AI:      OpenAI — gpt-4o — sk-...7x3k

  Try these commands:
    autopr-ai cm      — smart commits
    autopr-ai cr      — create PRs
    autopr-ai review  — AI code review
    autopr-ai watch   — watch for reviews
```

**That's it.** One command and you're ready to go.

<details>
<summary>Manual setup (alternative)</summary>

```bash
autopr-ai auth login                    # GitHub auth
autopr-ai auth status                   # Check auth state
```

Set your AI provider via environment variables or `~/.config/autopr/` config.

</details>

### 2. Smart Commit

```bash
git add .
autopr-ai cm
```

The CLI analyzes your staged diff, sends it to your configured LLM, and generates a conventional commit message:

```
  feat(auth): implement refresh token rotation

  - Add /auth/refresh endpoint
  - Store hashed refresh tokens in database
  - Auto-rotate on each use, revoke after 7 days

  ? Use this commit message? Yes
  ✔ Committed: feat(auth): implement refresh token rotation
```

Don't like the generated message? Hit **No** and type your own.

### 3. Smart PR

```bash
autopr-ai cr
```

```
  ⠹ Generating PR content...

  Title: Implement refresh token rotation with 7-day expiry

  ## Summary
  Adds secure refresh token handling with automatic rotation
  and a 7-day revocation window.

  ## Changes
  - Add /auth/refresh endpoint with token validation
  - Hash refresh tokens before storage
  - Auto-rotate tokens on each refresh
  - Add cleanup job for expired tokens

  ## Testing
  - Unit tests for token generation and validation
  - Integration test for refresh flow

  ? Create this PR? Yes
  ✔ Created PR #47
  ? Open in browser? Yes
```

### 4. Watch for Reviews

```bash
autopr-ai watch
```

```
  Watching for review requests... (polling every 60s)

  🔔 New review request: "Refactor payment gateway" (org/checkout-api)

  ? PR #52: Refactor payment gateway
  ❯ Open in browser
    AI Review Assist
    Dismiss
```

Select **AI Review Assist** and get an instant structured review:

```
  ## 🔴 Critical
  - Possible hardcoded secrets detected — use environment variables instead

  ## 🟡 Suggestions
  - Large diff (612 additions) — consider splitting into smaller PRs
  - Found 3 TODO comments — consider addressing or creating issues

  ## 🟢 Good Practices
  - Test coverage included
  - No console.log statements left in
```

---

## Commands

### `autopr-ai onboard`

Guided first-time setup for GitHub auth and AI provider.

```bash
autopr-ai onboard    # interactive setup wizard
```

Running bare `autopr` with no subcommand will auto-launch onboard if not yet configured.

### `autopr-ai cm` / `autopr-ai commit`

Generate a conventional commit from staged changes.

```bash
autopr-ai cm              # analyze staged diff → commit
autopr-ai cm --no-verify  # skip git hooks
```

Supports all conventional commit types: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci`, `chore`, `revert`.

### `autopr-ai cr` / `autopr-ai create`

Create a PR with AI-generated title and description.

```bash
autopr-ai cr                 # auto-detect base branch
autopr-ai cr --base develop  # target specific branch
autopr-ai cr --draft         # create as draft
autopr-ai cr --no-push       # skip pushing to remote
```

### `autopr-ai review [PR number]`

AI-powered code review for a pull request.

```bash
autopr-ai review          # review PR for current branch
autopr-ai review 42       # review specific PR
autopr-ai review 42 --repo owner/repo
```

### `autopr-ai watch`

Watch for PR review assignments and get desktop notifications.

```bash
autopr-ai watch                  # poll every 60 seconds
autopr-ai watch --interval 30    # poll every 30 seconds
```

Press `Ctrl+C` to stop watching.

### `autopr-ai auth`

Manage GitHub authentication.

```bash
autopr-ai auth login              # interactive login (opens browser)
autopr-ai auth login --token ghp_ # non-interactive
autopr-ai auth logout              # remove credentials
autopr-ai auth status              # show current auth state
```

---

## Configuration

### AI Providers

`autopr` supports **6 AI providers** through the [Vercel AI SDK](https://ai-sdk.dev/):

| Provider              | Models                           | Cost                |
| --------------------- | -------------------------------- | ------------------- |
| **OpenAI**            | GPT-4o, o1, o3                   | $$$ Pay-per-use     |
| **Anthropic**         | Claude Sonnet 4, Claude Haiku    | $$$ Pay-per-use     |
| **DeepSeek**          | DeepSeek Chat, DeepSeek Reasoner | $ Very affordable   |
| **Groq**              | GPT-OSS 20B                      | Free tier available |
| **OpenRouter**        | All providers via single key     | $$ Depends on model |
| **OpenAI-Compatible** | LiteLLM, Ollama, any OpenAI API  | Free Self-hosted    |

Configure via `autopr-ai onboard` (recommended) or environment variables:

```bash
# OpenAI
export OPENAI_API_KEY=sk-...

# Anthropic
export ANTHROPIC_API_KEY=sk-ant-...

# DeepSeek
export DEEPSEEK_API_KEY=dsk-...

# Groq
export GROQ_API_KEY=gsk_...

# OpenRouter
export OPENROUTER_API_KEY=sk-or-...

# OpenAI-Compatible (LiteLLM, Ollama, etc.)
export OPENAI_COMPAT_API_KEY=your-key
export OPENAI_BASE_URL=http://localhost:11434/v1
export OPENAI_MODEL=llama3
```

Or set in `.env`:
```bash
ANTHROPIC_API_KEY=sk-ant-...
# or any other provider key
```

### GitHub Token

Stored securely at `~/.config/autopr/` (via [conf](https://github.com/sindresorhus/conf)).

The token needs these scopes:
- `repo` — full control of repositories (read code, create PRs, post reviews)
- `read:org` — read org membership (for team-based review requests)

Create one at: https://github.com/settings/tokens/new?description=autopr-cli&scopes=repo,read:org

---

## Contributing

Interested in contributing? Check out the **[Contributing Guide](CONTRIBUTING.md)** for:

- 🛠️ Development setup
- 🏗️ Project architecture
- 📋 Contribution workflow
- 💡 Ideas for contributions
- 🧪 Running tests

---

## License

[MIT](LICENSE) — use it however you want ❤️.

---

<div align="center">

**Built for developers who'd rather write code than write about code.**

[Report a Bug](https://github.com/Maxxoto/autopr-ai/issues) · [Request a Feature](https://github.com/Maxxoto/autopr-ai/issues) · [Star on GitHub](https://github.com/Maxxoto/autopr-ai)

</div>
