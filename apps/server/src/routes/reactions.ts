import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { db } from '../db.js';

export const reactions = new Hono();

reactions.get('/:videoId', (c) => {
  const { videoId } = c.req.param();
  const stmt = db.prepare('SELECT * FROM reactions WHERE video_id = ? ORDER BY timestamp ASC');
  return c.json(stmt.all(videoId));
});

reactions.post(
  '/:videoId',
  zValidator(
    'json',
    z.object({
      id: z.string(),
      timestamp: z.number(),
      emoji: z.string(),
      created_at: z.string(),
    })
  ),
  (c) => {
    const { videoId } = c.req.param();
    const data = c.req.valid('json');
    const stmt = db.prepare(
      'INSERT INTO reactions (id, video_id, timestamp, emoji, created_at) VALUES (?, ?, ?, ?, ?)'
    );
    try {
      stmt.run(data.id, videoId, data.timestamp, data.emoji, data.created_at);
      return c.json({ success: true });
    } catch (err) {
      return c.json({ error: 'Failed to insert reaction' }, 500);
    }
  }
);
