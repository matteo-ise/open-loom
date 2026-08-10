/**
 * Webcam bubble window (SPEC R6): circular live camera, draggable anywhere,
 * S/M/L switcher + mirror toggle on hover. The window itself is the circle;
 * the OS composites it over everything and full-screen capture records it
 * naturally.
 */
import './styles/bubble.css';

const root = document.getElementById('bubble-root')!;
root.innerHTML = `
  <div class="bubble" id="bubble">
    <video id="bubble-video" autoplay playsinline muted></video>
    <div class="bubble-off" id="bubble-off" hidden>
      <span>Camera is off</span>
    </div>
    <div class="bubble-controls" id="bubble-controls">
      <button type="button" data-size="S" title="Small">S</button>
      <button type="button" data-size="M" title="Medium">M</button>
      <button type="button" data-size="L" title="Large">L</button>
      <button type="button" id="bubble-mirror" title="Mirror camera">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path d="M12 3v18"/><path d="M8 7 4 12l4 5"/><path d="m16 7 4 5-4 5"/>
        </svg>
      </button>
    </div>
  </div>
`;

const bubbleEl = document.getElementById('bubble')!;
const video = document.getElementById('bubble-video') as HTMLVideoElement;
const offOverlay = document.getElementById('bubble-off')!;
const mirrorBtn = document.getElementById('bubble-mirror')!;

let mirror = true;
let currentStream: MediaStream | null = null;

function applyMirror(): void {
  video.style.transform = mirror ? 'scaleX(-1)' : 'none';
  mirrorBtn.classList.toggle('active', mirror);
}

// 'full' turns the (window-resized) bubble into an opaque full-frame camera so
// full-display capture records the face full-screen. The window itself is
// resized by the main process; this just swaps the circle styling for a
// rectangular cover-fit (SPEC R6).
window.openLoomInternal.onBubbleLayout((layout) => {
  bubbleEl.classList.toggle('full', layout === 'full');
});

async function startCamera(): Promise<void> {
  const settings = await window.openLoomInternal.getSettings();
  mirror = settings.bubble.mirror;
  applyMirror();
  try {
    const perms = await window.openLoom.getPermissions();
    if (perms.camera !== 'granted') {
      offOverlay.hidden = false;
      offOverlay.querySelector('span')!.textContent = 'Camera permission required';
      return;
    }

    currentStream = await navigator.mediaDevices.getUserMedia({
      video: {
        deviceId: settings.recording.cameraId ? { ideal: settings.recording.cameraId } : undefined,
        width: { ideal: 1280 },
        height: { ideal: 720 },
      },
    });
    
    const vt = currentStream.getVideoTracks()[0];
    if (vt) {
      console.log(`[Camera Bubble] Track: label="${vt.label}", muted=${vt.muted}`);
      if (vt.muted) {
        offOverlay.hidden = false;
        offOverlay.querySelector('span')!.textContent = 'Camera blocked by macOS settings';
      } else {
        offOverlay.hidden = true;
      }
      
      vt.onmute = () => {
        console.warn('[Camera Bubble] Track muted');
        offOverlay.hidden = false;
        offOverlay.querySelector('span')!.textContent = 'Camera blocked by macOS';
      };
      vt.onunmute = () => {
        console.log('[Camera Bubble] Track unmuted');
        offOverlay.hidden = true;
      };
    } else {
      offOverlay.hidden = false;
      offOverlay.querySelector('span')!.textContent = 'No camera track found';
    }

    video.srcObject = currentStream;
  } catch (err: any) {
    console.error('[Camera Bubble] getUserMedia error:', err);
    offOverlay.hidden = false;
    offOverlay.querySelector('span')!.textContent = 'Camera unavailable';
  }
}

for (const btn of Array.from(document.querySelectorAll<HTMLButtonElement>('[data-size]'))) {
  btn.addEventListener('click', () => {
    window.openLoom.setBubbleSize(btn.dataset.size as 'S' | 'M' | 'L');
  });
}

mirrorBtn.addEventListener('click', () => {
  mirror = !mirror;
  applyMirror();
  window.openLoomInternal.setBubbleMirror(mirror);
});

window.openLoomInternal.onSettingsChanged((s) => {
  if (s.bubble.mirror !== mirror) {
    mirror = s.bubble.mirror;
    applyMirror();
  }
});

window.addEventListener('beforeunload', () => {
  if (currentStream) for (const t of currentStream.getTracks()) t.stop();
});

void startCamera();
