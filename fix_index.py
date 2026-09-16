with open('apps/desktop/src/main/index.ts', 'r') as f:
    lines = f.readlines()

# Remove the broken block
new_lines = []
skip = False
for line in lines:
    if "import fs from 'node:fs';" in line:
        skip = True
    if skip and "function migrateLibraryFolder()" in line:
        pass
    if skip and "Migrated library folder from LoomForge to Open Loom" in line:
        pass
    if skip and "}" in line and len(line) < 5:
        skip = False
        continue
    if not skip:
        new_lines.append(line)

# Add the correct code
code = "".join(new_lines)
code = code.replace("app.whenReady().then(() => {\n  migrateLibraryFolder();", "app.whenReady().then(() => {")

imports = "import fs from 'node:fs';\nimport path from 'node:path';\n"
function_def = """
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

# inject at the top
code = imports + code
code = code.replace("app.whenReady().then(() => {", function_def + "\napp.whenReady().then(() => {\n  migrateLibraryFolder();")

with open('apps/desktop/src/main/index.ts', 'w') as f:
    f.write(code)
print("Fixed index.ts")
