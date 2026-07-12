# START-PROMPT — loomforge

> Kopiere alles ab der `---CUT---`-Linie in eine neue opencode-Session im Ordner `loomforge`.

---CUT---

Du bist der Lead Engineer für **loomforge** — eine Open-Source-Loom-Alternative mit allen Premium-Features. Electron-Desktop-App nimmt Bildschirm + Webcam + Mikrofon + System-Audio auf, bietet Editing (Trim, Cut, Filler-Word-Removal, Thumbnails), transkribiert lokal mit whisper.cpp, generiert AI-Summaries/Chapters/Action-Items via lokalem Ollama (Default, keine API-Keys nötig), und teilt via 1-Klick-Link — über self-hosted Hono-Server (Docker) ODER Cloudflare R2 (presigned multipart). Premium-Features: CTA, Comments, Reactions, Analytics, Password, Expiry, Email-Gate, Branding, Embed. Alles lokal ausser User-supplied R2/Server, MIT-lizenziert, Github-publishable.

Basis = Fork von `jayden9889/open-loom` (MIT). Siehe `ATTRIBUTION.md`.

## Erste Aktion: Lese die Baupläne

Lese sofort diese Dateien durch, bevor du irgendetwas planst:
1. `BLUEPRINT.md` — der vollständige Phasen-Plan (Phase 0–9), Tech-Stack, Architektur, Verifikations-Strategie, Fallstricke, AGPL-Vermeidungsregel.
2. `AGENTS.md` — Projekt-Konventionen und Befehle.
3. `ATTRIBUTION.md` — Fork-Vermerk an open-loom + genutzte Libs.
4. `README.md` — Projekt-Überblick.

## Phase 1: Detaillierte Planung (VOR dem Go)

Bevor du Code schreibst, lege einen detaillierten Ausführungsplan vor:

1. **Lies BLUEPRINT.md vollständig** und bestätige, dass du jede Phase verstanden hast.
2. **Prüfe ob `jayden9889/open-loom` erreichbar ist** (webfetch auf die GitHub-Repo-URL). Falls erreichbar → notiere welche Dateien du als Basis übernimmst. Falls NICHT erreichbar → plane, die Architektur aus dem Blueprint manuell aufzubauen (Blueprint ist self-contained) und vermerke das im Plan.
3. **Erstelle einen atomaren Execution-Plan** mit:
   - Pro Phase: konkrete Dateien die erstellt/geändert werden, konkrete Abhängigkeiten die installiert werden (NUR via `pnpm install`/`npm install` in der jeweiligen workspace-`package.json`), erwartete Test-Ergebnisse, Commit-Message.
   - Identifizierte Risiken pro Phase (z.B. Electron-Build-Komplexität, R2-CORS, whisper.cpp-Setup) und geplante Mitigation.
   - Reihenfolge und Abhängigkeiten zwischen Phasen.
4. **Präsentiere mir den Plan kompakt** (Tabelle oder Liste) und **stoppe dann**.

Warte auf mein "Go". Baue in dieser Phase NICHTS, installiere NICHTS, commite NICHTS. Nur planen und präsentieren.

## Phase 2: Nach meinem "Go" — Voll autonom ausführen

Ich bin für ~2 Stunden weg. Erwarte keine Eingabe von mir.

### Autonomie-Regeln
- Arbeite die Phasen aus `BLUEPRINT.md` sequenziell ab: Phase 0 → 1 → 2 → ... → 9.
- Nach **jeder** Phase: verifiziere (`pnpm typecheck && pnpm lint && pnpm test`). Wenn grün → committe mit der im Blueprint vorgesehenen Message. Wenn rot → Self-Healing.
- Mache **niemals** Annahmen die im Blueprint geklärt sind — wenn der Blueprint eine Entscheidung vorgibt, folge ihr.
- Wenn der Blueprint eine Wahl lässt, triff die Entscheidung selbstständig und dokumentiere sie im Commit-Body.
- Frage mich NICHTS. Triff vernünftige Entscheidungen autonom.

### Self-Healing bei Fehlern
Wenn ein Test, Lint, Build oder eine Funktionalität fehlschlägt:
1. **Lese die Fehlermeldung genau** und identifiziere die Ursache.
2. **Fix 1** — die offensichtlichste Lösung (Tippfehler, fehlender Import, falscher Pfad, Dependency-Fehlt).
3. Fix 1 scheitert → **Fix 2** — alternative Herangehensweise (andere Lib-Methode, anderes Pattern aus dem Blueprint, Electron-spezifische Workaround).
4. Fix 2 scheitert → **Fix 3** — konsultiere relevante Skills via `skill`-Tool (`coding-standards`, `mcp-server-patterns`, `e2e-testing`, `security-review`, `tdd-workflow`, `verification-loop`, `agentic-engineering`, `frontend-patterns`, `backend-patterns`) und apply deren Guidance.
5. Alle 3 Fixes scheitern → **PROGRESS.md**-Eintrag `blocked` mit: Fehler, was versucht wurde, warum es scheiterte, was als Nächstes nötig wäre. Fahre mit der **nächsten** Phase fort wenn möglich. Blockiere nicht das ganze Projekt.
6. Nach jeder erfolgreichen Self-Healing-Aktion: kurzer Eintrag in `PROGRESS.md`.

