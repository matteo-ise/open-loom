# OpenLoom — Bauplan

> Open-Source-Loom + Open-Source-Granola. Zwei Modi in einer App: **Video-Modus** (Bildschirm+Webcam aufnehmen, teilen via Link — Loom-Style) und **Meeting-Modus** (Audio aufnehmen, live transkribieren, AI-Summary mit Datum/Uhrzeit/Teilnehmern/Themen generieren, als PDF/DOCX/Markdown exportieren — Granola/Meetily-Style). Alles lokal, null Cloud (außer User-supplied R2 für Video-Sharing), MIT-lizenziert, Github-publishable.

---

## 1. Kontext-Brief (für frischen Agent, kalt startbar)

**Was das Projekt ist:** Eine macOS-Desktop-App (Electron + TypeScript + React + `matteoise-ui-kit`) die zwei Modi vereint:

1. **Video-Modus (Loom-Style)** — nimmt Bildschirm + Webcam + Mikrofon + System-Audio auf, bietet Editing (Trim, Cut, Filler-Word-Removal, Thumbnails), transkribiert lokal mit whisper.cpp, generiert AI-Summaries/Chapters/Action-Items via lokalem Ollama, und teilt via 1-Klick-Link — über self-hosted Hono-Server (Docker) oder Cloudflare R2 (presigned multipart, 10 GB gratis). Premium-Features: CTA, Comments, Reactions, Analytics, Password, Expiry, Email-Gate, Branding, Embed.

2. **Meeting-Modus (Granola/Meetily-Style)** — nimmt Mikrofon + System-Audio auf (ohne Video — reine Audio-Meeting-Notizen), transkribiert live mit Whisper `small` (echtzeitnah auf Apple Silicon via mlx-whisper), generiert am Ende eine strukturierte Summary (Header: Datum, Uhrzeit, Dauer, erkannte Teilnehmer, besprochene Themen → dann volles Transkript) und exportiert 1-Klick als PDF / DOCX / Markdown. Sessions werden in SQLite gespeichert (Session Memory) — durchsuchbar, wieder ladbar.

**Warum beide in einer App:** Granola, WhisperFlow, Meetily PRO kosten Geld für Meeting-Notes. Loom kostet Geld für Video-Sharing. Es gibt keine OSS-App die beide kombiniert. `OpenLoom` schliesst die Lücke: lade eine App runter, bekomme Loom-Video-Sharing UND Granola-Meeting-Notizen — gratis, lokal, MIT. Eine Installation, eine UI, ein Library, ein AI-Stack (Ollama), eine Transkriptions-Engine (whisper.cpp/mlx-whisper).

