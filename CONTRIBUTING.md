# Contributing to autopr

Thanks for your interest in contributing! This guide covers everything you need to get started. For usage documentation and command reference, check the [README](README.md).

## Development Setup

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

## Project Architecture

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

### Key Design Decisions

- **Vercel AI SDK** for multi-provider LLM support (OpenAI, Anthropic, Google, etc.)
- **Commander** for CLI framework and argument parsing
- **Octokit** for GitHub API interactions
- **simple-git** for git operations
- **AI fallback** — if the LLM fails, autopr falls back to heuristic analysis of your diff
- **TypeScript ESM** with NodeNext module resolution
- All relative imports use `.js` extension (required by NodeNext)

## How to Contribute

1. Fork the repository
2. Create a feature branch: `git checkout -b feat/my-feature`
3. Make your changes — follow existing patterns in `src/`
4. Run checks: `npm run typecheck && npm run test`
5. Submit a PR — use `autopr cr` to create it ;)

## Code Style Guidelines

- TypeScript strict mode enabled
- ESM modules only (import/export, not require)
- `.js` extension in all relative imports (NodeNext requirement)
- Conventional commits for commit messages
- Descriptive variable names, avoid abbreviations
- Error handling: always catch errors and show user-friendly messages
- Never use `as any`, `@ts-ignore`, or `@ts-expect-error`

## Commit Conventions

Use the conventional commit format:

```
feat: add new feature
fix: resolve bug in auth flow
docs: update API reference
refactor: simplify error handling
test: add unit tests for commit command
chore: update dependencies
```

Scopes are optional but encouraged for clarity:

```
feat(auth): add refresh token support
fix(commit): handle empty diff gracefully
```

For breaking changes, use `!` after the type and include `BREAKING CHANGE:` in the commit body:

```
feat!: change config API signature

BREAKING CHANGE: config.get() now returns undefined instead of null
```

Use `autopr cm` to generate commits automatically from your staged changes.

## Running Tests

```bash
npm run test
```

Tests use the Node.js built-in test runner (`node:test`). Add new tests in the `tests/` directory, mirroring the structure of `src/`.

## Ideas for Contributions

Looking for something to work on? Here are some ideas:

- [x] ~~Anthropic Claude provider support~~ (now built-in via Vercel AI SDK)
- [ ] GitLab support
- [ ] Bitbucket support
- [ ] Custom commit message templates
- [ ] PR template support (`.github/PULL_REQUEST_TEMPLATE.md`)
- [ ] Config file support (`.autopr.json`)
- [ ] Interactive rebase integration
- [ ] GitHub Actions integration (AI review on PR open)
- [ ] Multiple AI model support (switch models per command)
- [ ] Review summary generation (weekly/daily digest)

## PR Review Process

- All PRs require review before merge
- CI must pass (typecheck + build + test)
- Keep PRs focused — one feature or fix per PR
- Include tests for new functionality

## Getting Help

- Open an issue: https://github.com/Maxxoto/autopr/issues
- Start a discussion: https://github.com/Maxxoto/autopr/discussions
