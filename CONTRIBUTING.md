# Contributing to loomforge

First off, thanks for taking the time to contribute! 🎉

## Development Setup

1. Fork and clone the repository.
2. Install dependencies with `pnpm install` (or `npm install`).
3. To start the desktop app in development mode, run `pnpm dev`.
4. To test the share server, go to `apps/server` and run `docker compose up -d` or `pnpm dev`.

## Commit Guidelines

We use conventional commits:
- `feat:` for new features
- `fix:` for bug fixes
- `docs:` for documentation changes
- `chore:` for general repository tasks
- `refactor:` for refactoring code

## Code Quality

Before opening a pull request, ensure all checks pass:
- Run `pnpm typecheck` to check for TypeScript issues.
- Run `pnpm lint` to check for formatting and code style issues.
- Run `pnpm test` to run the unit test suite.

## Warning about AGPL Code

**IMPORTANT:** Do NOT copy code from AGPL-licensed projects (e.g., Cap, sendrec, loomola). You may use them for inspiration, but any implementation must be clean-room written and strictly MIT-compatible.
