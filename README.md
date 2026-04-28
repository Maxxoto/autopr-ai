<div align="center">

# `autopr`

**Stop writing commit messages. Stop writing PR descriptions. Start shipping.**

[![npm version](https://img.shields.io/npm/v/autopr?color=blue)](https://www.npmjs.com/package/autopr)
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

**Three commands. That's it.**

| Command | Alias | What happens |
|---------|-------|-------------|
| `autopr cm` | `commit` | Reads your staged diff → generates a conventional commit → commits |
| `autopr cr` | `create` | Reads your branch diff → generates PR title + description → pushes + creates PR |
| `autopr watch` | — | Polls GitHub → notifies when you're assigned as reviewer → AI review or open in browser |

Plus `autopr auth` to manage your GitHub token and `autopr review` to AI-review any PR.

---

## Install

### npm (recommended)

```bash
npm install -g autopr
```

### Homebrew

```bash
brew install Maxxoto/tap/autopr
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

### 1. Authenticate

```bash
$ autopr auth login
```

```
  GitHub Authentication
  ─────────────────────

  You'll need a Personal Access Token with these scopes:
    ✓ repo   (full control of repositories)
    ✓ read:org (read org membership)

  ? Open GitHub token page in browser? Yes
  Opening browser...

  ? Paste your token: ****
  ✔ Authenticated as your-username
```

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

### AI Provider

`autopr` uses the [OpenAI SDK](https://github.com/openai/openai-node) with a **configurable base URL** — so it works with any OpenAI-compatible API:

```bash
# OpenAI (default)
export OPENAI_API_KEY=sk-...
export OPENAI_MODEL=gpt-4o

# LiteLLM proxy (unified interface to 100+ LLMs)
export OPENAI_API_KEY=your-key
export OPENAI_BASE_URL=http://localhost:4000/v1
export OPENAI_MODEL=gpt-4o

# Ollama (local)
export OPENAI_BASE_URL=http://localhost:11434/v1
export OPENAI_MODEL=llama3
export OPENAI_API_KEY=ollama

# Any OpenAI-compatible API
export OPENAI_BASE_URL=https://your-api.com/v1
```

Or set via environment variables in `.env`:

```bash
OPENAI_API_KEY=sk-...
OPENAI_BASE_URL=https://api.openai.com/v1
OPENAI_MODEL=gpt-4o
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
│   ├── review.ts             # AI code review
│   └── watch.ts              # review assignment watcher
├── lib/
│   ├── ai/                   # LLM integration (OpenAI SDK)
│   │   ├── commit.ts         # conventional commit generation
│   │   └── pr.ts             # PR title/description generation
│   ├── config/store.ts       # persistent config (~/.config/autopr)
│   ├── git/                  # git operations (simple-git)
│   ├── github/               # GitHub API (Octokit)
│   └── ui/                   # spinners, prompts, notifications
└── types/index.ts            # shared TypeScript types
```

**Key design decisions:**
- **Commander** for CLI framework — lightweight, flexible
- **Octokit** for GitHub API — official SDK with pagination and rate limiting
- **simple-git** for git operations — type-safe, promise-based
- **OpenAI SDK with configurable baseURL** — works with LiteLLM, Ollama, any compatible API
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

- [ ] Anthropic Claude provider support
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
