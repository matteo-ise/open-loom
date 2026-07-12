import fs from 'node:fs';
import path from 'node:path';
import Database from 'better-sqlite3';
import type { Database as DatabaseType } from 'better-sqlite3';
import type { Folder, SearchMatch, VideoMeta } from '@shared/types';

export interface LibraryDeps {
  trash(absPath: string): Promise<void>;
  newId(): string;
  warn?(msg: string): void;
}

const ID_RE = /^[A-Za-z0-9_-]{1,32}$/;
const FILE_RE = /^[A-Za-z0-9][A-Za-z0-9._ -]{0,127}$/;

export function resolveLibraryPath(libDir: string, videoId: string, file: string): string | null {
  if (!ID_RE.test(videoId)) return null;
  if (!FILE_RE.test(file) || file.includes('..')) return null;
  const base = path.resolve(libDir);
  const resolved = path.resolve(base, videoId, file);
  if (!resolved.startsWith(base + path.sep)) return null;
  const videoDir = path.resolve(base, videoId);
  if (path.dirname(resolved) !== videoDir) return null;
  return resolved;
}

export class LibraryStore {
  private db: DatabaseType;

  constructor(
    private readonly dir: string,
    private readonly deps: LibraryDeps
  ) {
    fs.mkdirSync(this.dir, { recursive: true });
    this.db = new Database(path.join(this.dir, 'library.db'));
    this.initDb();
    // In test environments, tests write meta.json directly. We should sync them on start.
    this.syncFromDisk();
  }

  get root(): string {
    return this.dir;
  }

