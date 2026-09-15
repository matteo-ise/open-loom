import { useCallback, useEffect, useState } from 'react';
import { AppInfo, PermissionsSnapshot } from '@open-loom/shared';
import { Icon } from '../components/icons';
import { useToasts } from '../components/ui';

type PillState = 'pending' | 'ok' | 'missing';

function cleanIpcError(err: unknown): string {
  const s = String(err);
  if (s.includes('IPC method')) return s.split('IPC method')[0].replace('Error: ', '');
  return s.replace('Error: ', '');
}

function ElegantRow(props: {
  title: string;
  optional?: boolean;
  state: PillState;
  onFix?: () => void;
  fixLabel?: string;
  fixing?: boolean;
  progress?: number | null;
  statusText?: string;
}) {
  return (
    <div className="elegant-row">
      <div className="elegant-row-main">
        <div className="elegant-row-left">
          <div className={`elegant-row-icon ${props.state}`}>
            {props.state === 'ok' ? (
              <Icon.Check width={20} height={20} />
            ) : props.fixing ? (
              <div className="spinner" style={{width: 18, height: 18, opacity: 0.6}} />
            ) : (
              <Icon.Record width={20} height={20} />
            )}
          </div>
          <span className="elegant-row-title">
            {props.title}
            {props.optional && <span className="optional">(Optional)</span>}
          </span>
        </div>
        
        {props.state !== 'ok' && props.onFix && (
          <button
            className="elegant-row-fix"
            onClick={props.onFix}
            disabled={props.fixing}
          >
            {props.fixing ? 'Working...' : (props.fixLabel ?? 'Allow')}
          </button>
        )}
      </div>

      {props.fixing && props.progress !== undefined && (
        <div className="elegant-row-progress">
          <div className="progress-text">
            <span style={{overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginRight: 16}}>{props.statusText || 'Working...'}</span>
            {typeof props.progress === 'number' && !String(props.statusText).includes('%') && <span>{props.progress}%</span>}
          </div>
          <div className="progress-bar-bg">
            <div 
              className="progress-bar-fill"
              style={{ width: typeof props.progress === 'number' ? `${props.progress}%` : '30%' }} 
            />
          </div>
        </div>
      )}
    </div>
  );
}

