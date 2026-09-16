import re
with open('apps/desktop/src/main/library.ts', 'r') as f:
    content = f.read()

old_reveal = """export function revealVideo(id: string): void {
  const store = library();
  const videoPath = path.join(store.videoDir(id), VIDEO_FILES.video);
  if (fs.existsSync(videoPath)) {
    shell.showItemInFolder(videoPath);
  } else {
    shell.showItemInFolder(store.videoDir(id));
  }
}"""

new_reveal = """export function revealVideo(id: string): void {
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
}"""

content = content.replace(old_reveal, new_reveal)

with open('apps/desktop/src/main/library.ts', 'w') as f:
    f.write(content)
print("Patched library.ts revealVideo")
