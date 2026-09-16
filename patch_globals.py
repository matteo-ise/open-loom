with open('src/ui-kit/src/styles/globals.css', 'r') as f:
    content = f.read()

# Replace body font
content = content.replace("font-family: 'Newsreader', 'GT Melange', ui-serif, Georgia, Cambria, serif;", "font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Segoe UI', sans-serif;")
content = content.replace("font-family: 'Fraunces', 'GT Quadrant', ui-serif, Georgia, Cambria, serif;", "font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', sans-serif;")

with open('src/ui-kit/src/styles/globals.css', 'w') as f:
    f.write(content)
print("Patched globals.css")
