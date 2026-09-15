with open('apps/desktop/src/renderer/src/hud/Hud.tsx', 'r') as f:
    content = f.read()

quit_btn = """      <HudButton
        label="Quit Open Loom"
        hint="Close the app"
        onHint={setHint}
        onClick={() => window.openLoom.quitApp()}
        danger
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M18.36 6.64a9 9 0 1 1-12.73 0" />
          <line x1="12" y1="2" x2="12" y2="12" />
        </svg>
      </HudButton>

      <div className="hud-hint" """

content = content.replace('<div className="hud-hint" ', quit_btn)

with open('apps/desktop/src/renderer/src/hud/Hud.tsx', 'w') as f:
    f.write(content)
print("Patched Hud.tsx")
