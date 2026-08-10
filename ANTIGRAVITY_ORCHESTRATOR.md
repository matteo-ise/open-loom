# OpenLoom — Anti-Gravity Orchestrator Prompt

> Komplette macOS-App bauen. Core-Recording-End-to-End. Kein Scope-Creep.

---

Du bist der **Lead Engineer für OpenLoom** — eine macOS-Desktop-App (Electron + React + TypeScript + matteo-brand) mit zwei Modi: Video-Recording (Screen+Cam+Mic) und Meeting-Recording (Audio+Live-Transcript).

**Dein Ziel:** Den gesamten Recording-Stack zum Laufen bringen. Von "New Recording" klicken bis "Video in Library sehen und abspielen". Nicht mehr Features — sondern dass das Wenige perfekt funktioniert. Das Projekt ist ein Fork von `jayden9889/open-loom` (MIT) — der Recording-Kern existiert bereits.

## Erste Aktion: Kontext laden

Lies sofort (relativ zu `/Users/matteoise/Documents/Development/Projects/personal/`):

1. `matteo-brand/PROMPT_INJECTION.md` — zwingende Brand-Regeln
2. `open-loom/AGENTS.md` — Projekt-Kontext + Befehle
3. `open-loom/PROGRESS.md` — aktueller Stand (Phase 1 UI ✅)
4. `open-loom/BLUEPRINT.md` — Architektur-Referenz (überfliegen, nicht sklavisch folgen)

Bestätige: Du hast verstanden dass weniger Features + mehr Stabilität das Ziel ist.

## Qualitätsanspruch

Diese App soll sich anfühlen wie ein Apple-Produkt — nicht wie ein Hobby-Projekt:

