/**
 * loomforge-server entry point.
 * Env: PORT, DATA_DIR, API_KEY, BASE_URL, MAX_UPLOAD_MB, CREATOR_NAME.
 * `npx loomforge-server` or `docker compose up -d` and you are live.
 */
import { serve } from '@hono/node-server';
import { loadConfig } from './config.js';
import { createServerApp } from './app.js';

const cfg = loadConfig();
const server = createServerApp(cfg);

serve({ fetch: server.app.fetch, port: cfg.port, hostname: '0.0.0.0' }, (info) => {
  console.log(`[loomforge-server] listening on http://localhost:${info.port}`);
  console.log(`[loomforge-server] base URL      ${cfg.baseUrl}`);
  console.log(`[loomforge-server] data dir      ${cfg.dataDir}`);
  console.log(`[loomforge-server] max upload    ${Math.round(cfg.maxUploadBytes / (1024 * 1024))} MB`);
  if (cfg.apiKeyGenerated) {
    console.log('[loomforge-server] no API_KEY was set, so one was generated and saved to');
    console.log(`[loomforge-server]   ${cfg.dataDir}/api-key.txt`);
  }
  // Print the key on EVERY boot so a self-hoster can always find it (a supplied
  // key never lands in api-key.txt, so this log line is the only reliable place).
  console.log(`[loomforge-server] API key: ${cfg.apiKey}`);
  console.log('[loomforge-server] paste it into LoomForge Settings then Sharing.');

  // A bare IP or localhost makes for a shady-looking share link; nudge towards a
  // real domain + HTTPS, which the watch pages and unlock cookies are built for.
  if (/^https?:\/\/(localhost|127\.0\.0\.1|0\.0\.0\.0|\d{1,3}(\.\d{1,3}){3})(:\d+)?$/i.test(cfg.baseUrl)) {
    console.warn(
      '[loomforge-server] BASE_URL is a bare host. Set BASE_URL to a real domain over HTTPS ' +
        '(e.g. https://videos.example.com) for credible, shareable links.'
    );
  }
});

function shutdown(signal: string): void {
  console.log(`[loomforge-server] ${signal} received, shutting down.`);
  server.close();
  process.exit(0);
}
process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
