import { app, Menu, nativeImage, Tray } from 'electron';
import fs from 'node:fs';
import path from 'node:path';
import { log } from './logger';
import { createMainWindow, broadcast, toggleHud } from './windows';
import {
  isPaused,
  isRecordingActive,
  currentState,
} from './recorder-ipc';

let tray: Tray | null = null;

function trayIcon(): Electron.NativeImage {
  const candidates = [
    path.resolve(process.resourcesPath, 'assets/tray/trayTemplate.png'),
    path.resolve(app.getAppPath(), '../../assets/tray/trayTemplate.png'),
    path.resolve(app.getAppPath(), 'assets/tray/trayTemplate.png'),
    path.resolve(import.meta.dirname, '../../assets/tray/trayTemplate.png'),
  ];
  for (const p of candidates) {
    if (fs.existsSync(p)) {
      const img = nativeImage.createFromPath(p);
      img.setTemplateImage(true);
      return img;
    }
  }
  return nativeImage.createEmpty();
}

export function installTray(): void {
  if (tray) return;
  try {
    tray = new Tray(trayIcon());
    tray.setToolTip('Open Loom');
    tray.setIgnoreDoubleClickEvents(true);
    
    tray.on('click', () => {
       
      toggleHud(tray!.getBounds());
    });

    setInterval(() => {
      const active = isRecordingActive();
      const paused = isPaused();
      
      if (active) {
        const state = currentState();
        const mins = Math.floor(state.elapsedSec / 60).toString().padStart(2, '0');
        const secs = (state.elapsedSec % 60).toString().padStart(2, '0');
        tray?.setTitle(paused ? `⏸ ${mins}:${secs}` : `🔴 ${mins}:${secs}`);
      } else {
        tray?.setTitle('');
      }
    }, 1000);
  } catch (err) {
    log.error(`tray init failed: ${String(err)}`);
  }
}
