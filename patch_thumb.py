import re
with open('apps/desktop/src/main/library.ts', 'r') as f:
    content = f.read()

old_thumb = """  } else if (typeof source.atSec === 'number') {
    const bins = requireBinaries();
    const videoPath = path.join(store.videoDir(id), VIDEO_FILES.video);
    await enqueueJob(id, 'thumbnail', async () => {
      await thumbnail(bins, videoPath, thumbPath, Math.min(Math.max(0, source.atSec!), meta.durationSec));
    });"""

new_thumb = """  } else if (typeof source.atSec === 'number') {
    const bins = requireBinaries();
    const dir = store.videoDir(id);
    let videoPath = path.join(dir, VIDEO_FILES.video);
    if (!fs.existsSync(videoPath) && fs.existsSync(dir)) {
      const mp4 = fs.readdirSync(dir).find(f => f.endsWith('.mp4'));
      if (mp4) videoPath = path.join(dir, mp4);
    }
    
    await enqueueJob(id, 'thumbnail', async () => {
      await thumbnail(bins, videoPath, thumbPath, Math.min(Math.max(0, source.atSec!), meta.durationSec));
    });"""

content = content.replace(old_thumb, new_thumb)

with open('apps/desktop/src/main/library.ts', 'w') as f:
    f.write(content)
print("Patched library.ts thumbnail")
