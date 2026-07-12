import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { db } from '../db.js';
import { renderToString } from 'react-dom/server';
import React from 'react';
import { Player } from 'player';

export const videos = new Hono();

// This is the main watch page
videos.get('/:id', (c) => {
  const { id } = c.req.param();
  const stmt = db.prepare('SELECT * FROM videos WHERE id = ?');
  const video = stmt.get(id) as any;
  if (!video) return c.json({ error: 'Video not found' }, 404);

  const brandingConfig = c.get('branding') || {};
  
  // Basic SSR logic
  const html = renderToString(
    <html>
      <head>
        <title>{video.title}</title>
        <style dangerouslySetInnerHTML={{ __html: brandingConfig.custom_css || '' }} />
      </head>
      <body style={{ fontFamily: 'sans-serif', margin: 0, padding: '20px', background: brandingConfig.primary_color || '#f9fafb' }}>
        {brandingConfig.logo_url && (
          <img src={brandingConfig.logo_url} alt="Logo" style={{ height: '40px', marginBottom: '20px' }} />
        )}
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <h1 style={{ fontSize: '24px', marginBottom: '16px' }}>{video.title}</h1>
          <Player 
            videoId={id} 
            src={video.share_url || `/v/${id}/stream`} 
            analyticsEndpoint=""
            cta={{ label: 'Learn More', url: 'https://example.com' }}
          />
        </div>
      </body>
    </html>
  );

  return c.html(`<!DOCTYPE html>${html}`);
});

// Embed page
videos.get('/embed/:id', (c) => {
  const { id } = c.req.param();
  const stmt = db.prepare('SELECT * FROM videos WHERE id = ?');
  const video = stmt.get(id) as any;
  if (!video) return c.json({ error: 'Video not found' }, 404);

  const html = renderToString(
    <html>
      <head>
        <style>{`body { margin: 0; overflow: hidden; background: transparent; }`}</style>
      </head>
      <body>
        <Player 
          videoId={id} 
          src={video.share_url || `/v/${id}/stream`} 
          analyticsEndpoint=""
        />
      </body>
    </html>
  );

  return c.html(`<!DOCTYPE html>${html}`);
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
