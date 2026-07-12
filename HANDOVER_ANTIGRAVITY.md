# Handover-Prompt für Antigravity — loomforge

## Projekt-Status

**loomforge** ist eine Open-Source-Loom-Alternative mit allen Premium-Features. Basis = Fork von `jayden9889/open-loom` (MIT, Jul 2026).

### Aktueller Stand: Phase 0 (in Progress)

**Bereits erledigt:**
- ✅ open-loom nach loomforge kopiert (nicht als Submodul, sondern Code als Startpunkt)
- ✅ Alle package.json-Dateien umbenannt:
  - Root: `open-loom` → `loomforge`
  - Desktop: `openloom-desktop` → `loomforge-desktop`
  - Server: `openloom-server` → `loomforge-server`
  - Shared: `@openloom/shared` → `@loomforge/shared`
- ✅ pnpm-workspace.yaml erstellt (apps/desktop, packages/shared, packages/server)
- ✅ .gitignore erweitert (pnpm-store, *.bin für Whisper-Modelle, *.db, secrets/, etc.)
- ✅ Source-Dateien umbenannt: `openloom` → `loomforge`, `OpenLoom` → `LoomForge`, `@openloom` → `@loomforge`
- ✅ electron-builder.yml angepasst (appId: `org.loomforge.app`, productName: `LoomForge`)
- ✅ Docs umbenannt (SPEC.md, FEATURES.md, CONTRIBUTING.md) — ATTRIBUTION.md/BLUEPRINT.md/README.md behalten "open-loom" als Fork-Referenz

**Als nächstes in Phase 0:**
- [ ] `pnpm install` laufen lassen
- [ ] `pnpm typecheck && pnpm lint && pnpm test` verifizieren (alle grün)
- [ ] Commit: `chore: scaffold project from open-loom fork base`

### Wichtige Constraints

**Data Security — STRENG:**
- npm/pnpm-Abhängigkeiten NUR aus workspace-package.json (keine ad-hoc `pnpm add`)
- Keine curl|bash von externen Skripten
- Modelle: whisper.cpp `large-v3-turbo-q5_0` (Q5_0-Quantisierung, performant auf Apple Silicon), Ollama `llama3.2` (Default)
- Keine API-Keys/Cloud-Aufrufe ausser: Ollama localhost:11434, R2 (nur wenn User Creds setzt), Hono-Server localhost:3000
- Keine Telemetrie/Phone-Home
- Keine `child_process.exec` mit unsanitised Input (ffmpeg/whisper-Args als Array)
- **AGPL-Code NICHT kopieren** (Cap/sendrec/loomola sind AGPL) — nur Patterns/Ideen, MIT-clean neu

**Performance:**
- Ultra-schnell auf MacBook (Apple Silicon)
- Whisper: `large-v3-turbo-q5_0` (nicht `small` oder `base.en`)
- Ollama: konfigurierbar, Default `llama3.2`
- Settings-UI für Whisper-Modell-Pfad (auto-detect bekannte Pfade wie `~/Library/Application Support/ru.starmel.OpenSuperWhisper/whisper-models/`)

**Security/Privacy:**
- Keine persönlichen Pfade im Code hardcoden — alles via `app.getPath('userData')` oder Settings
- `git-secrets`-Check in CI (scannt auf API-Keys, Tokens, persönliche Pfade)
- CSP-Header auf Server (kein Inline-JS, keine externen Ressourcen)
- Rate-Limiting auf Server-Endpoints
- Signed Cookies mit rotierendem Secret

### Phasen-Plan (Phase 0–9)

