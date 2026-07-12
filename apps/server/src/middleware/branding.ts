import type { Context, Next } from 'hono';
import { db } from '../db.js';

export async function branding(c: Context, next: Next) {
  const stmt = db.prepare('SELECT * FROM branding LIMIT 1');
  const config = stmt.get() as any;

  c.set('branding', config || null);

  await next();

  // If returning HTML, we could inject CSS here, but Hono is just serving API responses or SSR strings
  // For now, we attach branding info to the context
}
