import re
with open('apps/desktop/src/main/settings.ts', 'r') as f:
    content = f.read()

content = content.replace("path.join(base, 'LoomForge')", "path.join(base, 'Open Loom')")

with open('apps/desktop/src/main/settings.ts', 'w') as f:
    f.write(content)
print("Patched settings.ts")