**Beziehung zu bestehenden OSS-Projekten:**
- **Video-Modus Basis = Fork von [jayden9889/open-loom](https://github.com/jayden9889/open-loom)** (MIT, Jul 7 2026). Electron-Recorder, Screen+Cam+Mic, macOS native Loopback ab 14.2, Camera-Bubble, Pause/Resume, Crash-Recovery, Library, Trim/Cut/Stitch, lokales whisper.cpp, BYOK AI, Hono-Share-Server, Cloudflare R2-Pfad.
- **Meeting-Modus inspiriert von** [Meetily](https://github.com/Zackriya-Solutions/meetily) (Community Edition) und [Granola](https://granola.ai) — aber als Electron+TS Komponente gebaut, nicht als Python/Rust-Stack.
- **Premium-Feature-Inspiration:** [voom](https://github.com/aritropaul/voom) (Filler-Word-Removal), [sendrec](https://github.com/sendrec/sendrec) (Email-Gate, CTA-CTR, Analytics-Funnel), [Cap](https://github.com/CapSoftware/Cap) (Instant-Mode Link-Minting).

**Was du NICHT tust:**
- Kein Speech-to-Text-Diktat-Everywhere (OpenSuperWhisper macht das schon — OpenLoom fokussiert auf Video+Meetings)
- Keine Cloud-Services ausser User-supplied R2 / User-supplied Hono-Server
- NLLB-200 nicht nutzen (CC-BY-NC)
- Easydict/LibreTranslate/Cap/sendrec/loomola Code nicht kopieren (GPL/AGPL)

**Lizenz:** MIT (mit `ATTRIBUTION.md` für open-loom Fork-Vermerk).

---

## 2. Ziele & Non-Goals

**Ziele — Video-Modus**
- Screen + Webcam + Mic + System-Audio-Aufnahme (macOS 14.2+ native Loopback).
- Camera-Bubble (draggable, 3 Grössen, Mirror, Hide/Show).
- Pause/Resume/Restart, Countdown, Drawing-Tool, Click-Highlights, Global Shortcuts.
- Crash-Recovery.
- Library: SQLite + Folders + Search + Thumbnail-Grid + Hover-Preview.
- Editing: Trim, Cut middle, Stitch, Filler-Word-Removal, Custom Thumbnails.
- Lokale Transkription (whisper.cpp small).
- AI-Summaries/Chapters/Action-Items via Ollama (Zero-Config-Default, BYOK optional).
- Sharing Tier 1: Self-hosted Hono-Server (Docker) → Watch-Page, Comments, Reactions, Analytics, Password, Expiry, CTA, Email-Gate, Branding, Embed.
- Sharing Tier 2: Cloudflare R2 (presigned multipart + static player page).
- Instant Link-Minting (Link in clipboard SOFORT bei Stop, Upload im Background).
- Viewer Analytics: View-Count, Completion-Funnel, CTA-CTR.

**Ziele — Meeting-Modus**
- Audio-only-Aufnahme (Mik + System-Audio, kein Video nötig).
- Live-Transkription mit Whisper small (echtzeitnah, streaming mit VAD-Segmentierung).
- Strukturierte Summary mit Header (Datum, Start-/Endzeit, Dauer, erkannte Teilnehmer, besprochene Themen) + vollem Transkript.
- 1-Klick-Export: PDF, DOCX, Markdown.
- Session Memory: SQLite, alle Meetings speichern, durchsuchen, wieder öffnen.
- Lokale Summary-Generierung via Ollama.
- Meeting-Sessions in derselben Library wie Video-Sessions (einheitliche UI).

**Ziele — Geteilt (beide Modi)**
- `matteoise-ui-kit` für UI (Granola×MacWhisper Dark-Mode, Serif-Typografie, Granola-Green Accent).
- Electron mit Vibrancy + hiddenInset + Dark-Mode-only.
- Einheitliche Library (Videos + Meetings gemischt, filterbar nach Typ).
- Einheitlicher AI-Stack (Ollama für Summaries, whisper.cpp/mlx-whisper für Transkription).
- Einheitliche Settings (Ollama-Endpoint, R2-Creds, Hotkeys, Models).
- Globale Hotkeys (z.B. Cmd+Shift+V = Video, Cmd+Shift+M = Meeting).

**Non-Goals (v1)**
- Speaker-Diarization (v1.1).
- Auto-Meeting-Detection via Kalender (v1.2).
- Inline-Grammar-Check in Textfeldern (das macht OpenLingo).
- Diktat-Everywhere (das macht OpenSuperWhisper).
- Windows/Linux Desktop (macOS-first; Electron-Code portabel aber ungetestet v1).
- Team Workspaces mit RBAC (v2).
- 4K-Aufnahme.
- AI-Cursor-Zoom / Auto-Framer.

---

## 3. Tech-Stack

| Schicht | Wahl | Begründung |
|--------|------|-----------|
| Basis | Fork von `jayden9889/open-loom` (MIT) | Video-Modus-Basis, alle Bausteine drin |
| Desktop-Shell | Electron + TypeScript + React | Vibe-Coding-freundlich, Cross-Platform |
| UI-Kit | `matteoise-ui-kit` (Git Submodule) | Granola×MacWhisper Dark-Mode, Serif, Granola-Green |
| Recording (Video) | Electron `desktopCapturer` + `getUserMedia` + `MediaRecorder` | Browser-nativ |
| Recording (Meeting) | `AudioContext` + `MediaRecorder` (audio-only) ODER Python-Sidecar (`sounddevice`) falls nötig | Reuse Audio-Pipeline |
| System-Audio | macOS 14.2+ native Loopback (im Basis-Fork) | Kein BlackHole nötig |
| Video-Encoding | `ffmpeg` (static binary via `ffmpeg-static`) | Standard |
| Transkription (Video) | `whisper.cpp` (`nodejs-whisper` ODER Spawn) | Lokal, gratis |
| Transkription (Meeting live) | `mlx-whisper` via Python-Sidecar (Apple Silicon) ODER `whisper.cpp` streaming | Echtzeit auf M-Chip |
| AI-Summaries | `ollama` JS-Client → `llama3.2` Default; BYOK optional | User will lokal; Ollama läuft eh |
| Local-Storage | SQLite (`better-sqlite3`) + FTS5 | vom Basis-Fork |
| Share-Server | Hono + SQLite (`@hono/node-server` + `better-sqlite3`) | vom Basis-Fork |
| Cloud-Sharing | Cloudflare R2 (`@aws-sdk/client-s3` presigned multipart) | 10 GB gratis, null Egress |
| PDF-Export | `pdf-lib` ODER `pdfkit` (Node-native) | Meeting-Modus PDF-Export |
| DOCX-Export | `docx` (npm package) | Meeting-Modus DOCX-Export |
| MD-Export | String-Templates | Trivial |
| Container | Docker Compose für self-hosted Hono-Server | Standard |
| Secrets | OS-Keychain (`keytar`) | vom Basis-Fork |
| Tests | Vitest (Unit/Integration) + Playwright (E2E optional) | moderner JS-Standard |

---

## 4. Architektur

```
open-loom/
├── README.md
├── BLUEPRINT.md            (diese Datei)
├── AGENTS.md
├── START_PROMPT.md
├── ATTRIBUTION.md
├── LICENSE                 (MIT)
├── .gitignore
├── .gitmodules             (matteoise-ui-kit Submodule)
├── package.json            (root, npm workspaces)
├── src/ui-kit/             (Submodule: matteoise-ui-kit)
├── apps/
│   ├── desktop/            (Electron-App)
│   │   ├── src/
│   │   │   ├── main/
│   │   │   │   ├── video/          (Video-Modus)
│   │   │   │   │   ├── capture.ts
│   │   │   │   │   ├── encoder.ts
│   │   │   │   │   ├── editor.ts
│   │   │   │   │   ├── filler-remove.ts
│   │   │   │   │   └── thumbnail.ts
│   │   │   │   ├── meeting/        (Meeting-Modus — aus voicemeet integriert)
│   │   │   │   │   ├── audio-capture.ts   (Mik+System audio-only)
│   │   │   │   │   ├── vad.ts             (Voice-Activity-Detection)
│   │   │   │   │   ├── live-transcribe.ts (streaming whisper)
│   │   │   │   │   ├── summarize.ts       (Ollama Header+Themen+Transkript)
│   │   │   │   │   └── export.ts          (PDF/DOCX/MD)
│   │   │   │   ├── shared/
│   │   │   │   │   ├── transcribe.ts      (whisper.cpp wrapper — beide Modi)
│   │   │   │   │   ├── ollama.ts          (Ollama client — beide Modi)
│   │   │   │   │   ├── store.ts           (SQLite — sessions: video|meeting)
│   │   │   │   │   └── shortcuts.ts       (global hotkeys)
│   │   │   │   └── crash-recovery.ts
│   │   │   ├── preload/
│   │   │   └── renderer/
│   │   │       ├── library/       (einheitlich: Videos + Meetings, filterbar)
│   │   │       ├── video/         (Video-Modus UI: recorder, editor, share)
│   │   │       ├── meeting/       (Meeting-Modus UI: live-transcript, summary, export)
│   │   │       └── settings/      (einheitlich: Ollama, R2, Hotkeys, Models)
│   │   └── package.json
│   └── server/             (Hono self-hosted Share-Server — Video-Modus)
│       ├── src/
│       │   ├── routes/     (videos, comments, reactions, analytics, auth)
│       │   ├── storage/    (R2 presigned)
│       │   └── embed.ts
│       ├── Dockerfile
│       ├── docker-compose.yml
│       └── package.json
├── packages/
│   ├── shared/             (Types, Zod-Schemas)
│   └── player/             (custom video player — Video-Modus)
├── sidecars/
│   └── mlx_whisper/        (Python-Sidecar für live Meeting-Transkription)
│       ├── server.py        (FastAPI: /transcribe streaming)
│       └── requirements.txt
├── scripts/
│   ├── fork-sync.sh
│   └── setup-r2.ts
└── tests/
    ├── unit/
    ├── integration/
    └── e2e/
```

**Datenfluss Video-Modus:**
```
desktopCapturer+getUserMedia+MediaRecorder → Pause/Resume/Recovery
  → ffmpeg remux to MP4 → Library
  → Link minted (R2 presigned ODER Hono) → Clipboard SOFORT
  → Background: whisper.cpp transcribe → Ollama summarize
  → Background: R2 multipart upload ODER Hono-Upload
  → Watch-Page: Player + CTA + Comments + Analytics
```

**Datenfluss Meeting-Modus:**
```
Audio-Capture (Mik+System, audio-only) → VAD (Segment-Pausen)
  → mlx-whisper streaming (Rolling-Chunks) → Live-Transcript-UI
  → Segmente in SQLite (Session Memory)
  → [Stop] → Ollama Summary (Header: Datum/Uhrzeit/Dauer/Teilnehmer/Themen + Transkript)
  → Export-Pipeline (PDF/DOCX/MD) → Datei + DB-Link
  → Library-Eintrag (Typ: meeting)
```

---

## 5. Implementierungs-Phasen

### Phase 0 — Projekt-Gerüst + Fork-Setup + UI-Kit (Commit: `chore: scaffold + open-loom fork + matteoise-ui-kit submodule`)
- npm workspaces, `package.json` root.
- Basis-Code von `jayden9889/open-loom` übernehmen (Code als Startpunkt, `ATTRIBUTION.md` mit Fork-Vermerk).
- `matteoise-ui-kit` als Git Submodule unter `src/ui-kit/` einbinden.
- `globals.css` importieren, `matteoise-ui-kit`-Komponenten in Renderer verfügbar machen.
- Electron-Main mit `vibrancy: 'under-window'`, `titleBarStyle: 'hiddenInset'`, `nativeTheme.themeSource = 'dark'` (Referenz: `src/ui-kit/electron/main.ts`).
- `.gitignore`, `README.md` Skeleton, `AGENTS.md`, `ATTRIBUTION.md`.
- **Verifikation:** `pnpm install` läuft; `pnpm dev` startet Electron-App mit Granola×MacWhisper-Dark-Look.

### Phase 1 — Video Recording Pipeline (Commit: `feat: video recording with crash recovery + global shortcuts`)
- Verifiziere Basis-Recording: Screen+Cam+Mic, Camera-Bubble, Pause/Resume.
- Ergänze: Crash-Recovery, Global Shortcuts (Cmd+Shift+V), Drawing-Tool, Click-Highlights, Countdown.
- **Verifikation:** 10s Video-Aufnahme → MP4 abspielbar; App-Relaunch nach Kill → Recovery-Dialog.

### Phase 2 — Meeting Recording Pipeline (Commit: `feat: meeting mode audio capture + vad + live transcript`)
- `meeting/audio-capture.ts`: Audio-only (Mik+System), 16kHz mono, `AudioContext` + `MediaRecorder` ODER Python-Sidecar falls nötig.
- `meeting/vad.ts`: Energie-basierte VAD, Segment-Grenzen bei Pausen.
- `sidecars/mlx_whisper/server.py`: FastAPI-Streaming-Server, `mlx-community/whisper-small-mlx`, `/transcribe` Endpoint mit rolling chunks.
- `meeting/live-transcribe.ts`: Sidecar-Client, live `on_segment(text)` Callback für UI.
- `meeting/` UI: Live-Transcript-View (Serif-Body via `.mk-editorial`), Speaker-Placeholder, Timer.
- Global Shortcut Cmd+Shift+M startet Meeting-Modus.
- **Verifikation:** Cmd+Shift+M → 30s sprechen → Live-Transcript erscheint echtzeitnah; Stop → Session in Library.

### Phase 3 — Einheitliche Library + SQLite (Commit: `feat: unified library for videos and meetings`)
- SQLite-Schema erweitert: `sessions` Tabelle mit `type` Column (`video` | `meeting`).
- `video`-Sessions: path, duration, thumbnail, transcript, ai_summary, share_url, share_mode.
- `meeting`-Sessions: path (audio), duration, transcript, summary_header JSON (date, time, participants, topics), exports JSON.
- Library-UI: einheitliches Grid, Filter nach Typ (Alle / Videos / Meetings), Search (FTS5 über title+transcript), Folders.
- `ListItem` aus `matteoise-ui-kit` — Icon unterscheidet Video vs Meeting.
- **Verifikation:** 1 Video + 1 Meeting in Library → Filter klappt → Search findet beide via Transcript.

### Phase 4 — Transkription + AI (beide Modi) (Commit: `feat: whisper transcription + ollama ai summaries`)
- `shared/transcribe.ts`: whisper.cpp Wrapper (Video-Modus: post-processing; Meeting-Modus: reuses live-transcribe).
- `shared/ollama.ts`: Ollama-Client, Default `llama3.2`, Zero-Config.
- Video-Modus: Caption-Generation, AI-Title/Chapters/Action-Items.
- Meeting-Modus: `meeting/summarize.ts` — Ollama-Prompt erzeugt JSON `{ title, participants, topics, summary_markdown, action_items }` → Header-Builder formatiert Datum (DE), Start/End, Dauer, Teilnehmer, Themen → dann Summary → dann Transkript.
- UI: AI-Fields editable (User kann Title/Summary überschreiben).
- **Verifikation:** Video → Captions + AI-Summary; Meeting → Header-Struktur mit Datum/Teilnehmern/Themen + Transkript.

### Phase 5 — Export Pipeline (Meeting-Modus) (Commit: `feat: meeting export pdf docx markdown`)
- `meeting/export.ts`:
  - `exportMarkdown(session)`: Header + Summary + Transkript mit Zeitstempeln → MD.
  - `exportPdf(session)`: `pdf-lib`/`pdfkit` — sauberes Layout (Titel, Metadaten-Tabelle, Summary-Block, Transkript).
  - `exportDocx(session)`: `docx` npm package — gleiche Struktur.
- CLI/UI: "Export as..." → PDF / DOCX / MD / All.
- Export-Pfad in DB gespeichert.
- **Verifikation:** 1 Meeting → alle 3 Formate exportiert → Dateien existieren + Inhalt korrekt.

### Phase 6 — Video Editing (Commit: `feat: video editor trim cut stitch filler removal thumbnails`)
- Timeline-UI, Trim, Cut middle, Stitch via ffmpeg.
- Filler-Word-Removal: Wort-Level-Transcript → ffmpeg-Audio-Edits.
- Custom Thumbnails: ffmpeg seek+screenshot ODER Upload.
- **Verifikation:** Trim 5s aus Mitte → Output korrekt; Filler-Removal kürzt "ähm"s.

### Phase 7 — Sharing Tier 1: Hono Server (Commit: `feat: hono share server with comments reactions analytics`)
- `apps/server/`: Hono + SQLite, Routes für videos, comments, reactions, analytics, auth (password), expiry, email-gate, branding, embed.
- Docker Compose.
- **Verifikation:** `docker compose up -d` → Upload → Link → Watch-Page klappt.

### Phase 8 — Sharing Tier 2: Cloudflare R2 (Commit: `feat: r2 sharing with presigned multipart + instant link`)
- `@aws-sdk/client-s3` multipart, `scripts/setup-r2.ts` helper.
- Instant Link-Minting bei Stop, Upload im Background.
- Self-contained static player page in R2.
- **Verifikation:** R2-Creds → 30s Video → Link in Clipboard → Browser spielt.

### Phase 9 — Premium Watch-Page Features (Commit: `feat: cta email gate branding embed`)
- CTA-Buttons + Click-Tracking, Email-Gate, Custom-Branding (CSS injection), Embed-Code (iframe).
- **Verifikation:** Tier 1: CTA + Email-Gate + Branding + Embed funktionieren.

### Phase 10 — Viewer Analytics (Commit: `feat: viewer analytics dashboard`)
- Analytics-View pro Video: View-Count, Completion-Funnel (25/50/75/100%), CTA-CTR, Daily-Charts.
- **Verifikation:** Analytics zeigt echte Zahlen nach Test-Views.

### Phase 11 — Polish + Github-Readiness (Commit: `docs: readme license attribution ci demo`)
- README komplett (Features, Architecture, Install, Comparison vs Loom/Granola/Cap, Roadmap).
- Demo-GIF, CI, Release v0.1.0 tag.
- **Verifikation:** `pnpm build && pnpm test` grün; Repo push-ready.

---

## 6. Verifikations-Strategie

- `pnpm typecheck && pnpm lint && pnpm test` nach jeder Phase.
- Smoke-Tests: Video-Recording (Phase 1), Meeting-Live-Transcript (Phase 2), Export (Phase 5), R2-Sharing (Phase 8).
- Brand-Alignment: `matteoise-ui-kit`-Komponenten genutzt, Granola-Dark-Palette, Serif-Typografie, keine hartkodierten Farben.

---

## 7. Commit-Konvention

Conventional Commits. Keine Secrets, R2-Creds, `.env`, DBs, `recordings/`, `uploads/`, ffmpeg-Binarys, `node_modules/`, `src/ui-kit/` (Submodule) committen.

---

## 8. Bekannte Fallstricke

- **open-loom Repo-Erreichbarkeit:** Falls `jayden9889/open-loom` nicht existiert → Architektur manuell aufbauen (Blueprint ist self-contained).
- **Electron + Python-Sidecar** für Live-Meeting-Transkription: Sidecar via `child_process.spawn`, lazy start, idle stop.
- **mlx-whisper** nur Apple Silicon. Intel → faster-whisper-Fallback.
- **R2 CORS** braucht `ExposeHeaders: ["ETag"]` für multipart — `scripts/setup-r2.ts` setzt es.
- **AGPL-Code NICHT kopieren** (Cap, sendrec, loomola) — nur Patterns, MIT-clean neu implementieren.
- **matteoise-ui-kit ist privat** — als Submodule eingebunden ist OK (nur kompiliert in Builds).
- **Granola-Green `#19C332`** ist die Accent-Farbe — nicht Apple Blue.
- **Serif-Typografie Pflicht** für Content (Transcripts, Summaries, Notes) — `.mk-editorial` Klasse nutzen.

---

## 9. Github-Publishing-Checkliste

- [ ] README mit Architecture-Diagramm + Demo-GIF + Comparison (vs Loom/Granola/Cap/Meetily)
- [ ] LICENSE (MIT), ATTRIBUTION, CONTRIBUTING, ROADMAP, CHANGELOG
- [ ] CI: GitHub Actions `typecheck + lint + test`
- [ ] Docker-Compose für Hono-Server
- [ ] R2-Setup-Guide
- [ ] Release v0.1.0 tag
- [ ] Topics: `loom-alternative`, `granola-alternative`, `meeting-notes`, `screen-recorder`, `async-video`, `local-ai`, `ollama`, `whisper`, `electron`, `open-source`
- [ ] Description: "Open-source Loom + Granola — video sharing AND meeting notes. Local AI, zero cost, self-hosted."

---

## 10. Roadmap

- **v1.1** Speaker-Diarization (pyannote ODER mlx-diarization).
- **v1.2** Auto-Meeting-Detection + Kalender-Integration.
- **v1.3** Windows/Linux.
- **v1.4** macOS Code-Signing + Notarization.
- **v1.5** Team Workspaces mit RBAC.
- **v2.0** Chat with meetings/videos (RAG über Session-DB via lokale Embeddings).
