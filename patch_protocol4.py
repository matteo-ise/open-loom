with open('apps/desktop/src/main/protocol.ts', 'r') as f:
    content = f.read()

content = content.replace("import { FILE_RE } from '@shared/types';", "const FILE_RE = /^[A-Za-z0-9][A-Za-z0-9._ -]{0,127}$/;")

with open('apps/desktop/src/main/protocol.ts', 'w') as f:
    f.write(content)
print("Patched protocol.ts again")
