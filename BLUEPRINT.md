# loomforge — Bauplan

> Open-Source-Loom-Alternative mit allen Premium-Features — gratis, lokal, selbstgehostet. Screen + Webcam + Audio-Aufnahme, lokales Whisper für Captions, lokales Ollama für AI-Summaries, 1-Klick-Share-Link via Cloudflare R2 ODER self-hosted Hono-Server. Trim, Cut, Filler-Word-Removal, Chapters, CTA, Comments, Analytics, Password, Expiry, Branding, Embeds. Alles lokal, MIT-lizenziert, Github-publishable.

---

## 1. Kontext-Brief (für frischen Agent, kalt startbar)

**Was das Projekt ist:** Eine Open-Source-Alternative zu Loom/Tella/Capsule. Desktop-App (Electron + TypeScript + React) nimmt Bildschirm + Webcam + Mikrofon + System-Audio auf, bietet eine Editing-Pipeline (Trim, Cut, Filler-Word-Removal, Thumbnails), transkribiert lokal mit whisper.cpp, generiert AI-Summaries/Chapters/Action-Items via lokalem Ollama (keine API-Keys nötig), und teilt via 1-Klick-Link — entweder über einen self-hosted Hono-Server (Docker) oder über Cloudflare R2 (presigned multipart upload + statische Player-Seite, 10 GB gratis).

