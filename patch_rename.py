import re
with open('apps/desktop/src/main/library-core.ts', 'r') as f:
    content = f.read()

# Add sanitize function
sanitize_fn = """
function sanitizeName(name: string): string {
  return name.replace(/[<>:"/\\|?*]+/g, '_').trim().substring(0, 100) || 'Untitled';
}
"""
content = content.replace("export class LibraryStore", sanitize_fn + "\nexport class LibraryStore")

# Update writeMeta to handle renaming
old_write_meta = """  private writeMeta(meta: VideoMeta, transcriptText: string = ''): void {
    fs.mkdirSync(this.videoDir(meta.id), { recursive: true });
    const jsonStr = JSON.stringify(meta, null, 2);
    // Keep meta.json on disk for raw access/backup, but DB is source of truth for queries
    fs.writeFileSync(this.metaPath(meta.id), jsonStr);"""

new_write_meta = """  private writeMeta(meta: VideoMeta, transcriptText: string = ''): void {
    const desiredDirName = `${sanitizeName(meta.title)}_${meta.id}`;
    const currentDirName = this.dirCache.get(meta.id);
    
    if (currentDirName && currentDirName !== desiredDirName) {
      const oldPath = path.join(this.dir, currentDirName);
      const newPath = path.join(this.dir, desiredDirName);
      if (fs.existsSync(oldPath)) {
        try {
          // Also rename the mp4 file if it exists
          const oldMp4 = fs.readdirSync(oldPath).find(f => f.endsWith('.mp4'));
          if (oldMp4) {
             const newMp4 = `${sanitizeName(meta.title)}.mp4`;
             if (oldMp4 !== newMp4) {
               fs.renameSync(path.join(oldPath, oldMp4), path.join(oldPath, newMp4));
             }
          }
          fs.renameSync(oldPath, newPath);
          this.dirCache.set(meta.id, desiredDirName);
        } catch (err) {
          console.error('Failed to rename directory', err);
        }
      }
    } else if (!currentDirName) {
      this.dirCache.set(meta.id, desiredDirName);
    }
    
    fs.mkdirSync(this.videoDir(meta.id), { recursive: true });
    const jsonStr = JSON.stringify(meta, null, 2);
    // Keep meta.json on disk for raw access/backup, but DB is source of truth for queries
    fs.writeFileSync(this.metaPath(meta.id), jsonStr);"""

content = content.replace(old_write_meta, new_write_meta)

with open('apps/desktop/src/main/library-core.ts', 'w') as f:
    f.write(content)
print("Patched writeMeta for renaming")
