with open('apps/desktop/src/renderer/src/draw.ts', 'r') as f:
    content = f.read()

btn_code = """
const btn = document.createElement('button');
btn.textContent = 'Stop Drawing (Esc)';
btn.className = 'exit-draw-btn';
btn.style.display = 'none';
btn.onclick = () => {
  window.openLoom.toggleDraw(false);
};
document.body.appendChild(btn);

window.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && drawEnabled) {
    window.openLoom.toggleDraw(false);
  }
});
"""

content = content.replace("window.openLoomInternal.onDrawEnable((on) => {", btn_code + "\nwindow.openLoomInternal.onDrawEnable((on) => {")

content = content.replace("document.body.classList.toggle('drawing', on);", "document.body.classList.toggle('drawing', on);\n  btn.style.display = on ? 'flex' : 'none';")

with open('apps/desktop/src/renderer/src/draw.ts', 'w') as f:
    f.write(content)

with open('apps/desktop/src/renderer/src/styles/draw.css', 'a') as f:
    f.write("""
.exit-draw-btn {
  position: absolute;
  bottom: 32px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(20, 19, 15, 0.85);
  backdrop-filter: blur(20px);
  color: #fff;
  border: 1px solid rgba(255, 255, 255, 0.15);
  padding: 12px 24px;
  border-radius: 9999px;
  font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Text', sans-serif;
  font-size: 15px;
  font-weight: 500;
  cursor: pointer;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
  z-index: 9999;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  pointer-events: auto;
}

.exit-draw-btn:hover {
  background: rgba(40, 38, 30, 0.9);
  transform: translateX(-50%) scale(1.05);
}

.exit-draw-btn:active {
  transform: translateX(-50%) scale(0.95);
}
""")

print("Patched draw")
