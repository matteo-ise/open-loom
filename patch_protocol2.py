import re
with open('apps/desktop/src/main/protocol.ts', 'r') as f:
    content = f.read()

# Intercept video.mp4 request and map it to actual mp4 in directory
old_resolve = """      const libDir = getSettings().saveDir;
      const resolved = resolveLibraryPath(libDir, videoId, fileName);"""

new_resolve = """      const libDir = getSettings().saveDir;
      let resolved = resolveLibraryPath(libDir, videoId, fileName);
      if (resolved && fileName === 'video.mp4' && !fs.existsSync(resolved)) {
         // fallback to any mp4 in the directory if video.mp4 was renamed
         const dir = path.dirname(resolved);
         if (fs.existsSync(dir)) {
            const mp4 = fs.readdirSync(dir).find(f => f.endsWith('.mp4'));
            if (mp4) resolved = path.join(dir, mp4);
         }
      }"""

content = content.replace(old_resolve, new_resolve)

with open('apps/desktop/src/main/protocol.ts', 'w') as f:
    f.write(content)
print("Patched protocol.ts")
