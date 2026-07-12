# loomforge

> Open-Source-Loom-Alternative mit allen Premium-Features — gratis, lokal, selbstgehostet. Bildschirm + Webcam + Audio-Aufnahme, lokales Whisper für Captions, lokales Ollama für AI-Summaries, 1-Klick-Share-Link via Cloudflare R2 oder self-hosted Hono-Server.

## Status

🚧 In Planung — siehe [`BLUEPRINT.md`](./BLUEPRINT.md) für den vollständigen Bauplan.

## Was es wird

Eine Desktop-App (Electron + TypeScript + React), die Bildschirm + Webcam + Mikrofon + System-Audio aufnimmt, eine Editing-Pipeline bietet (Trim, Cut, Filler-Word-Removal, Thumbnails), lokal mit whisper.cpp transkribiert, AI-Summaries/Chapters/Action-Items via lokalem Ollama generiert (keine API-Keys nötig), und via 1-Klick-Link teilt — über einen self-hosted Hono-Server (Docker) oder Cloudflare R2 (presigned multipart upload, 10 GB gratis).

Alle Premium-Features die Loom/Superata/Capsule hinter Paywalls parken: Viewer Analytics, CTA-Buttons, Timestamped Comments + Emoji Reactions, Password Protection, Expiry Links, Email Gate, Custom Branding, Embed-Codes, Filler-Word-Removal, Custom Thumbnails.

**Basiert auf** [jayden9889/open-loom](https://github.com/jayden9889/open-loom) (MIT, Jul 2026) — Fork mit Premium-Feature-Delta. Siehe [`ATTRIBUTION.md`](./ATTRIBUTION.md).

## Warum

Loom kostet irgendwann Geld. Free Boom Share ist gratis aber limitiert. Cap/sendrec/loomola sind OSS aber AGPL (Veröffentlichungspflicht für Modifikationen). `loomforge` nimmt einen MIT-lizenzierten Startpunkt und baut alle Premium-Features gratis, lokal, MIT-lizenziert dazu — volle Freiheit für dich und jeden, der es forken will.

## Lizenz

MIT — basierend auf [open-loom](https://github.com/jayden9889/open-loom) von jayden9889 (MIT).
