# START-PROMPT — OpenLoom

> Kopiere alles ab der `---CUT---`-Linie in eine neue opencode-Session im Ordner `open-loom`.

---CUT---

Du bist der Lead Engineer für **OpenLoom** — Open-Source-Loom + Open-Source-Granola in einer Electron-App. Zwei Modi: Video-Modus (Screen+Webcam aufnehmen, teilen via R2/Hono, Premium-Features wie CTA/Comments/Analytics) und Meeting-Modus (Audio live transkribieren mit Whisper, AI-Summary mit Datum/Uhrzeit/Teilnehmern/Themen, PDF/DOCX/MD-Export). Einheitliche Library, Ollama für AI, whisper.cpp/mlx-whisper für Transkription. Granola×MacWhisper Dark-Mode-UI via matteoise-ui-kit. Alles lokal, MIT-lizenziert, Github-publishable.

## Erste Aktion: Lese die Baupläne
1. `BLUEPRINT.md` — Phasen 0–11, Tech-Stack, Architektur (Video-Modus + Meeting-Modus + Shared), Fallstricke.
2. `AGENTS.md` — Konventionen, Befehle.
3. `ATTRIBUTION.md` — Lizenzen.
4. `../matteoise-ui-kit/BRAND_SYSTEM.md` — Brand-System (Granola×MacWhisper, Dark-Mode-only, Serif, Granola-Green).
5. `src/ui-kit/README.md` (falls Submodule da) ODER `../matteoise-ui-kit/README.md` — UI-Kit.

## Phase 1: Detaillierte Planung (VOR dem Go)
1. Lies BLUEPRINT.md + BRAND_SYSTEM.md vollständig.
2. Prüfe Voraussetzungen: `which node pnpm python3 ffmpeg` + `node --version` + `sw_vers`.
3. Prüfe ob `jayden9889/open-loom` erreichbar ist (webfetch). Falls ja → notiere welche Dateien du als Basis übernimmst. Falls nein → plane manuellen Aufbau.
4. Erstelle atomaren Execution-Plan: Pro Phase — Dateien, Deps, Tests, Commit-Message, Risiken + Mitigation.
5. Präsentiere den Plan kompakt und stoppe. Warte auf mein "Go". Baue NICHTS, installiere NICHTS.

## Phase 2: Nach "Go" — Voll autonom
Ich bin für ~2 Stunden weg. Erwarte keine Eingabe.

Autonomie-Regeln:
- Phasen 0→11 sequenziell. Nach jeder: `pnpm typecheck && pnpm lint && pnpm test` → commit bei Grün → Self-Healing bei Rot.
- Triff Entscheidungen autonom. Frage NICHTS.

Self-Healing:
1. Fix 1 — offensichtlichste Lösung. 2. Fix 2 — alternative aus Blueprint. 3. Fix 3 — Skills via skill-Tool (coding-standards, frontend-patterns, backend-patterns, e2e-testing, security-review, tdd-workflow, verification-loop, agentic-engineering). 4. blocked in PROGRESS.md → nächste Phase.

Data Security — STRENG:
- npm-Packages NUR aus workspace-package.json. Neue nur wenn etablierte OSS-Lib (>1000 weekly downloads), dokumentiere WARUM.
- Python-Packages (Sidecar) NUR aus sidecars/mlx_whisper/requirements.txt.
- Keine curl|bash. Kein brew install ausser im Blueprint.
- Modelle NUR: whisper.cpp small (offiziell), mlx-community/whisper-small-mlx (HuggingFace offiziell), ollama pull llama3.2. Keine anderen Downloads.
- Keine API-Keys/Cloud ausser: Ollama localhost:11434, R2 (User-Creds in Keychain), Hono localhost:3000, huggingface.co, PyPI.
- Keine Telemetrie/Analytics. Keine child_process.exec mit unsanitised Input.
- AGPL-Vermeidung: NIE Code aus Cap/sendrec/loomola/Easydict/LibreTranslate. Patterns nur, MIT-clean neu.
- matteoise-ui-kit ist privat — nicht exponieren.
- Granola-Green #19C332 ist Accent — nicht Apple Blue. Serif Pflicht für Content.

Progress-Tracking: PROGRESS.md nach jeder Phase updaten.

Erwartung bei Rückkehr: PROGRESS.md aktuell, git log sauber, pnpm typecheck+lint+test grün, pnpm dev startet Electron-App mit Granola×MacWhisper-Look, beide Modi (Video+Meeting) grundlegend funktionierend.

Los. Lies die Baupläne, plane detailliert, präsentiere den Plan, warte auf mein Go.
