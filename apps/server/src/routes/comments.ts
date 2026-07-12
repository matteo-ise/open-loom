import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { db } from '../db.js';

export const comments = new Hono();

comments.get('/:videoId', (c) => {
  const { videoId } = c.req.param();
  const stmt = db.prepare('SELECT * FROM comments WHERE video_id = ? ORDER BY timestamp ASC');
  return c.json(stmt.all(videoId));
});

comments.post(
  '/:videoId',
  zValidator(
    'json',
    z.object({
      id: z.string(),
      timestamp: z.number(),
      text: z.string(),
      created_at: z.string(),
    })
  ),
  (c) => {
    const { videoId } = c.req.param();
    const data = c.req.valid('json');
    const stmt = db.prepare(
      'INSERT INTO comments (id, video_id, timestamp, text, created_at) VALUES (?, ?, ?, ?, ?)'
    );
    try {
      stmt.run(data.id, videoId, data.timestamp, data.text, data.created_at);
      return c.json({ success: true });
    } catch (err) {
      return c.json({ error: 'Failed to insert comment' }, 500);
    }
  }
);
