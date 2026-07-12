# Attribution

`loomforge` is based on [open-loom](https://github.com/jayden9889/open-loom) by jayden9889 (MIT, July 2026).
Fork initialized July 2026 with premium-feature additions (CTA, comments, reactions, analytics,
password, expiry, email gate, branding, embed, filler-word removal, custom thumbnails).

## Open-Source Dependencies (key ones)

- [open-loom](https://github.com/jayden9889/open-loom) — MIT — basis fork
- [Electron](https://www.electronjs.org/) — MIT — desktop shell
- [Hono](https://hono.dev/) — MIT — share server
- [better-sqlite3](https://github.com/WiseLibs/better-sqlite3) — MIT — local storage
- [ffmpeg](https://ffmpeg.org/) via `ffmpeg-static` — LGPL/ISC — video encoding/editing
- [whisper.cpp](https://github.com/ggerganov/whisper.cpp) — MIT — local transcription
- [Ollama](https://ollama.com/) — MIT — local LLM for summaries
- [Cloudflare R2](https://developers.cloudflare.com/r2/) — S3-compatible object storage (user-supplied)
- [Vitest](https://vitest.dev/) — MIT — testing

## Patterns inspired by (no code copied — AGPL sources observed but reimplemented MIT-clean)

- [Cap](https://github.com/CapSoftware/Cap) (AGPL) — Instant-Mode link-minting pattern
- [sendrec](https://github.com/sendrec/sendrec) (AGPL) — email gate + CTA CTR + completion funnel
- [voom](https://github.com/aritropaul/voom) (MIT) — filler-word removal + 30-day expiry cron
- [loomola](https://github.com/Deducer/loomola) (AGPL) — honest non-goals documentation approach
