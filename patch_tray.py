import re
with open('apps/desktop/src/main/tray.ts', 'r') as f:
    content = f.read()

# Replace the title setting
old_line = "tray?.setTitle(paused ? `⏸ ${mins}:${secs}` : `🔴 ${mins}:${secs}`);"
new_line = "tray?.setTitle(paused ? `⏸ ${mins}:${secs}` : `${mins}:${secs}`);"

content = content.replace(old_line, new_line)

with open('apps/desktop/src/main/tray.ts', 'w') as f:
    f.write(content)
print("Patched tray.ts")
