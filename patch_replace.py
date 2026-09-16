import re

# In transcribe.ts
with open('apps/desktop/src/main/transcribe.ts', 'r') as f:
    t = f.read()
t = t.replace("const videoPath = path.join(store.videoDir(id), VIDEO_FILES.video);", "const videoPath = store.getMp4Path(id);")
with open('apps/desktop/src/main/transcribe.ts', 'w') as f:
    f.write(t)

# In editor-jobs.ts
with open('apps/desktop/src/main/editor-jobs.ts', 'r') as f:
    e = f.read()
e = e.replace("return path.join(library().videoDir(id), VIDEO_FILES.video);", "return library().getMp4Path(id);")
e = e.replace("const appendFile = path.join(store.videoDir(appendId), VIDEO_FILES.video);", "const appendFile = store.getMp4Path(appendId);")
with open('apps/desktop/src/main/editor-jobs.ts', 'w') as f:
    f.write(e)

# In library.ts
with open('apps/desktop/src/main/library.ts', 'r') as f:
    l = f.read()

# Revert my hacky library.ts and use getMp4Path
l = l.replace("""export function revealVideo(id: string): void {
  const store = library();
  const dir = store.videoDir(id);
  let videoPath = path.join(dir, VIDEO_FILES.video);
  
  if (!fs.existsSync(videoPath) && fs.existsSync(dir)) {
    const mp4 = fs.readdirSync(dir).find(f => f.endsWith('.mp4'));
    if (mp4) videoPath = path.join(dir, mp4);
  }
  
  if (fs.existsSync(videoPath)) {
    shell.showItemInFolder(videoPath);
  } else {
    shell.showItemInFolder(dir);
  }
}""", """export function revealVideo(id: string): void {
  const store = library();
  const videoPath = store.getMp4Path(id);
  if (fs.existsSync(videoPath)) {
    shell.showItemInFolder(videoPath);
  } else {
    shell.showItemInFolder(store.videoDir(id));
  }
}""")

l = l.replace("""  } else if (typeof source.atSec === 'number') {
    const bins = requireBinaries();
    const dir = store.videoDir(id);
    let videoPath = path.join(dir, VIDEO_FILES.video);
    if (!fs.existsSync(videoPath) && fs.existsSync(dir)) {
      const mp4 = fs.readdirSync(dir).find(f => f.endsWith('.mp4'));
      if (mp4) videoPath = path.join(dir, mp4);
    }
    
    await enqueueJob(id, 'thumbnail', async () => {
      await thumbnail(bins, videoPath, thumbPath, Math.min(Math.max(0, source.atSec!), meta.durationSec));
    });""", """  } else if (typeof source.atSec === 'number') {
    const bins = requireBinaries();
    const videoPath = store.getMp4Path(id);
    await enqueueJob(id, 'thumbnail', async () => {
      await thumbnail(bins, videoPath, thumbPath, Math.min(Math.max(0, source.atSec!), meta.durationSec));
    });""")

with open('apps/desktop/src/main/library.ts', 'w') as f:
    f.write(l)

print("Replaced all VIDEO_FILES.video")
