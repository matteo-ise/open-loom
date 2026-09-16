import re
with open('apps/desktop/src/main/library-core.ts', 'r') as f:
    content = f.read()

# Add dirCache to LibraryStore
content = content.replace("private db: DatabaseType;", "private db: DatabaseType;\n  private dirCache = new Map<string, string>();")

# Update videoDir
old_video_dir = """  videoDir(id: string): string {
    return path.join(this.dir, id);
  }"""
new_video_dir = """  videoDir(id: string): string {
    return path.join(this.dir, this.dirCache.get(id) || id);
  }"""
content = content.replace(old_video_dir, new_video_dir)

# Update syncFromDisk
old_sync = """  private syncFromDisk() {
    // If a meta.json exists but is not in DB, insert it. (For tests and crash recovery)
    for (const entry of fs.readdirSync(this.dir, { withFileTypes: true })) {
      if (!entry.isDirectory() || !ID_RE.test(entry.name)) continue;
      const mPath = this.metaPath(entry.name);
      if (!fs.existsSync(mPath)) continue;
      try {
        const meta = JSON.parse(fs.readFileSync(mPath, 'utf8')) as VideoMeta;
        if (meta.id !== entry.name) continue;"""

new_sync = """  private syncFromDisk() {
    // If a meta.json exists but is not in DB, insert it. (For tests and crash recovery)
    for (const entry of fs.readdirSync(this.dir, { withFileTypes: true })) {
      if (!entry.isDirectory()) continue;
      const mPath = path.join(this.dir, entry.name, 'meta.json');
      if (!fs.existsSync(mPath)) continue;
      try {
        const meta = JSON.parse(fs.readFileSync(mPath, 'utf8')) as VideoMeta;
        this.dirCache.set(meta.id, entry.name);"""
content = content.replace(old_sync, new_sync)

with open('apps/desktop/src/main/library-core.ts', 'w') as f:
    f.write(content)
print("Patched library-core.ts")
