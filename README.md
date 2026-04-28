<div align="center">

# `autopr`

**Stop writing commit messages. Stop writing PR descriptions. Start shipping.**

[![npm version](https://img.shields.io/npm/v/@maxxoto/autopr?color=blue)](https://www.npmjs.com/package/@maxxoto/autopr)
[![license](https://img.shields.io/github/license/Maxxoto/autopr)](https://github.com/Maxxoto/autopr/blob/main/LICENSE)
[![node](https://img.shields.io/node/v/autopr)](https://nodejs.org)

AI-powered CLI that watches your repo, generates conventional commits,<br>
creates pull requests, and reviews code — all from your terminal.

[Install](#install) · [Quick Start](#quick-start) · [Commands](#commands) · [Configuration](#configuration) · [Contributing](#contributing)

</div>

---

## What it does

```
┌──────────────────────────────────────────────────────────────┐
│                                                              │
│   $ autopr cm                                                │
│                                                              │
│   ⠹ Analyzing changes...                                    │
│   ✔ feat(api): add JWT refresh token rotation               │
│                                                              │
│   Committed: feat(api): add JWT refresh token rotation       │
│                                                              │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│   $ autopr cr                                                │
│                                                              │
│   ⠹ Generating PR content...                                │
│   Title: Implement token refresh with rotation strategy      │
│                                                              │
│   ✔ Created PR #47 → https://github.com/org/repo/pull/47    │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

**One command to set up, then three commands to ship.**

| Command | Alias | What happens |
|---------|-------|-------------|
| `autopr onboard` | — | First-time setup: GitHub auth + AI provider → ready to go |
| `autopr cm` | `commit` | Reads your staged diff → generates a conventional commit → commits |
| `autopr cr` | `create` | Reads your branch diff → generates PR title + description → pushes + creates PR |
| `autopr watch` | — | Polls GitHub → notifies when you're assigned as reviewer → AI review or open in browser |

Plus `autopr auth` to manage your GitHub token and `autopr review` to AI-review any PR.

---

## Install

### npm (recommended)

```bash
npm install -g @maxxoto/autopr
```

### Homebrew

```bash
brew install @maxxoto/tap/autopr
```

### From source

```bash
git clone https://github.com/Maxxoto/autopr.git
cd autopr
npm install
npm link        # makes `autopr` available globally
```

<details>
<summary>Run without installing (npx)</summary>

```bash
npx autopr --help
```

Or use the dev script:

```bash
git clone https://github.com/Maxxoto/autopr.git
cd autopr
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
$ autopr onboard
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
    autopr cm      — smart commits
    autopr cr      — create PRs
    autopr review  — AI code review
    autopr watch   — watch for reviews
```

**That's it.** One command and you're ready to go.

<details>
<summary>Manual setup (alternative)</summary>

```bash
autopr auth login                    # GitHub auth
autopr auth status                   # Check auth state
```

Set your AI provider via environment variables or `~/.config/autopr/` config.

</details>

### 2. Smart Commit

```bash
git add .
autopr cm
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
autopr cr
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
autopr watch
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

### `autopr onboard`

Guided first-time setup for GitHub auth and AI provider.

```bash
autopr onboard    # interactive setup wizard
```

Running bare `autopr` with no subcommand will auto-launch onboard if not yet configured.

### `autopr cm` / `autopr commit`

Generate a conventional commit from staged changes.

```bash
autopr cm              # analyze staged diff → commit
autopr cm --no-verify  # skip git hooks
```

Supports all conventional commit types: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci`, `chore`, `revert`.

### `autopr cr` / `autopr create`

Create a PR with AI-generated title and description.

```bash
autopr cr                 # auto-detect base branch
autopr cr --base develop  # target specific branch
autopr cr --draft         # create as draft
autopr cr --no-push       # skip pushing to remote
```

### `autopr review [PR number]`

AI-powered code review for a pull request.

```bash
autopr review          # review PR for current branch
autopr review 42       # review specific PR
autopr review 42 --repo owner/repo
```

### `autopr watch`

Watch for PR review assignments and get desktop notifications.

```bash
autopr watch                  # poll every 60 seconds
autopr watch --interval 30    # poll every 30 seconds
```

Press `Ctrl+C` to stop watching.

### `autopr auth`

Manage GitHub authentication.

```bash
autopr auth login              # interactive login (opens browser)
autopr auth login --token ghp_ # non-interactive
autopr auth logout              # remove credentials
autopr auth status              # show current auth state
```

---

## Configuration

### AI Providers

`autopr` supports **6 AI providers** through the [Vercel AI SDK](https://ai-sdk.dev/):

| Provider | Models | Cost |
|----------|--------|------|
| **OpenAI** | GPT-4o, o1, o3 | $$$ Pay-per-use |
| **Anthropic** | Claude Sonnet 4, Claude Haiku | $$$ Pay-per-use |
| **DeepSeek** | DeepSeek Chat, DeepSeek Reasoner | $ Very affordable |
| **Groq** | GPT-OSS 120B | Free tier available |
| **OpenRouter** | All providers via single key | $$ Depends on model |
| **OpenAI-Compatible** | LiteLLM, Ollama, any OpenAI API | Free Self-hosted |

Configure via `autopr onboard` (recommended) or environment variables:

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

## Architecture

```
src/
├── index.ts                  # CLI entry (commander)
├── commands/                 # Command handlers
│   ├── auth.ts               # auth login/logout/status
│   ├── commit.ts             # cm — smart commit
│   ├── create.ts             # cr — smart PR creation
│   ├── onboard.ts            # onboard — guided setup
│   ├── review.ts             # AI code review
│   └── watch.ts              # review assignment watcher
├── lib/
│   ├── ai/                   # LLM integration (Vercel AI SDK)
│   │   ├── commit.ts         # conventional commit generation
│   │   ├── pr.ts             # PR title/description generation
│   │   └── registry.ts       # multi-provider AI registry
│   ├── config/store.ts       # persistent config (~/.config/autopr)
│   ├── git/                  # git operations (simple-git)
│   ├── github/               # GitHub API (Octokit)
│   └── ui/                   # spinners, prompts, notifications
└── types/index.ts            # shared TypeScript types
```

**Key design decisions:**
- **Vercel AI SDK** for multi-provider LLM support — OpenAI, Anthropic, DeepSeek, Groq, OpenRouter, or any OpenAI-compatible API
- **Commander** for CLI framework — lightweight, flexible
- **Octokit** for GitHub API — official SDK with pagination and rate limiting
- **simple-git** for git operations — type-safe, promise-based
- **AI fallback** — if the LLM fails, falls back to heuristic-based analysis (no crash)

---

## Development

```bash
# Clone and install
git clone https://github.com/Maxxoto/autopr.git
cd autopr
npm install

# Run in dev mode
npm run autopr -- --help
npm run autopr -- cm

# Type checking
npm run typecheck

# Run tests
npm run test

# Build
npm run build
```

---

## Contributing

Contributions are welcome! Here's how to get started:

1. **Fork** the repository
2. **Create a feature branch**: `git checkout -b feat/my-feature`
3. **Make your changes** — follow existing patterns in `src/`
4. **Run checks**: `npm run typecheck && npm run test`
5. **Submit a PR** — use `autopr cr` to create it 😉

### Ideas for contributions

- [x] ~~Anthropic Claude provider support~~ (now built-in via Vercel AI SDK)
- [ ] GitLab support
- [ ] Bitbucket support
- [ ] Custom commit message templates
- [ ] PR template support (`.github/PULL_REQUEST_TEMPLATE.md`)
- [ ] Config file support (`.autopr.json`)
- [ ] Interactive rebase integration
- [ ] GitHub Actions integration (AI review on PR open)

---

## License

[MIT](LICENSE) — use it however you want.

---

<div align="center">

**Built for developers who'd rather write code than write about code.**

[Report a Bug](https://github.com/Maxxoto/autopr/issues) · [Request a Feature](https://github.com/Maxxoto/autopr/issues) · [Star on GitHub](https://github.com/Maxxoto/autopr)

</div>
