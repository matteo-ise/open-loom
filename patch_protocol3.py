import re
with open('apps/desktop/src/main/protocol.ts', 'r') as f:
    content = f.read()

# Import library instead of resolveLibraryPath
content = content.replace("import { resolveLibraryPath } from './library-core';", "import { library } from './library';\nimport { FILE_RE } from '@shared/types';")

old_resolve = """      const libDir = getSettings().saveDir;
      let resolved = resolveLibraryPath(libDir, videoId, fileName);
      if (resolved && fileName === 'video.mp4' && !fs.existsSync(resolved)) {
         // fallback to any mp4 in the directory if video.mp4 was renamed
         const dir = path.dirname(resolved);
         if (fs.existsSync(dir)) {
            const mp4 = fs.readdirSync(dir).find(f => f.endsWith('.mp4'));
            if (mp4) resolved = path.join(dir, mp4);
         }
      }"""

new_resolve = """      if (!FILE_RE.test(fileName) || fileName.includes('..')) {
        return new Response('Not found', { status: 404 });
      }
      
      const lib = library();
      const videoDir = lib.videoDir(videoId);
      let resolved = path.join(videoDir, fileName);
      
      if (fileName === 'video.mp4' && !fs.existsSync(resolved) && fs.existsSync(videoDir)) {
         // fallback to any mp4 in the directory if video.mp4 was renamed
         const mp4 = fs.readdirSync(videoDir).find(f => f.endsWith('.mp4'));
         if (mp4) resolved = path.join(videoDir, mp4);
      }"""

content = content.replace(old_resolve, new_resolve)

with open('apps/desktop/src/main/protocol.ts', 'w') as f:
    f.write(content)
print("Patched protocol.ts")
