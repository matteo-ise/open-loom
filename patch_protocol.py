import re
with open('apps/desktop/src/main/protocol.ts', 'r') as f:
    content = f.read()

old_code = """      if (match) {
        videoId = decodeURIComponent(match[1]!);
        fileName = decodeURIComponent(match[2]!);
      } else {"""

new_code = """      if (match) {
        videoId = decodeURIComponent(match[1]!);
        fileName = decodeURIComponent(match[2]!.split('?')[0]!);
      } else {"""

content = content.replace(old_code, new_code)

with open('apps/desktop/src/main/protocol.ts', 'w') as f:
    f.write(content)
print("Patched protocol.ts")
