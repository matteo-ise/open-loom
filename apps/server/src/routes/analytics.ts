import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { db } from '../db.js';

export const analytics = new Hono();

analytics.post(
  '/:videoId/view',
  zValidator(
    'json',
    z.object({
      id: z.string(),
      created_at: z.string(),
    })
  ),
  (c) => {
    const { videoId } = c.req.param();
    const data = c.req.valid('json');
    const stmt = db.prepare(
      'INSERT INTO analytics_events (id, video_id, type, data, created_at) VALUES (?, ?, ?, ?, ?)'
    );
    try {
      stmt.run(data.id, videoId, 'view', null, data.created_at);
      return c.json({ success: true });
    } catch (err) {
      return c.json({ error: 'Failed to record view' }, 500);
    }
  }
);

analytics.post(
  '/:videoId/beacon',
  zValidator(
    'json',
    z.object({
      id: z.string(),
      percentage: z.number(),
      created_at: z.string(),
    })
  ),
  (c) => {
    const { videoId } = c.req.param();
    const data = c.req.valid('json');
    const stmt = db.prepare(
      'INSERT INTO analytics_events (id, video_id, type, data, created_at) VALUES (?, ?, ?, ?, ?)'
    );
    try {
      stmt.run(data.id, videoId, 'beacon', JSON.stringify({ percentage: data.percentage }), data.created_at);
      return c.json({ success: true });
    } catch (err) {
      return c.json({ error: 'Failed to record beacon' }, 500);
    }
  }
);
