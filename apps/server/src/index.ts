import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { serveStatic } from '@hono/node-server/serve-static';

import { videos } from './routes/videos.js';
import { comments } from './routes/comments.js';
import { reactions } from './routes/reactions.js';
import { analytics } from './routes/analytics.js';
import { auth } from './routes/auth.js';
import { branding } from './middleware/branding.js';
import { checkExpiry } from './middleware/expiry.js';

const app = new Hono();

app.use('*', cors());
app.use('*', branding);

// Apply expiry middleware to video fetching routes
app.use('/v/*', checkExpiry);

// Healthcheck
app.get('/', (c) => c.json({ status: 'ok', server: 'loomforge-share' }));

app.route('/v', videos);
app.route('/comments', comments);
app.route('/reactions', reactions);
app.route('/analytics', analytics);
app.route('/auth', auth);

app.notFound((c) => c.json({ error: 'Not Found' }, 404));

const port = process.env.PORT ? parseInt(process.env.PORT) : 3000;
console.log(`Server is running on port ${port}`);

serve({
  fetch: app.fetch,
  port
});
