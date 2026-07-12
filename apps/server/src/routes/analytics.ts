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

analytics.post('/:videoId/cta', (c) => {
  const { videoId } = c.req.param();
  const stmt = db.prepare(
    'INSERT INTO analytics_events (id, video_id, type, data, created_at) VALUES (?, ?, ?, ?, ?)'
  );
  try {
    stmt.run(crypto.randomUUID(), videoId, 'cta_click', null, new Date().toISOString());
    return c.json({ success: true });
  } catch (err) {
    return c.json({ error: 'Failed to record CTA click' }, 500);
  }
});

analytics.get('/:videoId', (c) => {
  const { videoId } = c.req.param();
  try {
    const viewsStmt = db.prepare('SELECT COUNT(*) as count FROM analytics_events WHERE video_id = ? AND type = ?');
    const views = viewsStmt.get(videoId, 'view') as { count: number };

    const ctaStmt = db.prepare('SELECT COUNT(*) as count FROM analytics_events WHERE video_id = ? AND type = ?');
    const ctas = ctaStmt.get(videoId, 'cta_click') as { count: number };

    const beaconsStmt = db.prepare('SELECT data FROM analytics_events WHERE video_id = ? AND type = ?');
    const beacons = beaconsStmt.all(videoId, 'beacon') as { data: string }[];

    // Calculate completion rate (0-1) based on highest beacon per session if we had sessions, 
    // but here we just average over all beacons or max beacons. 
    // For simplicity, just return raw stats to the client
    let beaconCounts = { 25: 0, 50: 0, 75: 0, 100: 0 };
    beacons.forEach(b => {
      try {
        const d = JSON.parse(b.data);
        if (d.percentage) beaconCounts[d.percentage as keyof typeof beaconCounts]++;
      } catch (e) {}
    });

    return c.json({
      views: views.count,
      ctaClicks: ctas.count,
      beacons: beaconCounts
    });
  } catch (err) {
    return c.json({ error: 'Failed to fetch analytics' }, 500);
  }
});

