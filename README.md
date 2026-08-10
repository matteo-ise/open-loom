# OpenLoom

> Open-Source-Loom + Open-Source-Granola. Video-Sharing UND Meeting-Notizen in einer App. Lokal, gratis, MIT.

## ⚠️ Bekannter Bug — vor nächster UI-Session lesen

`apps/desktop` bindet `matteo-brand` per Git-Submodule unter `src/ui-kit/` ein (`"matteo-brand": "workspace:*"` in `apps/desktop/package.json`, Paketname stimmt überein — lokal funktioniert das Setup grundsätzlich). Zwei konkrete Probleme, aufgedeckt am 2026-08-10:

1. **CI ist kaputt:** `.github/workflows/ci.yml` checkt das Submodule nicht aus (`actions/checkout@v3` ohne `submodules: recursive`) — `release.yml` macht es an der gleichen Stelle richtig. Deshalb schlägt jeder CI-Run seit mind. 12. Juli fehl ("no package named matteo-brand is present in the workspace").
2. **Submodule hängt hinterher:** aktuell gepinnt auf `4d0f855`, matteo-brand ist längst bei `928bab3` (v0.2.0 mit Select/Tabs/Accordion/Toast/ContextMenu + Fixes). **Verdacht: das ist die Ursache der wiederkehrenden UI-Bugs in der App.**

Entscheidung für später (bewusst noch offen, siehe Chat vom 2026-08-10):
- **A)** Submodule aktualisieren (`git submodule update --remote`) + CI-Checkout fixen — schnellster Weg
- **B)** `matteo-brand` stattdessen als npm-Paket veröffentlichen, entkoppelt von Submodule-Fragilität
- **C)** So lassen, Solo-Projekt, CI nicht kritisch

## Status

🚧 In Bau — siehe [`BLUEPRINT.md`](./BLUEPRINT.md).

## Was es wird

Eine macOS-Desktop-App (Electron + TypeScript + React) mit zwei Modi:

1. **Video-Modus (Loom-Style)** — Bildschirm + Webcam + Audio aufnehmen, editieren, transkribieren, AI-Summary generieren, via 1-Klick-Link teilen (self-hosted Hono-Server oder Cloudflare R2). Premium-Features: CTA, Comments, Reactions, Analytics, Password, Expiry, Email-Gate, Branding, Embed.

2. **Meeting-Modus (Granola-Style)** — Audio aufnehmen, live transkribieren (Whisper small, echtzeitnah), strukturierte Summary generieren (Datum, Uhrzeit, Dauer, Teilnehmer, Themen → Transkript), als PDF / DOCX / Markdown exportieren. Session Memory — alle Meetings durchsuchbar.

Eine App. Eine Library. Ein AI-Stack (Ollama). Eine Transkriptions-Engine (whisper.cpp/mlx-whisper).

**Video-Basis:** Fork von [jayden9889/open-loom](https://github.com/jayden9889/open-loom) (MIT). Siehe [`ATTRIBUTION.md`](./ATTRIBUTION.md).

## Warum

Loom kostet Geld für Video-Sharing. Granola/Meetily kosten Geld für Meeting-Notes. Es gibt keine OSS-App die beide kombiniert. `OpenLoom` schliesst die Lücke — gratis, lokal, MIT-lizenziert.

## Lizenz

MIT — siehe [`ATTRIBUTION.md`](./ATTRIBUTION.md).
