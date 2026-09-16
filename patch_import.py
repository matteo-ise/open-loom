import re
with open('apps/desktop/src/main/recorder-ipc.ts', 'r') as f:
    content = f.read()

# Add createMainWindow to the imports from ./windows
content = re.sub(r'getDrawWindow,', 'getDrawWindow,\n  createMainWindow,', content)

# Update the call in stopRecording
old_call = "const win = require('./windows').createMainWindow();"
new_call = "const win = createMainWindow();"
content = content.replace(old_call, new_call)

with open('apps/desktop/src/main/recorder-ipc.ts', 'w') as f:
    f.write(content)
print("Patched imports")
