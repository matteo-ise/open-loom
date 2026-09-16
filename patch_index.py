import re
with open('apps/desktop/src/main/index.ts', 'r') as f:
    content = f.read()

migration = """
import fs from 'node:fs';
import path from 'node:path';

function migrateLibraryFolder() {
  const base = app.getPath('videos') || app.getPath('documents');
  const oldPath = path.join(base, 'LoomForge');
  const newPath = path.join(base, 'Open Loom');
  
  if (fs.existsSync(oldPath) && !fs.existsSync(newPath)) {
    try {
      fs.renameSync(oldPath, newPath);
      log.info(`Migrated library folder from LoomForge to Open Loom`);
    } catch (e) {
      log.error(`Failed to migrate library folder: ${e}`);
    }
  }
}
"""

content = content.replace("app.whenReady().then(() => {", migration + "\napp.whenReady().then(() => {\n  migrateLibraryFolder();")

with open('apps/desktop/src/main/index.ts', 'w') as f:
    f.write(content)
print("Added migration to index.ts")