  private initDb() {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS folders (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        sort_order INTEGER NOT NULL DEFAULT 0
      );
      CREATE TABLE IF NOT EXISTS videos (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        created_at TEXT NOT NULL,
        folder_id TEXT,
        raw_json TEXT NOT NULL,
        FOREIGN KEY (folder_id) REFERENCES folders(id) ON DELETE SET NULL
      );
      CREATE VIRTUAL TABLE IF NOT EXISTS video_fts USING fts5(
        id UNINDEXED,
        title,
        transcript,
        tokenize='unicode61'
      );
    `);
  }

  videoDir(id: string): string {
    return path.join(this.dir, id);
  }

  private metaPath(id: string): string {
    return path.join(this.videoDir(id), 'meta.json');
  }

  private syncFromDisk() {
    // If a meta.json exists but is not in DB, insert it. (For tests and crash recovery)
    for (const entry of fs.readdirSync(this.dir, { withFileTypes: true })) {
      if (!entry.isDirectory() || !ID_RE.test(entry.name)) continue;
      const mPath = this.metaPath(entry.name);
      if (!fs.existsSync(mPath)) continue;
      try {
        const meta = JSON.parse(fs.readFileSync(mPath, 'utf8')) as VideoMeta;
        if (meta.id !== entry.name) continue;
        
        // Try reading transcript for FTS
        let transcriptText = '';
        const transcriptPath = path.join(this.videoDir(meta.id), 'transcript.json');
        if (fs.existsSync(transcriptPath)) {
          const transcript = JSON.parse(fs.readFileSync(transcriptPath, 'utf8'));
          transcriptText = (transcript.segments || []).map((s: any) => s.text).join(' ');
        }

        const stmt = this.db.prepare(`INSERT OR IGNORE INTO videos (id, title, created_at, folder_id, raw_json) VALUES (?, ?, ?, ?, ?)`);
        stmt.run(meta.id, meta.title, meta.createdAt, meta.folderId || null, JSON.stringify(meta));
        
        const ftsStmt = this.db.prepare(`INSERT OR REPLACE INTO video_fts (rowid, id, title, transcript) VALUES ((SELECT rowid FROM videos WHERE id = ?), ?, ?, ?)`);
        ftsStmt.run(meta.id, meta.id, meta.title, transcriptText);
      } catch (err) {
        this.deps.warn?.(`skipping corrupt meta.json in ${entry.name}: ${err}`);
      }
    }
  }

  private writeMeta(meta: VideoMeta, transcriptText: string = ''): void {
    fs.mkdirSync(this.videoDir(meta.id), { recursive: true });
    const jsonStr = JSON.stringify(meta, null, 2);
    // Keep meta.json on disk for raw access/backup, but DB is source of truth for queries
    fs.writeFileSync(this.metaPath(meta.id), jsonStr);

    const tx = this.db.transaction(() => {
      this.db.prepare(`INSERT OR REPLACE INTO videos (id, title, created_at, folder_id, raw_json) VALUES (?, ?, ?, ?, ?)`).run(meta.id, meta.title, meta.createdAt, meta.folderId || null, jsonStr);
      
      const ftsStmt = this.db.prepare(`INSERT OR REPLACE INTO video_fts (rowid, id, title, transcript) VALUES ((SELECT rowid FROM videos WHERE id = ?), ?, ?, ?)`);
      ftsStmt.run(meta.id, meta.id, meta.title, transcriptText);
    });
    tx();
  }

  list(): VideoMeta[] {
    const rows = this.db.prepare(`SELECT raw_json FROM videos ORDER BY created_at DESC`).all() as { raw_json: string }[];
    return rows.map(r => JSON.parse(r.raw_json) as VideoMeta);
  }

  get(id: string): VideoMeta {
    const row = this.db.prepare(`SELECT raw_json FROM videos WHERE id = ?`).get(id) as { raw_json: string } | undefined;
    if (!row) throw new Error(`Video ${id} was not found in the library.`);
    return JSON.parse(row.raw_json) as VideoMeta;
  }

  put(meta: VideoMeta): VideoMeta {
    // Read transcript if it exists to index it
    let transcriptText = '';
    const transcriptPath = path.join(this.videoDir(meta.id), 'transcript.json');
    if (fs.existsSync(transcriptPath)) {
      try {
        const transcript = JSON.parse(fs.readFileSync(transcriptPath, 'utf8'));
        transcriptText = (transcript.segments || []).map((s: any) => s.text).join(' ');
      } catch {}
    }
    this.writeMeta(meta, transcriptText);
    return meta;
  }

  update(id: string, patch: Partial<VideoMeta>): VideoMeta {
    const current = this.get(id);
    const next: VideoMeta = { ...current, ...patch, id };
    if (patch.share === undefined && 'share' in patch) delete next.share;
    this.put(next); // put already extracts transcript and writes to DB
    return next;
  }

  async delete(id: string): Promise<void> {
    this.get(id); // ensure exists
    const tx = this.db.transaction(() => {
      this.db.prepare(`DELETE FROM video_fts WHERE id = ?`).run(id);
      this.db.prepare(`DELETE FROM videos WHERE id = ?`).run(id);
    });
    tx();
    await this.deps.trash(this.videoDir(id));
  }

  async duplicate(id: string): Promise<VideoMeta> {
    const source = this.get(id);
    const newId = this.deps.newId();
    const from = this.videoDir(id);
    const to = this.videoDir(newId);
    await fs.promises.cp(from, to, { recursive: true });
    const copy: VideoMeta = {
      ...source,
      id: newId,
      title: `${source.title} copy`,
      createdAt: new Date().toISOString(),
    };
    delete copy.share;
    this.put(copy);
    return copy;
  }

  moveVideo(id: string, folderId: string | null): VideoMeta {
    if (folderId !== null) {
      const folder = this.db.prepare(`SELECT id FROM folders WHERE id = ?`).get(folderId);
      if (!folder) throw new Error('That folder no longer exists.');
    }
    return this.update(id, { folderId });
  }

  listFolders(): Folder[] {
    return this.db.prepare(`SELECT id, name FROM folders ORDER BY sort_order ASC`).all() as Folder[];
  }

  createFolder(name: string): Folder {
    const trimmed = name.trim();
    if (!trimmed) throw new Error('Folder name cannot be empty.');
    const id = this.deps.newId();
    
    const count = (this.db.prepare(`SELECT COUNT(*) as c FROM folders`).get() as any).c;
    this.db.prepare(`INSERT INTO folders (id, name, sort_order) VALUES (?, ?, ?)`).run(id, trimmed, count);
    return { id, name: trimmed };
  }

  renameFolder(id: string, name: string): void {
    const trimmed = name.trim();
    if (!trimmed) throw new Error('Folder name cannot be empty.');
    const res = this.db.prepare(`UPDATE folders SET name = ? WHERE id = ?`).run(trimmed, id);
    if (res.changes === 0) throw new Error('That folder no longer exists.');
  }

  deleteFolder(id: string): void {
    const affected = this.db.prepare(`SELECT id FROM videos WHERE folder_id = ?`).all(id) as {id: string}[];
    for (const row of affected) {
      this.update(row.id, { folderId: null });
    }
    this.db.prepare(`DELETE FROM folders WHERE id = ?`).run(id);
  }

  search(q: string): SearchMatch[] {
    const needle = q.trim();
    if (!needle) return [];
    
    // FTS5 MATCH syntax: wrap in quotes to do a phrase search
    const escaped = needle.replace(/"/g, '""');
    const query = `"${escaped}"*`; // prefix search
    
    // Fallback: we also do a LIKE search on title for partial word matches that FTS5 might miss
    const likeQuery = `%${needle}%`;

    const rows = this.db.prepare(`
      SELECT id, title, transcript FROM video_fts WHERE video_fts MATCH ?
      UNION
      SELECT id, title, transcript FROM video_fts WHERE title LIKE ?
    `).all(query, likeQuery) as { id: string; title: string; transcript: string }[];
    
    const results: SearchMatch[] = [];
    for (const row of rows) {
      const matches: string[] = [];
      const lowerNeedle = needle.toLowerCase();
      
      if (row.title.toLowerCase().includes(lowerNeedle)) {
        matches.push(row.title);
      }
      
      if (row.transcript && row.transcript.toLowerCase().includes(lowerNeedle)) {
        // extract a snippet
        const idx = row.transcript.toLowerCase().indexOf(lowerNeedle);
        const start = Math.max(0, idx - 20);
        const end = Math.min(row.transcript.length, idx + needle.length + 20);
        matches.push(row.transcript.substring(start, end).trim());
      }
      
      if (matches.length > 0) {
        results.push({ id: row.id, matches: matches.slice(0, 6) });
      }
    }
    return results;
  }
}
