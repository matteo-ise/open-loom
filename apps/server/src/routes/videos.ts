import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { db } from '../db.js';

export const videos = new Hono();

videos.get('/:id', (c) => {
  const { id } = c.req.param();
  const stmt = db.prepare('SELECT * FROM videos WHERE id = ?');
  const video = stmt.get(id) as any;
  if (!video) return c.json({ error: 'Video not found' }, 404);
  return c.json(video);
});

videos.post(
  '/',
  zValidator(
    'json',
    z.object({
      id: z.string(),
      title: z.string(),
      duration_s: z.number(),
      created_at: z.string(),
    })
  ),
  (c) => {
    const data = c.req.valid('json');
    const stmt = db.prepare(
      'INSERT INTO videos (id, title, duration_s, created_at) VALUES (?, ?, ?, ?)'
    );
    try {
      stmt.run(data.id, data.title, data.duration_s, data.created_at);
      return c.json({ success: true });
    } catch (err) {
      return c.json({ error: 'Failed to insert' }, 500);
    }
  }
);