**Phase 0** — Projekt-Gerüst + Fork-Setup (in Progress)
**Phase 1** — Recording-Pipeline verify + extend (Screen+Cam+Mic, Bubble, Pause/Resume, Crash-Recovery, Shortcuts)
**Phase 2** — Local Library + Search + Folders (SQLite + FTS5, Thumbnail-Grid, Hover-Preview)
**Phase 3** — Video Editing (Trim, Cut, Stitch via ffmpeg)
**Phase 4** — Transcription + AI (whisper.cpp large-v3-turbo-q5_0 + Ollama Default)
**Phase 5** — Sharing Tier 1: Hono Server + Premium-Features (Expiry, Email-Gate, Branding, Completion-Funnel Analytics)
**Phase 6** — Sharing Tier 2: Cloudflare R2 (presigned multipart + Instant Link)
**Phase 7** — Premium Watch-Page (CTA-Tracking, Email-Gate UI, Branding UI, Embed iframe)
**Phase 8** — Analytics Dashboard + Filler-Word-Removal + Custom Thumbnails
**Phase 9** — Polish + Github-Readiness (README, CI, E2E, Tag)

Nach jeder Phase: `pnpm typecheck && pnpm lint && pnpm test` → grün → commit → nächste Phase.

### Self-Healing bei Fehlern

1. **Fix 1** — offensichtlichste Lösung (Tippfehler, fehlender Import, falscher Pfad)
2. **Fix 2** — alternative Herangehensweise (andere Lib-Methode, anderes Pattern)
3. **Fix 3** — relevante Skills konsultieren (`coding-standards`, `frontend-patterns`, `backend-patterns`, `security-review`, `e2e-testing`, `tdd-workflow`, `verification-loop`, `agentic-engineering`)
4. Alle 3 scheitern → `PROGRESS.md`-Eintrag `blocked` mit Fehler + Versuchen + Next → mit nächster Phase fortfahren

### Progress-Tracking

Erstelle `PROGRESS.md` im Repo-Root mit:
```
# Progress — loomforge
Started: <timestamp>
Status: running

## Phase 0 — Projekt-Gerüst + Fork-Setup
- Status: in_progress | done | blocked
- Commits: <hash> <message>
- Notes: ...

## Phase 1 — ...
```

Update nach jeder Phase.

### Erwartung bei Rückkehr

- `PROGRESS.md` zeigt alle Phasen mit Status + Commits + Notes
- `git log --oneline` zeigt saubere Conventional-Commits
- `pnpm typecheck && pnpm lint && pnpm test` ist grün (oder `PROGRESS.md` erklärt welche Phase blocked ist)
- Startbare Electron-App: `pnpm dev` läuft
- Hono-Server via `docker compose up -d` oder `pnpm --filter server dev` startbar
- KEINE Secrets, KEINE unerwarteten Downloads, KEINE ungeprüften Packages, KEIN AGPL-Code, KEINE externen Cloud-Aufrufe

### Skills die du proaktiv nutzen solltest

- `coding-standards` — TS/React/Node-Konventionen
- `frontend-patterns` — React-UI für Library/Editor/Settings/Player
- `backend-patterns` — Hono-Server-Design, Rate-Limiting, Middleware
- `security-review` — Phase 5 (Password, Cookies) + Phase 6 (R2-Creds)
- `e2e-testing` — Phase 9 Playwright
- `tdd-workflow` — für Filler-Removal + Analytics
- `verification-loop` — nach jeder Phase
- `agentic-engineering` — autonome Arbeitsmuster

### Commit-Konvention

Conventional Commits: `feat:`, `fix:`, `chore:`, `docs:`, `test:`, `refactor:`. Eine Phase = ein logischer Commit-Bereich.

### Wichtige Dateien

- `BLUEPRINT.md` — vollständiger Phasen-Plan, Tech-Stack, Architektur
- `AGENTS.md` — Projekt-Konventionen und Befehle
- `ATTRIBUTION.md` — Fork-Vermerk an open-loom + genutzte Libs
- `README.md` — Projekt-Überblick
- `START_PROMPT.md` — ursprünglicher Start-Prompt (für Kontext)

---

**Los geht's. Arbeite Phase 0→9 sequenziell ab. Frage NICHTS. Triff Entscheidungen autonom. Dokumentiere in PROGRESS.md.**
