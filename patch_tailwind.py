with open('src/ui-kit/tailwind.config.ts', 'r') as f:
    content = f.read()

content = content.replace(
    "display: ['\"Fraunces\"', '\"GT Quadrant\"', 'ui-serif', 'Georgia', 'Cambria', 'serif']",
    "display: ['-apple-system', 'BlinkMacSystemFont', '\"SF Pro Display\"', 'system-ui', 'sans-serif']"
)
content = content.replace(
    "serif: ['\"Newsreader\"', '\"GT Melange\"', 'ui-serif', 'Georgia', 'Cambria', 'serif']",
    "serif: ['-apple-system', 'BlinkMacSystemFont', '\"SF Pro Text\"', 'system-ui', 'sans-serif']"
)

with open('src/ui-kit/tailwind.config.ts', 'w') as f:
    f.write(content)
print("Patched tailwind.config.ts")
