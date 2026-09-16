import re
with open('apps/desktop/src/main/library-core.ts', 'r') as f:
    content = f.read()

old_sync = """        const meta = JSON.parse(fs.readFileSync(mPath, 'utf8')) as VideoMeta;
        this.dirCache.set(meta.id, entry.name);"""

new_sync = """        const meta = JSON.parse(fs.readFileSync(mPath, 'utf8')) as VideoMeta;
        
        // Auto-migrate directory name
        const desiredDirName = `${sanitizeName(meta.title)}_${meta.id}`;
        let finalDirName = entry.name;
        if (entry.name !== desiredDirName) {
           const oldPath = path.join(this.dir, entry.name);
           const newPath = path.join(this.dir, desiredDirName);
           if (!fs.existsSync(newPath)) {
              try {
                // Rename MP4 as well
                const oldMp4 = fs.readdirSync(oldPath).find(f => f.endsWith('.mp4'));
                if (oldMp4) {
                   const newMp4 = `${sanitizeName(meta.title)}.mp4`;
                   if (oldMp4 !== newMp4) fs.renameSync(path.join(oldPath, oldMp4), path.join(oldPath, newMp4));
                }
                fs.renameSync(oldPath, newPath);
                finalDirName = desiredDirName;
              } catch (e) {
                // fallback to old name if rename fails
              }
           }
        }
        this.dirCache.set(meta.id, finalDirName);"""

content = content.replace(old_sync, new_sync)

with open('apps/desktop/src/main/library-core.ts', 'w') as f:
    f.write(content)
print("Added auto-migration to syncFromDisk")
