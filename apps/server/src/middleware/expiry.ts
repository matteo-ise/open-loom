import type { Context, Next } from 'hono';
import { db } from '../db.js';

export async function checkExpiry(c: Context, next: Next) {
  const { id } = c.req.param();
  if (!id) return next();

  const stmt = db.prepare('SELECT expires_at FROM video_expiry WHERE video_id = ?');
  const row = stmt.get(id) as any;

  if (row && row.expires_at) {
    const expiryDate = new Date(row.expires_at);
    if (new Date() > expiryDate) {
      return c.json({ error: 'This video has expired' }, 410);
    }
  }

  await next();
}