- **Recording:** Ein Klick "New Recording" → Screen wählen → Kamera an/aus → Start → 5s aufnehmen → Stop → In Library → Abspielen. Alles ohne Absturz, ohne hängenden State.
- **UI:** Granola-Dark-Ästhetik (#14130F warm-black, #19C332 Accent, Fraunces Serifen). Bereits durch matteo-brand-Komponenten integriert (Phase 1 ✅).
- **OS-Native:** macOS permissions (Screen Recording, Camera, Mic), accessibility, Dock-Menü, Global Shortcuts.

## Was du baust (und was NICHT)

**BAUEN (in dieser Reihenfolge):**
1. ✅ Recording Core — capture.ts, engine, HUD, Bubble, Countdown testen + fixen
2. ✅ Aufnahme speichern — ffmpeg remux, Library-Eintrag, Thumbnail
3. ✅ Library — Liste der Videos, löschen, umbenennen
4. ✅ Watch-View — VideoPlayer + Basic Info
5. ✅ Settings — Audio/Video-Devices, Hotkeys, Save-Location
6. ✅ Menubar + Global Shortcuts — Start/Stop/Pause vom ganzen Desktop
7. ❌ Meeting-Modus — erst wenn alles oben 100% stabil
8. ❌ AI/Transcription — erst wenn alles oben 100% stabil
9. ❌ Sharing (Hono/R2) — erst wenn alles oben 100% stabil
10. ❌ Editing (Trim/Cut) — erst wenn alles oben 100% stabil

## Test-Plan (nach JEDEM Schritt)

```bash
pnpm typecheck    # 0 Errors
pnpm dev          # App startet ohne Crash
```

Dann **manuell auf macOS testen:**
1. App startet → Setup-Assistent? → Permissions granted?
2. "New Recording" → Sources-Liste zeigt Bildschirme + Fenster?
3. Kamera-Toggle → Webcam-Vorschau sichtbar?
4. Record-Button → Countdown → HUD → Aufnahme läuft?
5. Stop-Button → Processing → Video in Library?
6. Klick auf Video → Watch-View mit VideoPlayer → Abspielen?
7. Settings → Devices, Hotkeys, Save-Path verstellbar?

Jeden Schritt dokumentieren in `PROGRESS.md`. Bei Fehlern: Fixen, nicht umgehen.

## Das existiert bereits (vom Fork)

**Main Process (`apps/desktop/src/main/`):**
- `capture.ts` — Screen/Cam/Mic sources via desktopCapturer
- `recorder-ipc.ts` — IPC zwischen Main↔Engine↔Renderer
- `ffmpeg-core.ts` — Remux/Transcode via ffmpeg
- `library-core.ts` — SQLite CRUD für VideoMeta
- `settings-core.ts` — Electron-Store Settings
- `shortcuts.ts` — GlobalShortcuts
- `windows.ts` — Window-Manager für alle 5 Fenster
- `protocol.ts` — `open-loom-file://` für lokale Videostreams
- `tray.ts` — Menubar-Tray
- `permissions.ts` — macOS Permission Requests
- `transcribe-core.ts` — whisper.cpp Integration
- `ai-core.ts` — Ollama Integration
- `editor-core.ts` — Trim/Cut/Stitch
- `share/` — S3 + Hono Sharing Provider

**Renderer (`apps/desktop/src/renderer/`):**
- `App.tsx` — mit AppShell + Sidebar aus matteo-brand ✅
- `Library.tsx` — mit Card + Badge aus matteo-brand ✅
- `Settings.tsx` — mit Toggle + Input + Button aus matteo-brand ✅
- `Watch.tsx` — mit VideoPlayer aus matteo-brand ✅
- `NewRecording.tsx` — Source-Selector + Start
- `Editor.tsx` — Timeline + Trim
- `Analytics.tsx` — Share-Statistiken
- `Hud.tsx` — Overlay während Recording
- `engine/`, `bubble.ts`, `countdown.ts`, `draw.ts` — Camera-Compositing + Overlays

**Aux Windows (via windows.ts):**
- HUD (Recording-Controls)
- Bubble (Webcam-Preview)
- Countdown (3-2-1)
- Draw (Screen-Drawing)
- Engine (MediaStream Capture)

## Typische Probleme (vom Fork) die du fixen musst

1. **IPC-Channel-Namen** — Der Fork nutzt `ol:` Prefix (z.B. `ol:getRecordingState`), preload nutzt dieselben Channels. Prüfe ob main→preload→renderer Channel konsistent sind.
2. **Window-Titel** — `capture.ts` hat `OWN_WINDOW_TITLES` mit exakten Window-Namen (`openloom-hud`, `openloom-bubble`, `openloom-countdown`, `openloom-draw`, `openloom-engine`). Diese MÜSSEN mit windows.ts übereinstimmen, sonst captured die App sich selbst.
3. **ffmpeg Binary** — Der Fork erwartet ffmpeg. `pnpm dev` muss ffmpeg finden (entweder system ffmpeg oder `ffmpeg-static` package). Prüfe `ffmpeg-core.ts`.
4. **Permissions** — macOS 26 verlangt explizite Screen Recording + Camera + Mic Permission. `permissions.ts` muss das handhaben.
5. **matteo-brand Submodule** — Liegt unter `src/ui-kit/`. `pnpm install` muss das berücksichtigen (workspace reference oder file: dependency).

## Self-Healing

1. Fix 1 — Offensichtlich (typo, import, pfad)
2. Fix 2 — Alternative (anderen IPC-Way, workaround)
3. Fix 3 — Skills laden (`coding-standards`, `frontend-patterns`, `electron`)
4. Blocked → PROGRESS.md mit Fehler + Versuchen + Next-Step. Nächster Task.

## Stopp-Kriterium

Erst aufhören wenn:

- [ ] `pnpm typecheck` = 0 Errors
- [ ] `pnpm dev` startet Electron-App
- [ ] "New Recording" zeigt Bildschirme + Kameras
- [ ] Aufnahme startet (Countdown → HUD → Recording)
- [ ] Stop → Video in Library
- [ ] Video abspielbar in Watch-View
- [ ] Settings persistieren
- [ ] Global Shortcuts funktionieren
- [ ] PROGRESS.md aktualisiert mit Status + bekannten Issues

Erst DANN: Meeting-Modus, AI, Sharing, Editing besprechen.

## Start

1. Lese Kontext-Dateien
2. `git submodule update --init --recursive` + `pnpm install`
3. `pnpm typecheck` — was ist kaputt?
4. `pnpm dev` — startet? Was fehlt?
5. Arbeite Tasks 1→6 sequenziell
6. Nach jedem Task: typecheck + dev + manueller Test

Los.
