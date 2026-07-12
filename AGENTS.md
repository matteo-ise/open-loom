# AGENTS.md — loomforge (opencode-Kontext)

## Projekt
Open-Source-Loom-Alternative: Electron-Desktop-App (Screen+Webcam+Mic+System-Audio), ffmpeg-Editing, lokales whisper.cpp für Captions, lokales Ollama für AI-Summaries, Sharing via self-hosted Hono-Server (Docker) ODER Cloudflare R2 (presigned multipart). Premium-Features: CTA, Comments, Reactions, Analytics, Password, Expiry, Email-Gate, Branding, Embed, Filler-Removal, Thumbnails. Basis = Fork von open-loom (MIT). Siehe `BLUEPRINT.md` für Phasen-Plan.

## Befehle
- Install: `pnpm install` (oder `npm install` falls pnpm nicht vorhanden)
- Typecheck: `pnpm typecheck` (tsc --noEmit über workspaces)
- Lint: `pnpm lint` (ESLint)
- Tests: `pnpm test` (Vitest)
- Build: `pnpm build`
- Dev: `pnpm dev` (startet Electron-App)
- Server dev: `pnpm --filter server dev` (Hono auf :3000)
- Docker server: `docker compose -f apps/server/docker-compose.yml up -d`

## Konventionen
- Conventional Commits (`feat:`, `fix:`, `chore:`, `docs:`).
- Keine Secrets, R2-Creds, `.env`, SQLite-DBs, `recordings/`, `uploads/`, ffmpeg-Binarys committen (siehe `.gitignore`).
- npm workspaces; neue Deps in der jeweiligen `package.json` der Workspace, NICHT im root (ausser cross-cutting).
- Eine Phase aus `BLUEPRINT.md` pro logischem Commit-Bereich; nach jeder Phase verifizieren (typecheck + lint + test).
- **AGPL-Code von Cap/sendrec/loomola NIEMALS kopieren** — nur Patterns/Ideen, MIT-clean neu implementieren.

## Stack
Electron · TypeScript · React · Hono · better-sqlite3 · ffmpeg-static · whisper.cpp · ollama · @aws-sdk/client-s3 (R2) · Docker · Vitest
