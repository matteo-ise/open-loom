<<<../matteo-brand/PROMPT_INJECTION.md

# AGENTS.md — OpenLoom (opencode-Kontext)

## Projekt
Open-Source-Loom + Granola: Electron-Desktop-App mit zwei Modi — Video-Modus (Screen+Webcam aufnehmen, teilen via R2/Hono) und Meeting-Modus (Audio live transkribieren, AI-Summary mit Header, PDF/DOCX/MD-Export). Einheitliche Library, Ollama für AI, whisper.cpp/mlx-whisper für Transkription. Siehe `BLUEPRINT.md`.

## Befehle
- Install: `pnpm install` (oder `npm install`)
- Typecheck: `pnpm typecheck`
- Lint: `pnpm lint`
- Tests: `pnpm test`
- Build: `pnpm build`
- Dev: `pnpm dev`
- Server: `pnpm --filter server dev` oder `docker compose -f apps/server/docker-compose.yml up -d`
- Sidecar (Meeting-Live-Transkription): `cd sidecars/mlx_whisper && pip install -r requirements.txt && python server.py`

## Konventionen
- Conventional Commits (`feat:`, `fix:`, `chore:`, `docs:`).
- Keine Secrets, R2-Creds, `.env`, DBs, `recordings/`, `uploads/`, ffmpeg-Binarys, `node_modules/`, `src/ui-kit/` (Submodule) committen.
- npm workspaces; neue Deps in der jeweiligen workspace-`package.json`.
- Eine Phase aus `BLUEPRINT.md` pro Commit-Bereich; nach jeder Phase verifizieren.
- **AGPL-Code von Cap/sendrec/loomola NIEMALS kopieren** — nur Patterns, MIT-clean neu implementieren.
- **matteo-brand** als Submodule unter `src/ui-kit/` — Komponenten daraus nutzen, keine Custom-Komponenten bauen.
- **Granola-Green `#19C332`** ist die Accent-Farbe. **Serif-Typografie Pflicht** für Content (Transcripts, Summaries).

## Stack
Electron · TypeScript · React · matteo-brand · Hono · better-sqlite3 · ffmpeg-static · whisper.cpp · mlx-whisper (Sidecar) · ollama · @aws-sdk/client-s3 (R2) · pdf-lib · docx · Docker · Vitest
