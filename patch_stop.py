with open('apps/desktop/src/main/recorder-ipc.ts', 'r') as f:
    content = f.read()

# Replace the part in stopRecording
old_code = """  rec.status = 'processing';
  stopTick();
  // HUD + bubble close instantly on stop (SPEC R14).
  closeSessionWindows();
  emitState({ processingNote: 'Finishing up' });"""

new_code = """  rec.status = 'processing';
  stopTick();
  // HUD + bubble close instantly on stop (SPEC R14).
  closeSessionWindows();
  
  // IMMEDIATELY show the main window so the user sees the "Processing" banner!
  const win = require('./windows').createMainWindow();
  if (win) {
    win.show();
    win.focus();
  }

  emitState({ processingNote: 'Finishing up' });"""

content = content.replace(old_code, new_code)

with open('apps/desktop/src/main/recorder-ipc.ts', 'w') as f:
    f.write(content)
print("Patched stopRecording")
