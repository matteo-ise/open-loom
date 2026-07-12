# Progress — OpenLoom
Started: 2026-07-12T18:30
Status: building (Phase 0–1)

## Was erledigt wurde

### Rename: loomforge → open-loom (✅ committed)
| Bereich | Status |
|---------|--------|
| Root package.json | `loomforge` → `open-loom` |
| desktop/package.json | `loomforge-desktop` → `open-loom-desktop`, `LoomForge` → `OpenLoom` |
| server/package.json | `loomforge-server` → `open-loom-server` |
| shared/package.json | `@loomforge/shared` → `@open-loom/shared` |
| Types & Interfaces | `LoomForgeAPI` → `OpenLoomAPI`, `LoomForgeInternal` → `OpenLoomInternal` |
| Preload Bridge | `window.loomforge` → `window.openLoom`, `window.loomforgeInternal` → `window.openLoomInternal` |
| URL Scheme | `loomforge-file://` → `open-loom-file://` |
| Window Names | `loomforge-hud` → `openloom-hud` etc. |
| User-Facing Strings | "LoomForge Server" → "OpenLoom Server" |
| Temp Dirs | `loomforge-edit-` → `openloom-edit-` etc. |
| Logger | `[loomforge]` → `[openloom]` |
| Settings Store | `loomforge-settings` → `openloom-settings` |
| **0 verbleibende Referenzen** | ✅ |

### AGENTS.md
Startet mit `<<<../matteo-brand/PROMPT_INJECTION.md` — lädt Brand-Regeln automatisch.

### BRAND_UPDATE.md
Alle Referenzen auf `../matteo-brand/` aktualisiert.
Cross-Promotion-Footer auf aktuelle Projekte gefixt.

### matteo-brand UI-Kit (5 neue Komponenten)
Siehe `matteo-brand/PROGRESS.md`. Für OpenLoom kritisch:
- `TranscriptView` — Meeting-Modus (Speaker, Timestamps, Search, AutoScroll)
- `VideoPlayer` — Video-Modus (Speed, Progress, Auto-Hide)
- `Badge` — Status (Recording, Processing, Shared)
- `Spinner` — Loading
- `Tooltip` — UI-Hilfe

## Bestehende Codebasis (von loomforge übernommen)

### Desktop App (`apps/desktop/`)
- Main Process: capture, recording (screen+cam+mic), ffmpeg, transcription (whisper), AI (ollama), editor (trim/stitch/filler-removal), library (SQLite), sharing (S3 + Hono server), shortcuts, tray, permissions, crash-recovery, protocol handler
- Renderer: App shell (Library, Editor, Setup, Settings, NewRecording, Watch, Analytics views), HUD overlay, bubble/countdown/draw/engine windows
- Tests: 10+ test files covering editor, library, protocol, ffmpeg, settings, transcription, AI, preview, share
- E2E: Playwright tests (`e2e/`)

### Server (`apps/server/` + `packages/server/`)
Hono-based share server with: watch pages, comments, reactions, analytics, password protection, expiry, email gate, custom branding, embed pages

### Player (`packages/player/`)
React-based video player component for web (embed/watch pages)

### Shared (`packages/shared/`)
Types, VideoMeta, Settings, ShareProvider, TranscriptionProvider, preload IPC contracts

## Nächste Schritte für Anti-Gravity (Phase 0–1)

### Phase 0 — Gerüst + Submodule
- [ ] `git submodule add ../matteo-brand src/ui-kit` in open-loom
- [ ] `pnpm install` (workspace mit @open-loom/shared funktioniert)
- [ ] `pnpm typecheck` — läuft durch (rename ist sauber)
- [ ] Test: `pnpm dev` startet Electron-App

### Phase 1 — Brand-Integration in Renderer
- [ ] Globals.css importieren (matteo-brand Serif-Fonts + Dark-Palette)
- [ ] App.tsx: `AppShell` aus matteo-brand als Root
- [ ] Library.tsx: matteo-brand `Card`, `Badge`, `Sidebar`
- [ ] Settings.tsx: matteo-brand `Toggle`, `Input`, `Button`
- [ ] Editor.tsx: matteo-brand `Slider`
- [ ] Watch.tsx: matteo-brand `VideoPlayer` statt direktem `<video>`
- [ ] Meeting-Modus: `TranscriptView` einbauen