**Beziehung zu bestehenden OSS-Projekten:**
- **Basis = Fork von [jayden9889/open-loom](https://github.com/jayden9889/open-loom)** (MIT, Jul 7 2026). Liefert: Electron-Recorder mit Screen+Cam+Mic, macOS native Loopback ab 14.2, Camera-Bubble, Pause/Resume, Crash-Recovery, Library, Trim/Cut/Stitch, lokales whisper.cpp, BYOK AI, Hono-Share-Server, Cloudflare R2-Pfad. Frisch, MIT, alle Bausteine drin — idealer Startpunkt.
- **Inspiration für fehlende Premium-Features:**
  - [voom](https://github.com/aritropaul/voom) — Filler-Word-Removal Pattern, 30-day-Expiry+Cron, CTA-Overlay.
  - [sendrec](https://github.com/sendrec/sendrec) — Email-Gate, CTA-Click-Tracking, Viewer-Completion-Funnel, Custom-Branding-CSS, SSO-Strategie.
  - [Cap](https://github.com/CapSoftware/Cap) — Instant-Mode (Link minted bevor Upload fertig ist), Embed-SDK, Multi-Platform-Patterns.
  - [loomola](https://github.com/Deducer/loomola) — Ehrlichste Doku über was NICHT geht; signed Deepgram-Callback-Nonces als Security-Pattern.

**Was du hinzufügst (Premium-Feature-Delta):**
- **Lokaler Ollama als Default-AI-Provider** (open-loom hat BYOK; wir setzen Ollama als Zero-Config-Default darauf).
- Filler-Word-Removal (Wort-Level-Transcript + ffmpeg-Audio-Edits).
- Custom-Thumbnails (ffmpeg seek+screenshot, Upload).
- CTA-Buttons auf Watch-Page + Click-Tracking.
- Timestamped Comments + Emoji-Reactions.
- Password Protection + Time-bounded Unlock-Cookies.
- Expiry Links mit Cron-Cleanup.
- Email Gate für Viewer.
- Custom Branding (Logo, Colors, CSS Injection).
- Embed-Code (iframe-Player).
- Viewer Analytics (View-Count, Completion-25/50/75/100%, CTA-CTR, View-Funnel).
- Team Workspaces mit RBAC (v2).

**Lizenz:** MIT (mit `ATTRIBUTION.md` für open-loom Fork-Vermerk).

**Warum MIT statt AGPL:** AGPL (Cap, sendrec, loomola) zwingt dich, Modifikationen zu veröffentlichen, sobald du das Projekt hostest. MIT gibt dir volle Freiheit — du kannst es auf Github publishen, intern nutzen, modifizieren, ohne Veröffentlichungspflicht.

---

## 2. Ziele & Non-Goals

**Ziele**
- Screen + Webcam + Mic + System-Audio-Aufnahme (macOS 14.2+ native Loopback, kein BlackHole nötig).
- Camera-Bubble (draggable, 3 Grössen, Mirror, Hide/Show mid-Recording).
- Pause/Resume/Restart, Countdown, Drawing-Tool, Click-Highlights, Global Shortcuts.
- Crash-Recovery (abgebrochene Aufnahme wird beim nächsten Launch angeboten).
- Local Library: SQLite + Folders + Search + Thumbnail-Grid + Hover-Preview.
- Editing: Trim, Cut middle sections, Stitch clips.
- Lokale Transkription (whisper.cpp small, Apple Silicon MLX-fähig falls möglich).
- AI-Summaries/Chapters/Action-Items default via Ollama (`llama3.2` o.ä.) — Zero-Config, BYOK optional.
- Custom Player (0.8x–2.5x speeds, Captions, Chapters).
- Sharing Tier 1: Self-hosted Hono-Server (Docker Compose) → Watch-Page, Comments, Reactions, Analytics, Password, Expiry, CTA, Email-Gate, Branding, Embed.
- Sharing Tier 2: Cloudflare R2 (presigned multipart upload + self-contained static player page → public URL, kein Server nötig).
- Link minted to clipboard **instant bei Recording-Stop** (Upload läuft im Hintergrund) — Cap's "Instant Mode"-Pattern.
- Filler-Word-Removal.
- Custom Thumbnails (ffmpeg seek+screenshot, Upload).
- Viewer Analytics: View-Count, Completion-25/50/75/100%, CTA-CTR, Daily-Charts.
- Alles lokal ausser User-supplied R2 / User-supplied Hono-Server. Keine Phone-Home, keine Telemetrie.

**Non-Goals (v1)**
- Team Workspaces mit RBAC (v2 — Single-User first).
- SSO/SAML/SCIM (Enterprise-Feature, v2).
- iOS/Android native Apps (Web-Player reicht zum Anschauen).
- Windows/Linux Desktop-App (macOS-first; Electron-Code ist portabel, aber ungetestet v1).
- Live-Streaming (kein Twitch/YT-Streaming).
- 4K-Aufnahme (1080p Default, 1440p optional).
- AI-Cursor-Zoom / Auto-Framer (v2 — heavy CV-Pipeline).
- Extensions-Marketplace (v2 — Cap/Recordly haben das).

---

## 3. Tech-Stack

| Schicht | Wahl | Begründung |
|--------|------|-----------|
| Basis | Fork von `jayden9889/open-loom` | MIT, frisch, alle Bausteine drin |
| Desktop-Shell | Electron + TypeScript + React | vom Basis-Fork übernommen |
| Recording | Electron `desktopCapturer` + `getUserMedia` + `MediaRecorder` (MP4 Chrome 130+/Safari, WebM fallback) | Browser-nativ, kein nativer Code nötig für v1 |
| System-Audio (macOS) | Native Loopback ab macOS 14.2 (im Basis-Fork) | Kein BlackHole nötig |
| Video-Encoding/Editing | `ffmpeg` (static binary via `ffmpeg-static` npm) | Standard, gratis, cross-platform |
| Transcription | `whisper.cpp` (node-binding `nodejs-whisper` oder eigener Spawn) | Lokal, gratis, Apple-Silicon-fast |
| AI-Summaries | `ollama` JS-Client → lokales Modell Default (`llama3.2`); BYOK Anthropic/OpenAI optional | User will alles lokal; Ollama läuft eh |
| Local-Storage | SQLite (`better-sqlite3`) + FTS5 für Search | vom Basis-Fork übernommen |
| Share-Server | Hono + SQLite (`@hono/node-server` + `better-sqlite3`) | vom Basis-Fork übernommen, leichtgewichtig |
| Cloud-Sharing | Cloudflare R2 (S3-compatible, `@aws-sdk/client-s3` für presigned multipart) | 10 GB gratis, null Egress, etabliert |
| Container | Docker Compose für self-hosted Hono-Server | Standard, einfaches `docker compose up -d` |
| Secrets | OS-Keychain (`keytar`) | vom Basis-Fork übernommen |
| UI | Tailwind CSS + shadcn/ui (falls Basis das nutzt, sonst Basis-Style folgen) | schnell, hübsch |
| Tests | Vitest (Unit/Integration) + Playwright (E2E Recording-Flow, optional) | moderner JS-Standard |

**System-Voraussetzungen:**
- macOS 13+ (14.2+ für native System-Audio-Loopback, sonst BlackHole-Fallback).
- Node.js 20+ (LTS).
- `ollama` installiert + `ollama pull llama3.2`.
- Für R2-Sharing: Cloudflare-Account + R2-Bucket + API-Token (User-supplied).
- Für self-hosted Hono-Server: Docker ODER Node 20+ direkt.

---

## 4. Architektur

```
loomforge/
├── README.md
├── BLUEPRINT.md            (diese Datei)
├── AGENTS.md               (opencode-Kontext)
├── START_PROMPT.md         (für autonome Session)
├── ATTRIBUTION.md          (Fork-Vermerk an open-loom)
├── LICENSE                 (MIT)
├── .gitignore
├── package.json            (root, npm workspaces)
├── turbo.json              (falls Basis Turborepo nutzt — übernehmen)
├── apps/
│   ├── desktop/            (Electron-App: main/preload/renderer)
│   │   ├── src/
│   │   │   ├── main/       (Electron main process: recording, ffmpeg, whisper, ollama)
│   │   │   │   ├── capture.ts       (desktopCapturer + MediaRecorder-Setup)
│   │   │   │   ├── audio-loopback.ts (macOS 14.2+ native Loopback-Detect)
│   │   │   │   ├── encoder.ts       (ffmpeg-Encoding/Remuxing)
│   │   │   │   ├── editor.ts        (Trim/Cut/Stitch via ffmpeg)
│   │   │   │   ├── filler-remove.ts (Wort-Level-Transcript → ffmpeg-Audio-Edits)
│   │   │   │   ├── thumbnail.ts     (ffmpeg seek+screenshot)
│   │   │   │   ├── transcribe.ts    (whisper.cpp-Spawn + Chunking)
│   │   │   │   ├── summarize.ts     (Ollama-Default + BYOK-Optional)
│   │   │   │   ├── crash-recovery.ts (abgebrochene Aufnahme wiederherstellen)
│   │   │   │   └── shortcuts.ts     (global Hotkeys via Electron globalShortcut)
│   │   │   ├── preload/   (Context-Bridge IPC)
│   │   │   └── renderer/  (React UI)
│   │   │       ├── library/ (Thumbnail-Grid, Folders, Search, Hover-Preview)
│   │   │       ├── editor/  (Timeline, Trim, Cut, Stitch)
│   │   │       ├── settings/(Ollama-Endpoint, R2-Creds, AI-Provider, Shortcuts)
│   │   │       └── share/   (Upload-Progress, Link-Mint, Copy-to-Clipboard)
│   │   └── package.json
│   └── server/             (Hono self-hosted Share-Server)
│       ├── src/
│       │   ├── index.ts            (Hono-App, Port aus env)
│       │   ├── routes/
│       │   │   ├── videos.ts       (CRUD, GET watch page)
│       │   │   ├── comments.ts     (timestamped comments)
│       │   │   ├── reactions.ts    (emoji reactions)
│       │   │   ├── analytics.ts    (view events, completion beacons)
│       │   │   └── auth.ts         (password unlock, email gate)
│       │   ├── middleware/
│       │   │   ├── branding.ts     (DB-stored brand profile + CSS injection)
│       │   │   └── expiry.ts       (expires_at check + cron cleanup)
│       │   ├── storage/
│       │   │   └── s3.ts           (R2-presigned multipart upload + GET)
│       │   ├── embed.ts            (iframe-Player-Endpoint)
│       │   └── db.ts               (better-sqlite3 schema)
│       ├── Dockerfile
│       ├── docker-compose.yml
│       └── package.json
├── packages/
│   ├── shared/             (Types, Schemas, Zod-Validation)
│   │   ├── src/
│   │   │   ├── schemas.ts          (Video, Comment, Reaction, Analytics-Event, Branding)
│   │   │   └── types.ts
│   │   └── package.json
│   └── player/             (custom video player, in desktop + embed verwendet)
│       ├── src/
│       │   ├── Player.tsx          (speed, captions, chapters, CTA-overlay)
│       │   └── Analytics.ts        (completion beacons)
│       └── package.json
├── scripts/
│   ├── fork-sync.sh        (upstream open-loom merges)
│   └── setup-r2.ts         (R2-Bucket + CORS + Lifecycle-Policy helper)
└── tests/
    ├── unit/               (Vitest)
    ├── integration/        (Hono-Server, R2-Mock via MinIO)
    └── e2e/                (Playwright: record → stop → share → watch)
```

**Datenfluss:**
```
User click "Record" → Electron main: desktopCapturer+getUserMedia+MediaRecorder
    → Pause/Resume/Crash-Recovery-Checkpoints in temp
    → Stop → ffmpeg remux to MP4 → save in library
    → Link minted to clipboard SOFORT (R2 presigned URL ODER Hono-Endpoint)
    → Background: whisper.cpp transcribe → Ollama summarize (title/chapters/action items)
    → Background: R2 multipart upload ODER Hono-Server-Upload
    → Library-Entry aktualisiert mit Transcript + AI-Metadaten + Share-URL
    → Watch-Page: Player + CTA + Comments + Reactions + Analytics-Beacons
```

---

## 5. Implementierungs-Phasen (je eigener Commit-Bereich)

### Phase 0 — Projekt-Gerüst + Fork-Setup (Commit: `chore: scaffold project + open-loom fork base`)
- Repo-Init, `package.json` root, npm workspaces (apps/desktop, apps/server, packages/shared, packages/player).
- **Basis-Code von `jayden9889/open-loom` übernehmen** (manuell — NICHT `git clone` als Submodul, sondern Code als Startpunkt kopieren + `ATTRIBUTION.md` mit Fork-Vermerk). Falls open-loom nicht mehr erreichbar → Blueprint-Struktur manuell aufbauen, aber das ist Fallback.
- `ATTRIBUTION.md`: "Based on [open-loom](https://github.com/jayden9889/open-loom) by jayden9889 (MIT). Fork initialized Jul 2026."
- `.gitignore`: Node, Electron-Build-Artifakte, SQLite-DBs, R2-Creds, `.env`, `recordings/`, `uploads/`.
- `README.md` Skeleton, `AGENTS.md` für opencode.
- `turbo.json` falls Basis Turborepo nutzt (übernehmen).
- **Verifikation:** `pnpm install` (od. `npm install`) läuft; `pnpm dev` startet Electron-App ohne Crash (Basis-Recording-Fenster sichtbar).

### Phase 1 — Recording-Pipeline verify + extend (Commit: `feat: recording pipeline with crash recovery + global shortcuts`)
- Verifiziere dass Basis-Recording läuft: Screen+Cam+Mic, Camera-Bubble draggable, Pause/Resume.
- Ergänze falls fehlend: Crash-Recovery (Checkpoint in temp-Dir bei jedem Pause/Resume; beim Launch prüfen + Dialog "Abgebrochene Aufnahme wiederherstellen?").
- Ergänze: Global Shortcuts (`CommandOrControl+Shift+R` start/stop, `+Shift+P` pause) via Electron `globalShortcut`.
- Ergänze: Drawing-Tool (simple Canvas-Overlay) + Click-Highlights (Maus-Klick-Visuelle-Indikator).
- Ergänze: Countdown (3-2-1) vor Aufnahme-Start.
- Smoke-Test: 10s Aufnahme → MP4 in `recordings/` ist abspielbar.
- **Verifikation:** Manuell: Start, Pause, Resume, Stop → Datei ok; App-Relaunch nach kill -9 während Aufnahme → Recovery-Dialog.

### Phase 2 — Local Library + Search + Folders (Commit: `feat: library with folders search thumbnail grid`)
- SQLite-Schema: `videos` (id, title, path, duration_s, created_at, folder_id, thumbnail_path, transcript_path, ai_summary JSON, share_url, share_mode), `folders` (id, name, parent_id), `video_fts` (FTS5 über title+transcript).
- Library-UI: Thumbnail-Grid mit Hover-Preview (erste 3s als GIF od. Video-Element-muted-loop), Folders-Sidebar, Search-Bar (FTS5), Sort (date/duration/title), Bulk-Actions (delete, move).
- Video-Detail-View: Metadata, Transcript (durchsuchbar, click-to-seek), AI-Summary-Block.
- **Verifikation:** 3 Test-Videos in Library → Search findet sie via Title+Transcript; Folders-Filter klappt.

### Phase 3 — Video Editing (Trim, Cut, Stitch) (Commit: `feat: video editor trim cut splice stitch`)
- Editor-UI: Timeline mit Waveform (od. simpler Thumbnail-Strip), Range-Selection für Trim, Multi-Range für Cut middle sections, Stitch-Modal für Clip-Zusammenfügen.
- `main/editor.ts`: ffmpeg-basierte Operationen (`-ss`/`-to` für Trim, concat demux für Stitch, multi-Trim+concat für Cut middle).
- Original wird NICHT überschrieben — Edit erzeugt neue Datei, Original bleibt.
- Undo/Redo im Editor (Stack).
- Export-Format: MP4 H.264 + AAC, 1080p default.
- **Verifikation:** Test-Video: trim 5s aus Mitte → Output-Datei richtig geschnitten; stitch 2 Clips → concat klappt.

### Phase 4 — Transcription + AI (Ollama Default) (Commit: `feat: local whisper transcription + ollama ai summaries`)
- `main/transcribe.ts`: spawn `whisper.cpp` (od. `nodejs-whisper`) mit `small` Modell, Sprache auto-detect (oder Settings), Output: Wort-Level-Transcript mit Timestamps (SRT/JSON).
- `main/summarize.ts`: Default-Provider = Ollama (`http://localhost:11434`) mit `llama3.2`. Prompt mit Zod-validiertem JSON-Output: `{ title, summary_markdown, chapters: [{title, start_s, end_s}], action_items: [...], topics: [...] }`. Fallback: BYOK Anthropic/OpenAI falls User Keys gesetzt hat.
- UI: Transcription-Progress-Indicator, AI-Generation-Indicator, Editable AI-Fields (User kann Title/Summary überschreiben).
- Captions-Rendering im Player (SRT-geladen).
- **Verifikation:** 30s Test-Video → Transcript klappt; Ollama-Call klappt (falls Ollama down → klarer Error + Fallback-Hinweis); Captions im Player sichtbar.

### Phase 5 — Sharing Tier 1: Self-hosted Hono Server (Commit: `feat: self-hosted hono share server with comments reactions password expiry`)
- `apps/server/`: Hono-App, SQLite-Schema erweitert um `comments`, `reactions`, `video_passwords`, `video_expiry`, `analytics_events`, `branding`.
- Routes:
  - `GET /v/:id` — Watch-Page (SSR HTML mit Player, CTA, Comments, Reactions).
  - `POST /v/:id/comment` — timestamped Comment.
  - `POST /v/:id/reaction` — emoji reaction (timestamped).
  - `POST /v/:id/view` — view-event log.
  - `POST /v/:id/beacon` — completion beacon (25/50/75/100%).
  - `POST /v/:id/unlock` — password check → time-bounded signed cookie (15 min).
  - `POST /v/:id/email-gate` — email submit → cookie.
- Middleware: `branding.ts` (DB-stored brand profile + CSS injection), `expiry.ts` (check `expires_at` → 410 Gone + cron cleanup).
- `Dockerfile` + `docker-compose.yml` (Hono + SQLite volume + optional MinIO für Local-S3-Tests).
- Desktop-App: "Share to Server" button → Upload via HTTP multipart → Link in Clipboard.
- **Verifikation:** `docker compose up -d` → Server läuft; Upload Video → Link in Clipboard → Watch-Page im Browser klappt; Comment + Reaction + Password + Expiry funktionieren.

### Phase 6 — Sharing Tier 2: Cloudflare R2 (Commit: `feat: cloudflare r2 sharing with presigned multipart + instant link`)
- `apps/desktop/src/main/r2.ts`: `@aws-sdk/client-s3` multipart upload mit presigned URLs.
- `scripts/setup-r2.ts`: Helper — erstellt R2-Bucket, setzt CORS (`ExposeHeaders: ["ETag"]` — wichtig für multipart), Lifecycle-Policy (z.B. auto-delete nach 90 Tagen optional).
- Flow: Bei Recording-Stop → **sofort** presigned URL für `PUT` generieren + Link minted (Hash-basierte Video-ID) → Link in Clipboard → Upload läuft im Background (multipart, resumable).
- Self-contained statische Player-Page: HTML+JS Bundle wird alongside Video in R2 hochgeladen → Share-URL = `https://<r2-domain>/v/<id>/index.html` (kein Server nötig für reine Wiedergabe).
- Settings-UI: R2-Creds (account_id, access_key, secret_key, bucket, public_domain), Keychain-Speicherung.
- Fallback: falls R2-Creds nicht gesetzt → Tier 1 Hono-Server od. "Local only"Modus.
- **Verifikation:** R2-Creds in Settings → 30s Video → Stop → Link sofort in Clipboard → Upload im BG → Link öffnet Player im Browser.

### Phase 7 — Premium Watch-Page Features (Commit: `feat: cta email gate custom branding embed iframe`)
- CTA-Buttons: pro Video konfigurierbar (Label, URL, Color, Position); Klick-Tracking via `/v/:id/cta-click` (Tier 1) od. Beacon in R2-static-page (Tier 2 — schreibt in externen Analytics-Endpoint od. local storage).
- Email Gate: Video-Setting "Require viewer email" → Watch-Page zeigt Email-Form vor Play → Cookie + server-side log.
- Custom Branding: User kann pro-Server (Tier 1) Branding setzen (Logo-URL, Primary Color, Custom CSS); `branding.ts`-Middleware injected.
- Embed Code: `/embed/:id`-Endpoint → iframe-Player (ohne Comments/Reactions, nur Player + CTA); `<iframe>`-Snippet in Watch-Page kopierbar.
- **Verifikation:** Tier 1: CTA klickbar + tracked; Email-Gate blockt Play; Branding ändert Farben; Embed-IFrame spielt Video.

### Phase 8 — Viewer Analytics + Filler-Word-Removal + Custom Thumbnails (Commit: `feat: analytics dashboard filler word removal custom thumbnails`)
- Analytics: Desktop-App hat "Analytics"-View pro Video — View-Count (unique + total), Completion-Funnel (25/50/75/100% als Bar-Chart), CTA-CTR, Daily-Charts (last 30 days). Tier 1 queried SQLite; Tier 2 = aggregierte Becons via Analytics-Endpoint (z.B. Cloudflare Workers + D1 optional, dokumentiert aber nicht built v1).
- Filler-Word-Removal: `main/filler-remove.ts` — nutzt Wort-Level-Transcript, identifiziert Filler ("ähm", "äh", "like", "you know"), generiert ffmpeg-Audio-Edits (Cut + Crossfade); UI: Toggle + Preview.
- Custom Thumbnails: `main/thumbnail.ts` — ffmpeg seek+screenshot an Timestamp ODER Upload eigener Bild; in Library + Watch-Page verwendet.
- **Verifikation:** Tier 1: Analytics-View zeigt echte Zahlen nach 3 Test-Views; Filler-Removal kürzt "ähm"s sauber; Thumbnail-Upload klappt.

### Phase 9 — Polish + Github-Readiness (Commit: `docs: readme license attribution ci demo`)
- `README.md` komplett: Features (mit Screenshots/GIF), Install (macOS, Ollama-Setup, R2-Setup optional, Docker-Setup optional), Usage, Architecture-Diagramm, Self-Hosting-Guide, Comparison-Tabelle vs Loom/Cap/sendrec, Roadmap.
- `LICENSE` (MIT), `ATTRIBUTION.md` (open-loom Fork-Vermerk + genutzte Libs), `CONTRIBUTING.md`, `ROADMAP.md`.
- GitHub Actions CI: `pnpm install && pnpm typecheck && pnpm lint && pnpm test`.
- Demo-GIF im README (Placeholder falls noch nicht aufgezeichnet).
- Release v0.1.0 git tag.
- Topics: `loom-alternative`, `screen-recorder`, `async-video`, `open-source`, `self-hosted`, `cloudflare-r2`, `whisper`, `ollama`, `electron`, `mit-license`.
- Description: "Open-source Loom alternative — all premium features, zero cost. Local transcription + AI, self-hosted or R2 sharing, full analytics."
- **Verifikation:** `pnpm install && pnpm build` klappt clean; `pnpm test` grün; Repo push-ready.

---

## 6. Verifikations-Strategie

- **Unit-Tests:** `pnpm test` (Vitest) nach jeder Phase die Logik enthält.
- **Typecheck:** `pnpm typecheck` (tsc --noEmit).
- **Lint:** `pnpm lint` (ESLint, vom Basis-Fork übernommen).
- **Smoke-Test (manuell nach Phase 1, 4, 5, 6):**
  - Phase 1: Start App → 10s record → stop → MP4 spielt.
  - Phase 4: Video transkribiert + AI-Summary generiert (Ollama läuft).
  - Phase 5: `docker compose up -d` → Upload → Link → Watch-Page.
  - Phase 6: R2-Creds → 30s video → Link in clipboard → Browser spielt.
- **E2E (Phase 9):** Playwright-Test record→stop→share→watch ( gegen lokalen Hono-Server).
- **Pre-Commit:** Optional husky + lint-staged (vom Basis-Fork falls vorhanden).

---

## 7. Commit-Konvention

Conventional Commits (`feat:`, `fix:`, `chore:`, `docs:`, `test:`, `refactor:`). Eine Phase = ein logischer Commit-Bereich (mehrere kleine Commits ok). Keine Secrets, R2-Creds, `.env`, SQLite-DBs, `recordings/`, `uploads/` committen (siehe `.gitignore`).

---

## 8. Bekannte Fallstricke

- **open-loom Erreichbarkeit:** Falls `jayden9889/open-loom` nicht mehr existiert wenn Agent startet → Blueprint-Struktur manuell aufbauen (Architektur in diesem Blueprint ist self-contained). In `PROGRESS.md` vermerken.
- **Electron-Build-Komplexität:** Electron-Apps haben Signing/Notarization-Fallstricke auf macOS. v1 = unsigned Dev-Build; README erklärt `xattr -d com.apple.quarantine`. Production-Signing = v1.1.
- **ffmpeg-static Binary** ist ~80MB — nicht committen, wird via npm postinstall entpackt. In `.gitignore`.
- **whisper.cpp Setup** auf macOS: Entweder `brew install whisper-cpp` ODER vendored Build im Basis-Fork. README dokumentiert beides.
- **R2 CORS** ist der häufigste Bug — `ExposeHeaders: ["ETag"]` zwingend für multipart. `scripts/setup-r2.ts` setzt es automatisch.
- **MediaRecorder MP4** ist nur in Chrome 130+/Safari verfügbar; Firefox = WebM-only. README kommuniziert Browser-Support-Matrix.
- **macOS System-Audio ohne 14.2:** Fallback auf BlackHole (im Basis-Fork dokumentiert) ODER mic-only. Agent muss das in Settings-UI klar machen.
- **Ollama muss laufen** (`ollama serve`). CLI prüft Verbindung beim AI-Schritt und gibt klaren Hinweis wenn down.
- **AGPL-Code NICHT kopieren:** Teile von Cap/sendrec/loomola sind AGPL — NIEMALS Code daraus kopieren. Nur Patterns/Ideen übernehmen und MIT-clean neu implementieren. `ATTRIBUTION.md` dokumentiert nur MIT-Quellen (open-loom, voom).

---

## 9. Github-Publishing-Checkliste

- [ ] README mit Architektur-Diagramm + Demo-GIF + Comparison-Tabelle
- [ ] LICENSE (MIT), ATTRIBUTION (open-loom + genutzte Libs), CONTRIBUTING, ROADMAP
- [ ] .gitignore sauber (keine DBs, Creds, Recordings, ffmpeg-Binary)
- [ ] CI: GitHub Actions `typecheck + lint + test`
- [ ] Docker-Compose für self-hosted Hono-Server dokumentiert + getestet
- [ ] R2-Setup-Guide (`scripts/setup-r2.ts` + README-Sektion)
- [ ] Release v0.1.0 tag
- [ ] Topics: `loom-alternative`, `screen-recorder`, `async-video`, `open-source`, `self-hosted`, `cloudflare-r2`, `whisper`, `ollama`, `electron`, `mit-license`
- [ ] Description: "Open-source Loom alternative — all premium features, zero cost. Local transcription + AI, self-hosted or R2 sharing, full analytics."

---

## 10. Roadmap (v1 hinaus)

- **v1.1** macOS-Code-Signing + Notarization für distributed Builds.
- **v1.2** Windows/Linux-Desktop-Apps (Electron-Code ist portabel; Test-Matrix needed).
- **v1.3** AI-Cursor-Zoom / Auto-Framer (CV-Pipeline via `@mediapipe/tasks-vision` o.ä.).
- **v1.4** Team Workspaces mit RBAC (Multi-User Hono-Server mit Sessions).
- **v1.5** SSO/SAML/SCIM für Enterprise-Self-Hosting.
- **v1.6** Mobile-Apps (iOS/Android) für Viewing + Capture.
- **v2.0** Extensions-Marketplace (à la Cap/Recordly) + Plugin-API.