export function SetupView({ onDone }: { onDone: () => void }) {
  const { push } = useToasts();
  const [perms, setPerms] = useState<PermissionsSnapshot | null>(null);
  const [info, setInfo] = useState<AppInfo | null>(null);
  const [fetchingFfmpeg, setFetchingFfmpeg] = useState(false);
  
  const [progress, setProgress] = useState<number | null>(null);
  const [statusText, setStatusText] = useState<string>('');
  const [autoInstalling, setAutoInstalling] = useState(false);

  const refresh = useCallback(async () => {
    setPerms(await window.openLoom.getPermissions());
  }, []);

  useEffect(() => {
    void refresh();
    void window.openLoom.appInfo().then(setInfo);
    const timer = setInterval(() => void refresh(), 2000);
    return () => clearInterval(timer);
  }, [refresh]);

  useEffect(() => {
    const unsub = window.openLoom.onSetupLog((line) => {
      const pctMatch = /(\d+)%/.exec(line);
      if (pctMatch && pctMatch[1]) {
        setProgress(Number(pctMatch[1]));
      }
      if (line.length > 70 || /c\+\+|-I|D_XOPEN|clang|gcc|ld/.test(line)) {
        setStatusText('Optimizing engine (this takes a moment)...');
      } else {
        setStatusText(line);
      }
    });
    return unsub;
  }, []);

  const isMac = info?.platform === 'darwin';

  const fixMedia = async (kind: 'camera' | 'mic') => {
    try {
      await window.openLoom.requestPermission(kind);
      await refresh();
    } catch (err) {
      push('error', cleanIpcError(err));
    }
  };

  const fixFfmpeg = async () => {
    setFetchingFfmpeg(true);
    setProgress(0);
    setStatusText('Downloading Core Engine...');
    try {
      await window.openLoom.fetchFfmpeg();
      setProgress(100);
      setStatusText('Ready');
    } catch (err) {
      push('error', cleanIpcError(err));
      setProgress(null);
      setStatusText('');
    } finally {
      setFetchingFfmpeg(false);
      void refresh();
    }
  };

  const runAutoSetup = async () => {
    setAutoInstalling(true);
    
    let currentPerms = await window.openLoom.getPermissions();
    if (isMac && currentPerms.screen !== 'granted') {
      push('error', 'Please grant Screen Recording permission in System Settings.');
      window.openLoom.openSystemSettings('screen');
      setAutoInstalling(false);
      return;
    }

    if (isMac && (currentPerms.camera !== 'granted' || currentPerms.mic !== 'granted')) {
      setStatusText('Requesting media permissions...');
      await window.openLoom.requestPermission('camera');
      await window.openLoom.requestPermission('mic');
      currentPerms = await window.openLoom.getPermissions();
      if (currentPerms.camera !== 'granted' || currentPerms.mic !== 'granted') {
        push('error', 'Please allow Camera & Microphone access.');
        window.openLoom.openSystemSettings('camera');
        setAutoInstalling(false);
        return;
      }
    }

    if (!currentPerms.ffmpeg) {
      setFetchingFfmpeg(true);
      setProgress(0);
      setStatusText('Downloading Core Engine...');
      try {
        await window.openLoom.fetchFfmpeg();
      } catch (err) {
        push('error', `Download failed: ${cleanIpcError(err)}`);
        setFetchingFfmpeg(false);
        setAutoInstalling(false);
        return;
      }
      setFetchingFfmpeg(false);
      await refresh();
    }

    setAutoInstalling(false);
    await refresh();
  };

  const screenState: PillState = !perms ? 'pending' : !isMac || perms.screen === 'granted' ? 'ok' : 'missing';
  const mediaState: PillState = !perms ? 'pending' : (!isMac || (perms.camera === 'granted' && perms.mic === 'granted')) ? 'ok' : 'missing';
  const ffmpegState: PillState = !perms ? 'pending' : perms.ffmpeg ? 'ok' : 'missing';
  
  const canContinue = screenState === 'ok' && mediaState === 'ok' && ffmpegState === 'ok';

  return (
    <div className="setup">
      <div className="setup-drag" aria-hidden="true" style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 44, WebkitAppRegion: 'drag', zIndex: 10 } as any} />
      
      <div className="watercolor-bg">
        <div className="watercolor-blob blob-1" />
        <div className="watercolor-blob blob-2" />
        <div className="watercolor-blob blob-3" />
      </div>

      <div className="setup-content">
        <div className="setup-title">
          <h1>Welcome to Open Loom</h1>
          <p>Let's get everything ready. It only takes a moment.</p>
        </div>

        <div className="setup-glass-card">
          <ElegantRow
            title="Screen Recording"
            state={screenState}
            onFix={() => window.openLoom.openSystemSettings('screen')}
            fixLabel="Settings"
          />
          <ElegantRow
            title="Camera & Microphone"
            state={mediaState}
            onFix={() => {
              void fixMedia('camera');
              void fixMedia('mic');
            }}
          />
          <ElegantRow
            title="Core Engine"
            state={ffmpegState}
            fixLabel="Download"
            onFix={() => void fixFfmpeg()}
            fixing={fetchingFfmpeg}
            progress={fetchingFfmpeg ? progress : null}
            statusText={fetchingFfmpeg ? statusText : ''}
          />
        </div>

        {canContinue ? (
          <button className="setup-main-btn" onClick={onDone}>
            Start Recording
          </button>
        ) : (
          <button
            className="setup-main-btn secondary"
            disabled={autoInstalling}
            onClick={runAutoSetup}
          >
            {autoInstalling ? `Working...` : 'One-Click Setup'}
          </button>
        )}
      </div>
    </div>
  );
}
