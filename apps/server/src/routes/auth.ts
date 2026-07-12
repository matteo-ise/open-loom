import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { db } from '../db.js';

export const auth = new Hono();

auth.post(
  '/:videoId/unlock',
  zValidator(
    'json',
    z.object({
      password: z.string(),
    })
  ),
  (c) => {
    const { videoId } = c.req.param();
    const data = c.req.valid('json');
    // In a real app we'd compare password_hash with bcrypt. 
    // Here we'll just do a plain string match for simplicity.
    const stmt = db.prepare('SELECT password_hash FROM video_passwords WHERE video_id = ?');
    const row = stmt.get(videoId) as any;

    if (!row) return c.json({ error: 'Video is not password protected' }, 400);
    if (row.password_hash !== data.password) return c.json({ error: 'Invalid password' }, 401);

    // Return a mocked success / signed cookie representation
    return c.json({ success: true, token: 'mock-signed-cookie-token' });
  }
);
