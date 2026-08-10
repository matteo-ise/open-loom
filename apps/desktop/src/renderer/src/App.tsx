/**
 * Main window app shell: translucent sidebar (folders + navigation), view
 * routing (Setup, Library, Watch, Settings), the New-recording panel,
 * recording status strip, crash recovery banner and toasts.
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import type {
  Folder,
  PermissionsSnapshot,
  RecordingState,
  RecoverableRecording,
  Settings,
  VideoMeta,
} from '@shared/types';
import { Icon } from './components/icons';
import { ToastProvider, useToasts, cleanIpcError, formatDuration } from './components/ui';
import { SetupView } from './views/Setup';
import { LibraryView } from './views/Library';
import { WatchView } from './views/Watch';
import { EditorView } from './views/Editor';
import { AnalyticsView } from './views/Analytics';
import { SettingsView } from './views/Settings';
import { NewRecordingPanel } from './views/NewRecording';
import { GlobalErrorBoundary } from './components/ErrorBoundary';

export type View =
  | { name: 'library'; folderId: string | null }
  | { name: 'watch'; id: string }
  | { name: 'editor'; id: string }
  | { name: 'analytics'; id: string }
  | { name: 'settings'; pane?: string }
  | { name: 'setup' };

function applyTheme(theme: Settings['theme']): void {
  const rootEl = document.documentElement;
  rootEl.dataset['theme'] = 'dark';
  rootEl.classList.add('dark');
}

function AppInner() {
  const { push } = useToasts();
  const [settings, setSettings] = useState<Settings | null>(null);
  const [permissions, setPermissions] = useState<PermissionsSnapshot | null>(null);
  const [view, setView] = useState<View>({ name: 'library', folderId: null });
  const [videos, setVideos] = useState<VideoMeta[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [recState, setRecState] = useState<RecordingState>({ status: 'idle', elapsedSec: 0 });
  const [recorderOpen, setRecorderOpen] = useState(false);
  const [recoverables, setRecoverables] = useState<RecoverableRecording[]>([]);
  const [booted, setBooted] = useState(false);

  const reloadLibrary = useCallback(async () => {
    try {
      const [v, f] = await Promise.all([window.openLoom.listVideos(), window.openLoom.listFolders()]);
      setVideos(v);
      setFolders(f);
    } catch (err) {
      push('error', cleanIpcError(err));
    }
  }, [push]);

  // Boot: settings, permissions, library, recovery, subscriptions.
  useEffect(() => {
    void (async () => {
      try {
        const [s, p, rec] = await Promise.all([
          window.openLoom.getSettings(),
          window.openLoom.getPermissions(),
          window.openLoom.listRecoverable(),
        ]);
        setSettings(s);
        applyTheme(s.theme);
        setPermissions(p);
        setRecoverables(rec);
        const platform = (await window.openLoom.appInfo()).platform;
        const needsSetup =
          !s.setupComplete || !p.ffmpeg || (platform === 'darwin' && p.screen !== 'granted');
        if (needsSetup) setView({ name: 'setup' });
        await reloadLibrary();
      } catch (err) {
        push('error', cleanIpcError(err));
      } finally {
        setBooted(true);
      }
    })();
  }, [reloadLibrary, push]);

  useEffect(() => {
    const offState = window.openLoom.onRecordingState((s) => {
      setRecState((prev) => {
        if (s.error && s.error !== prev.error) push('error', s.error);
        if (s.lastVideoId && s.lastVideoId !== prev.lastVideoId) {
          void reloadLibrary().then(() => setView({ name: 'watch', id: s.lastVideoId! }));
        }
        return s;
      });
    });
    const offNav = window.openLoomInternal.onNavigate((nav) => {
      if (nav.view === 'settings') setView({ name: 'settings' });
      if (nav.view === 'library') setView({ name: 'library', folderId: null });
      if (nav.view === 'new-recording') {
        setView({ name: 'library', folderId: null });
        setRecorderOpen(true);
      }
    });
    const offSettings = window.openLoomInternal.onSettingsChanged((s) => {
      setSettings(s);
      applyTheme(s.theme);
    });
    // Toasts pushed from the main process (e.g. the share-on-stop flow).
    const offToast = window.openLoomInternal.onToast((t) => push(t.kind, t.text));
    // Keep the shared/local badge honest as background uploads finish.
    const offJob = window.openLoom.onJobProgress((j) => {
      if (j.kind === 'upload' && j.pct >= 100) void reloadLibrary();
    });
    return () => {
      offState();
      offNav();
      offSettings();
      offToast();
      offJob();
    };
  }, [push, reloadLibrary]);

  const folderCounts = useMemo(() => {
    const counts = new Map<string | null, number>();
    for (const v of videos) {
      const key = v.folderId ?? null;
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
    return counts;
  }, [videos]);

  const updateSettings = useCallback(
    async (patch: Partial<Settings>) => {
      try {
        const next = await window.openLoom.setSettings(patch);
        setSettings(next);
        applyTheme(next.theme);
        return next;
      } catch (err) {
        push('error', cleanIpcError(err));
        return null;
      }
    },
    [push]
  );

  if (!booted || !settings || !permissions) {
    return <div className="boot" aria-label="Loading" />;
  }

  if (view.name === 'setup') {
    return (
      <SetupView
        onDone={async () => {
          await updateSettings({ setupComplete: true });
          setPermissions(await window.openLoom.getPermissions());
          setView({ name: 'library', folderId: null });
        }}
      />
    );
  }

  const isRecording = recState.status === 'recording' || recState.status === 'paused';
  const isProcessing = recState.status === 'processing';

  return (
    <div className="shell">
      <nav className="sidebar" aria-label="Main Navigation">
        <div className="sidebar-drag" aria-hidden="true" />
        <div className="sidebar-record">
          <button
            type="button"
            className="btn-primary"
            style={{ width: '100%', justifyContent: 'center' }}
            onClick={() => setRecorderOpen(true)}
            disabled={isRecording || isProcessing}
          >
            <Icon.Record width={16} height={16} />
            New recording
          </button>
        </div>
        <div className="sidebar-nav">
          <button
            type="button"
            className={`side-item ${view.name === 'library' && view.folderId === null ? 'selected' : ''}`}
            onClick={() => setView({ name: 'library', folderId: null })}
          >
            <Icon.Library width={16} height={16} />
            <span>Library</span>
            {videos.length > 0 && <span className="side-count">{videos.length}</span>}
          </button>
          
          {folders.length > 0 && <div className="side-group">Folders</div>}
          {folders.map(f => (
            <button
              key={f.id}
              type="button"
              className={`side-item ${view.name === 'library' && view.folderId === f.id ? 'selected' : ''}`}
              onClick={() => setView({ name: 'library', folderId: f.id })}
            >
              <Icon.Folder width={16} height={16} />
              <span>{f.name}</span>
              {(folderCounts.get(f.id) ?? 0) > 0 && <span className="side-count">{folderCounts.get(f.id)}</span>}
            </button>
          ))}
          
          <button
            type="button"
            className="side-item"
            style={{ opacity: 0.7 }}
            onClick={async () => {
              const name = `New folder ${folders.length + 1}`;
              try {
                const f = await window.openLoom.createFolder(name);
                await reloadLibrary();
                setView({ name: 'library', folderId: f.id });
              } catch (err) {
                push('error', cleanIpcError(err));
              }
            }}
          >
            <Icon.FolderPlus width={16} height={16} />
            <span>New folder...</span>
          </button>
        </div>
        
        <div className="sidebar-foot">
          <button
            type="button"
            className={`side-item ${view.name === 'settings' ? 'selected' : ''}`}
            onClick={() => setView({ name: 'settings' })}
          >
            <Icon.Settings width={16} height={16} />
            <span>Settings</span>
          </button>
        </div>
      </nav>

      <main className="content relative">
        <div className="content-drag" aria-hidden="true" />

      {(isRecording || isProcessing) && (
        <div className={`rec-strip${isProcessing ? ' processing' : ''}`}>
          {isRecording ? (
            <>
              <span className="rec-strip-dot" />
              {recState.status === 'paused' ? 'Paused' : 'Recording'} · {formatDuration(recState.elapsedSec)}
              <span className="rec-strip-hint">Use the control bar on screen to stop.</span>
            </>
          ) : (
            <>
              <span className="spinner" aria-hidden="true" />
              Processing recording{recState.processingNote ? ` · ${recState.processingNote}` : ''}
            </>
          )}
        </div>
      )}

      {recoverables.length > 0 && view.name === 'library' && (
        <div className="recover-banner">
          <Icon.Warning width={16} height={16} />
          <div className="recover-text">
            <strong>
              {recoverables.length === 1
                ? 'A recording did not finish saving.'
                : `${recoverables.length} recordings did not finish saving.`}
            </strong>
            <span>Open Loom kept the captured video. Recover it into your library or discard it.</span>
          </div>
          <div className="recover-actions">
            <button
              type="button"
              className="btn-secondary"
              onClick={async () => {
                for (const r of recoverables) {
                  try {
                    await window.openLoom.discardRecoverable(r.tempId);
                  } catch (err) {
                    push('error', cleanIpcError(err));
                  }
                }
                setRecoverables(await window.openLoom.listRecoverable());
              }}
            >
              Discard
            </button>
            <button
              type="button"
              className="btn-primary"
              onClick={async () => {
                for (const r of recoverables) {
                  try {
                    await window.openLoom.recoverRecording(r.tempId);
                    push('success', 'Recording recovered into your library.');
                  } catch (err) {
                    push('error', cleanIpcError(err));
                  }
                }
                setRecoverables(await window.openLoom.listRecoverable());
                await reloadLibrary();
              }}
            >
              Recover
            </button>
          </div>
        </div>
      )}

      {view.name === 'library' && (
        <LibraryView
          videos={videos}
          folders={folders}
          folderId={view.folderId}
          onOpen={(id) => setView({ name: 'watch', id })}
          onChanged={reloadLibrary}
          onRecord={() => setRecorderOpen(true)}
          onOpenSharingSettings={() => setView({ name: 'settings', pane: 'sharing' })}
        />
      )}
      {view.name === 'watch' && (
        <WatchView
          id={view.id}
          folders={folders}
          settings={settings}
          onBack={() => setView({ name: 'library', folderId: null })}
          onEdit={() => setView({ name: 'editor', id: view.id })}
          onAnalytics={() => setView({ name: 'analytics', id: view.id })}
          onChanged={reloadLibrary}
          onDeleted={() => {
            void reloadLibrary();
            setView({ name: 'library', folderId: null });
          }}
          onOpenSharingSettings={() => setView({ name: 'settings', pane: 'sharing' })}
        />
      )}
      {view.name === 'editor' && (
        <EditorView
          id={view.id}
          onBack={() => setView({ name: 'watch', id: view.id })}
          onChanged={reloadLibrary}
        />
      )}
      {view.name === 'analytics' && (
        <AnalyticsView
          id={view.id}
          settings={settings}
          onBack={() => setView({ name: 'watch', id: view.id })}
        />
      )}
      {view.name === 'settings' && (
        <SettingsView settings={settings} onUpdate={updateSettings} initialPane={view.pane} />
      )}

      {recorderOpen && settings && (
        <NewRecordingPanel
          settings={settings}
          onClose={() => setRecorderOpen(false)}
          onStarted={() => setRecorderOpen(false)}
        />
      )}
    </main>
    </div>
  );
}

export function App() {
  return (
    <GlobalErrorBoundary>
      <ToastProvider>
        <AppInner />
      </ToastProvider>
    </GlobalErrorBoundary>
  );
}
