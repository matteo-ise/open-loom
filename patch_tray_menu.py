with open('apps/desktop/src/main/tray.ts', 'r') as f:
    content = f.read()

menu_code = """
    tray.on('right-click', () => {
      const menu = Menu.buildFromTemplate([
        { label: 'Open Library', click: () => createMainWindow() },
        { type: 'separator' },
        { label: 'Quit Open Loom', role: 'quit' }
      ]);
      tray?.popUpContextMenu(menu);
    });
"""

content = content.replace("toggleHud(tray!.getBounds());\n    });", "toggleHud(tray!.getBounds());\n    });\n" + menu_code)

with open('apps/desktop/src/main/tray.ts', 'w') as f:
    f.write(content)
print("Patched tray.ts")
