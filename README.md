# OpenLoom

> Open-Source-Loom + Open-Source-Granola. Video-Sharing UND Meeting-Notizen in einer App. Lokal, gratis, MIT.

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
