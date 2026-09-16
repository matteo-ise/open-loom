import re
with open('apps/desktop/src/main/library-core.ts', 'r') as f:
    content = f.read()

helper = """
  getMp4Path(id: string): string {
    const dir = this.videoDir(id);
    const defaultPath = path.join(dir, 'video.mp4');
    if (!fs.existsSync(defaultPath) && fs.existsSync(dir)) {
      const mp4 = fs.readdirSync(dir).find(f => f.endsWith('.mp4'));
      if (mp4) return path.join(dir, mp4);
    }
    return defaultPath;
  }
"""

content = content.replace("videoDir(id: string): string {\n    return path.join(this.dir, this.dirCache.get(id) || id);\n  }", "videoDir(id: string): string {\n    return path.join(this.dir, this.dirCache.get(id) || id);\n  }\n" + helper)

with open('apps/desktop/src/main/library-core.ts', 'w') as f:
    f.write(content)
print("Added getMp4Path")