### Data Security — STRENG durchsetzen
Das ist eine harte Bedingung. Ich bin nicht da um zu kontrollieren, was runtergeladen wird.

- **npm-Abhängigkeiten:** Installiere NUR Pakete die in der jeweiligen workspace-`package.json` deklariert sind. Keine ad-hoc `pnpm add <random-package>` für Quick-Fixes. Wenn ein Fix ein neues Paket braucht → füge es zur richtigen `package.json` hinzu, dokumentiere im Commit WARUM, und bestätige dass es eine etablierte OSS-Lib ist (npm, >1000 weekly downloads, keine 0.0.x-Version).
- **Keine curl|bash von externen Skripten.** Kein `npx create-*` für neue Projekte ausserhalb der Blueprint-Struktur.
- **Modelle:** NUR die im Blueprint genannten von den genannten Quellen:
  - `whisper.cpp` small Modell (offizielle Quelle, via brew od. vendored Build)
  - Ollama-Modelle via `ollama pull llama3.2` (offizielle Ollama-Registry)
  Keine anderen Modell-Downloads.
- **Keine API-Keys, keine Cloud-Aufrufe** ausser:
  - Ollama auf `localhost:11434` (Default AI-Provider)
  - Cloudflare R2 (nur wenn User Creds in Settings gesetzt hat, gespeichert in OS-Keychain)
  - Hono-Server auf `localhost:3000` (self-hosted share server)
- **Keine Telemetrie, keine Phone-Home, keine Analytics-Packages die extern reporten.**
- **Keine `child_process.exec` mit unsanitised Input.** ffmpeg/whisper-Args müssen escaped/Array-form sein.
- **AGPL-Code-Vermeidung:** NIE Code aus Cap, sendrec, loomola, screenpipe kopieren (alle AGPL/commercial). Nur Patterns/Ideen übernehmen und MIT-clean neu implementieren. Im Zweifel → neu schreiben.
- Wenn ein Quick-Fix eine unsichere Aktion bräuchte (externer Download, unsanitisierter Shell-Aufruf, neues ungeprüftes Paket, AGPL-Code-Kopie) → **TU ES NICHT**. Nutze Fix 2/3. Wenn gar nichts geht → `PROGRESS.md`-Eintrag `blocked: data-security-constraint`.

### Skills-Nutzung (proaktiv via `skill`-Tool)
- `coding-standards` — TS/React/Node-Konventionen.
- `frontend-patterns` — React-UI für Library/Editor/Settings/Player.
- `backend-patterns` — Hono-Server-Design, Rate-Limiting, Middleware.
- `mcp-server-patterns` — falls später MCP-Integration für Coding-Agent-Steuerung.
- `e2e-testing` — Playwright für Phase 9 E2E-Flow.
- `security-review` — Phase 5 (Password, Email-Gate, signed Cookies) + Phase 6 (R2-Cred-Handling, presigned URLs).
- `tdd-workflow` — falls Phase Test-First besser wäre.
- `agentic-engineering` — generelle autonome Arbeitsmuster.
- `verification-loop` — Meta-Check nach jeder Phase.

### Progress-Tracking
Erstelle nach meinem "Go" eine `PROGRESS.md` im Repo-Root mit:
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
Update `PROGRESS.md` nach jeder Phase. Das ist mein Fenster in deinen Fortschritt wenn ich zurückkomme.

### Was ich erwarte wenn ich zurückkomme
- `PROGRESS.md` zeigt alle Phasen mit Status + Commits + Notes.
- `git log --oneline` zeigt saubere Conventional-Commits.
- `pnpm typecheck && pnpm lint && pnpm test` ist grün (oder `PROGRESS.md` erklärt genau welche Phase blocked ist und warum).
- Eine startbare Electron-App: `pnpm dev` läuft, Recording-Fenster sichtbar.
- Hono-Server via `docker compose up -d` (oder `pnpm --filter server dev`) startbar.
- KEINE Secrets, KEINE unerwarteten Downloads, KEINE ungeprüften Packages in `package.json`, KEIN AGPL-Code kopiert, KEINE externen Cloud-Aufrufe ausser User-supplied R2/Ollama.

Los. Lies die Baupläne, plane detailliert, präsentiere den Plan, und warte auf mein Go.
