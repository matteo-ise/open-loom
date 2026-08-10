/**
 * Tray / menubar app (SPEC R12). Template icon so macOS tints it correctly
 * in light/dark menu bars; the same PNG works on Windows/Linux trays.
 */
import { app, Menu, nativeImage, Tray } from 'electron';
import fs from 'node:fs';
import path from 'node:path';
import { log } from './logger';
import { createMainWindow, broadcast } from './windows';
import {
  cancelRecording,
  isPaused,
  isRecordingActive,
  pauseRecording,
  resumeRecording,
  stopRecording,
  currentState,
} from './recorder-ipc';
import { getSettings } from './settings';

let tray: Tray | null = null;

function trayIcon(): Electron.NativeImage {
  const candidates = [
    // Packaged: electron-builder copies assets/ to Contents/Resources/assets.
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
  log.warn('tray template icon missing; using empty icon');
  return nativeImage.createEmpty();
}

function rebuildMenu(): void {
  if (!tray) return;
  const recording = isRecordingActive();
  const paused = isPaused();
  const menuItems: Electron.MenuItemConstructorOptions[] = [];

  if (recording) {
    menuItems.push(
      {
        label: '🛑 Stop and save recording',
        enabled: true,
        click: () =>
          void stopRecording()
            .catch((err) => log.error(`tray stop failed: ${String(err)}`))
            .finally(() => rebuildMenu()),
      },
      {
        label: paused ? '▶️ Resume recording' : '⏸ Pause recording',
        enabled: true,
        click: () => void (paused ? resumeRecording() : pauseRecording()).then(() => rebuildMenu()),
      },
      {
        label: 'Cancel recording',
        enabled: true,
        click: () => void cancelRecording().finally(() => rebuildMenu()),
      },
      { type: 'separator' }
    );
  } else {
    menuItems.push(
      {
        label: 'New Screen Recording',
        click: () => void startQuick('screen-cam'),
      },
      {
        label: 'Start Meeting Recording',
        click: () => void startQuick('meeting'),
      },
      { type: 'separator' }
    );
  }

  menuItems.push(
    { label: 'Open Library', click: () => createMainWindow() },
    {
      label: 'Settings',
      click: () => {
        createMainWindow();
        broadcast('ol:navigate', { view: 'settings' });
      },
    },
    { type: 'separator' },
    { label: 'Quit Open Loom', click: () => app.quit() }
  );

  tray.setContextMenu(Menu.buildFromTemplate(menuItems));
}

async function startQuick(mode: 'screen-cam' | 'screen' | 'meeting'): Promise<void> {
  const { desktopCapturer } = await import('electron');
  const settings = getSettings();
  const screens = await desktopCapturer.getSources({ types: ['screen'], thumbnailSize: { width: 0, height: 0 } });
  const first = screens[0];
  if (!first) {
    log.error('tray start: no screen available (missing permissions?)');
    return;
  }
  const { startRecording } = await import('./recorder-ipc');
  try {
    await startRecording({
      mode,
      sourceId: first ? first.id : undefined,
      sourceIsDisplay: true,
      cameraId: mode === 'meeting' ? undefined : (settings.recording.cameraId || undefined),
      micId: settings.recording.micId || undefined,
      cameraOn: mode === 'screen-cam',
      micOn: true,
      systemAudio: true, // Meeting mode always captures system audio
      quality: settings.recording.quality,
      fps: settings.recording.fps,
    });
  } catch (err) {
    log.error(`tray start failed: ${String(err)}`);
    createMainWindow();
  } finally {
    rebuildMenu();
  }
}

export function installTray(): void {
  if (tray) return;
  try {
    tray = new Tray(trayIcon());
    tray.setToolTip('Open Loom');
    rebuildMenu();
    // Keep menu enable/disable state fresh without thrashing an open menu.
    let last = '';
    setInterval(() => {
      const active = isRecordingActive();
      const paused = isPaused();
      const key = `${active}:${paused}`;
      
      if (active) {
        const state = currentState();
        const mins = Math.floor(state.elapsedSec / 60).toString().padStart(2, '0');
        const secs = (state.elapsedSec % 60).toString().padStart(2, '0');
        tray?.setTitle(paused ? `⏸ ${mins}:${secs}` : `🔴 ${mins}:${secs}`);
      } else {
        tray?.setTitle('');
      }

      if (key !== last) {
        last = key;
        rebuildMenu();
      }
    }, 1000);
  } catch (err) {
    log.error(`tray init failed: ${String(err)}`);
  }
}
