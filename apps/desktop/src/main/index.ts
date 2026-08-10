/**
 * Open Loom main process entry.
 * Boot order matters: privileged scheme before ready; handlers, windows,
 * shortcuts, tray after ready. Closing the main window keeps the app alive
 * in the tray (SPEC R12).
 */
import { app, BrowserWindow, dialog } from 'electron';
import electronUpdater from 'electron-updater';
const { autoUpdater } = electronUpdater;
import { registerScheme, installProtocolHandler } from './protocol';
import { installDisplayMediaHandler } from './capture';
import { registerIpc } from './ipc';
import { registerEngineIpc } from './recorder-ipc';
import { createMainWindow } from './windows';
import { installShortcuts, unregisterAllShortcuts } from './shortcuts';
import { installTray } from './tray';
import { installClickHighlights, shutdownClickHighlights } from './clicks';
import { log } from './logger';
import { runTestHooks } from './test-hooks';

// Test isolation: point userData at a scratch dir (e2e + boot checks).
if (process.env['OPENLOOM_USER_DATA']) {
  app.setPath('userData', process.env['OPENLOOM_USER_DATA']);
}

registerScheme();

const gotLock = app.requestSingleInstanceLock();

// Global crash handlers
process.on('uncaughtException', (error) => {
  log.error('Uncaught Exception: ' + error.message);
  dialog.showErrorBox('Unexpected Error', error.message || 'An unknown error occurred.');
});

process.on('unhandledRejection', (reason) => {
  log.error('Unhandled Rejection: ' + String(reason));
});

if (!gotLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    createMainWindow();
  });

  app.whenReady().then(() => {
    installProtocolHandler();
    installDisplayMediaHandler();
    registerIpc();
    registerEngineIpc();
    createMainWindow();
    installShortcuts();
    installTray();
    installClickHighlights();
    log.info(`Open Loom ready (v${app.getVersion()}, ${process.platform} ${process.getSystemVersion?.() ?? ''})`);
    void runTestHooks();
    
    // Check for updates
    if (!process.env['OPENLOOM_USER_DATA']) {
      autoUpdater.checkForUpdatesAndNotify().catch(err => log.error('Auto updater error: ' + String(err)));
    }
  });

  // Keep running in the tray when every window is closed, on all platforms.
  app.on('window-all-closed', () => {
    /* stay alive; Quit lives in the tray menu and app menu */
  });

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createMainWindow();
  });

  app.on('will-quit', () => {
    unregisterAllShortcuts();
    shutdownClickHighlights();
  });
}
