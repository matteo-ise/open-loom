/**
 * First-run Setup (SPEC R13): Screen Recording, Camera, Microphone and ffmpeg
 * checks, each with a status pill and a working Fix button. The ffmpeg fix
 * downloads a static build with a live log.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import type { AppInfo, PermissionsSnapshot } from '@shared/types';
import { Icon } from '../components/icons';
import { useToasts, cleanIpcError } from '../components/ui';
import { Button } from 'matteo-brand';

type PillState = 'ok' | 'missing' | 'pending';

function CheckRow(props: {
  title: string;
  state: PillState;
  onFix?: () => void;
  fixing?: boolean;
  fixLabel?: string;
  progress?: number | null;
  statusText?: string;
}) {
  return (
    <div style={{ padding: '12px 0', borderBottom: '1px solid var(--ol-border)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {props.state === 'ok' ? (
            <div style={{ color: 'var(--ol-accent)' }}><Icon.Check width={18} height={18} /></div>
          ) : props.state === 'pending' || props.fixing ? (
            <div className="spinner" style={{ width: 18, height: 18 }} />
          ) : (
            <div style={{ color: 'var(--ol-text-secondary)' }}><Icon.Warning width={18} height={18} /></div>
          )}
          <span style={{ fontSize: '15px', fontWeight: 500, color: 'var(--ol-text)' }}>
            {props.title}
          </span>
        </div>
        {props.state !== 'ok' && props.onFix && (
          <Button
            variant="secondary"
            onClick={props.onFix}
            disabled={props.fixing}
          >
            {props.fixing ? 'Working...' : (props.fixLabel ?? 'Allow')}
          </Button>
        )}
      </div>
      {props.fixing && props.progress !== undefined && (
        <div style={{ marginTop: '12px', fontSize: '13px', color: 'var(--ol-text-secondary)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
            <span>{props.statusText || 'Working...'}</span>
            {typeof props.progress === 'number' && <span>{props.progress}%</span>}
          </div>
          <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.08)', borderRadius: '3px', overflow: 'hidden' }}>
            <div style={{
              width: typeof props.progress === 'number' ? `${props.progress}%` : '30%',
              height: '100%',
              background: 'var(--ol-accent)',
              borderRadius: '3px',
              transition: 'width 0.2s ease-out'
            }} />
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
  const [installingWhisper, setInstallingWhisper] = useState(false);
  const [pullingOllama, setPullingOllama] = useState(false);
  const [ollamaStatus, setOllamaStatus] = useState<{ running: boolean; modelInstalled: boolean } | null>(null);
  
  const [progress, setProgress] = useState<number | null>(null);
  const [statusText, setStatusText] = useState<string>('');

  const refresh = useCallback(async () => {
    setPerms(await window.openLoom.getPermissions());
    try {
      const status = await window.openLoom.checkOllamaStatus();
      setOllamaStatus(status);
    } catch {
      setOllamaStatus({ running: false, modelInstalled: false });
    }
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
        setStatusText('Compiling dependencies (this takes a moment)...');
      } else {
        setStatusText(line);
      }
    });
    return unsub;
  }, []);

  const isMac = info?.platform === 'darwin';

  const [autoInstalling, setAutoInstalling] = useState(false);

  const fixMedia = async (kind: 'camera' | 'mic') => {
    try {
      await window.openLoom.requestPermission(kind);
      const next = await window.openLoom.getPermissions();
      setPerms(next);
      const still = kind === 'camera' ? next.camera : next.mic;
      if (still !== 'granted') window.openLoom.openSystemSettings(kind);
    } catch (err) {
      push('error', cleanIpcError(err));
    }
  };

  const fixFfmpeg = async () => {
    setFetchingFfmpeg(true);
    setProgress(0);
    setStatusText('Downloading ffmpeg...');
    try {
      await window.openLoom.fetchFfmpeg();
      setProgress(100);
      setStatusText('ffmpeg ready!');
    } catch (err) {
      push('error', cleanIpcError(err));
      setProgress(null);
      setStatusText('');
    } finally {
      setFetchingFfmpeg(false);
      void refresh();
    }
  };

  const fixWhisper = async () => {
    setInstallingWhisper(true);
    setProgress(0);
    setStatusText('Installing whisper.cpp...');
    try {
      await window.openLoom.installWhisper();
      // Set transcription engine to whisper in settings automatically
      const current = await window.openLoom.getSettings();
      await window.openLoom.setSettings({ transcription: { ...current.transcription, engine: 'whisper' } });
      setProgress(100);
      setStatusText('whisper.cpp ready!');
    } catch (err) {
      push('error', cleanIpcError(err));
      setProgress(null);
      setStatusText('');
    } finally {
      setInstallingWhisper(false);
      void refresh();
    }
  };

  const fixOllama = async () => {
    if (!ollamaStatus?.running) {
      window.openLoom.openExternal('https://ollama.com');
      return;
    }
    setPullingOllama(true);
    setProgress(0);
    setStatusText('Starting pull...');
    try {
      await window.openLoom.pullOllamaModel();
      setProgress(100);
      setStatusText('Model ready!');
    } catch (err) {
      push('error', cleanIpcError(err));
      setProgress(null);
      setStatusText('');
    } finally {
      setPullingOllama(false);
      void refresh();
    }
  };

  const runAutoSetup = async () => {
    setAutoInstalling(true);
    
    // 1. Screen recording check (requires user action, we just guide them)
    let currentPerms = await window.openLoom.getPermissions();
    if (isMac && currentPerms.screen !== 'granted') {
      push('error', 'Please grant Screen Recording permission in System Settings first, then click Auto Setup again.');
      window.openLoom.openSystemSettings('screen');
      setAutoInstalling(false);
      return;
    }

    // 2. Camera & Mic request
    if (isMac && (currentPerms.camera !== 'granted' || currentPerms.mic !== 'granted')) {
      setStatusText('Requesting media permissions...');
      await window.openLoom.requestPermission('camera');
      await window.openLoom.requestPermission('mic');
      currentPerms = await window.openLoom.getPermissions();
      if (currentPerms.camera !== 'granted' || currentPerms.mic !== 'granted') {
        push('error', 'Please allow Camera & Microphone access in the system prompt or System Settings.');
        window.openLoom.openSystemSettings('camera');
        setAutoInstalling(false);
        return;
      }
    }

    // 3. ffmpeg
    if (!currentPerms.ffmpeg) {
      setFetchingFfmpeg(true);
      setProgress(0);
      setStatusText('Downloading Core Engine (ffmpeg)...');
      try {
        await window.openLoom.fetchFfmpeg();
      } catch (err) {
        push('error', `ffmpeg download failed: ${cleanIpcError(err)}`);
        setFetchingFfmpeg(false);
        setAutoInstalling(false);
        return;
      }
      setFetchingFfmpeg(false);
      await refresh();
    }

    // 4. Whisper transcription
    currentPerms = await window.openLoom.getPermissions();
    if (!currentPerms.whisper) {
      setInstallingWhisper(true);
      setProgress(0);
      setStatusText('Downloading Transcription Engine (whisper.cpp)...');
      try {
        await window.openLoom.installWhisper();
        const current = await window.openLoom.getSettings();
        await window.openLoom.setSettings({ transcription: { ...current.transcription, engine: 'whisper' } });
      } catch (err) {
        push('error', `Whisper installation failed: ${cleanIpcError(err)}`);
        setInstallingWhisper(false);
        setAutoInstalling(false);
        return;
      }
      setInstallingWhisper(false);
      await refresh();
    }

    // 5. Ollama status & pull
    const status = await window.openLoom.checkOllamaStatus();
    if (!status.running) {
      push('info', 'Ollama app is not running. Opening ollama.com for installation. Please start Ollama, then click Auto Setup.');
      window.openLoom.openExternal('https://ollama.com');
    } else if (!status.modelInstalled) {
      setPullingOllama(true);
      setProgress(0);
      setStatusText('Downloading AI model (Llama 3.2)...');
      try {
        await window.openLoom.pullOllamaModel();
      } catch (err) {
        push('error', `Model download failed: ${cleanIpcError(err)}`);
        setPullingOllama(false);
        setAutoInstalling(false);
        return;
      }
      setPullingOllama(false);
      await refresh();
    }

    setAutoInstalling(false);
    await refresh();
  };

  const screenState: PillState = !perms ? 'pending' : !isMac || perms.screen === 'granted' ? 'ok' : 'missing';
  const mediaState: PillState = !perms ? 'pending' : (!isMac || (perms.camera === 'granted' && perms.mic === 'granted')) ? 'ok' : 'missing';
  const ffmpegState: PillState = !perms ? 'pending' : perms.ffmpeg ? 'ok' : 'missing';
  const whisperState: PillState = !perms ? 'pending' : perms.whisper ? 'ok' : 'missing';
  
  let ollamaState: PillState = 'pending';
  if (ollamaStatus) {
    ollamaState = ollamaStatus.running && ollamaStatus.modelInstalled ? 'ok' : 'missing';
  }

  const screenReady = screenState === 'ok';
  const mediaReady = mediaState === 'ok';
  const ffmpegReady = ffmpegState === 'ok';
  const whisperReady = whisperState === 'ok';
  const ollamaReady = ollamaState === 'ok';

  // Core app operation requires screen, media, ffmpeg, and transcription
  const canContinue = screenReady && mediaReady && ffmpegReady && whisperReady;

  return (
    <div className="setup" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: 'var(--ol-bg)' }}>
      <div className="setup-drag" aria-hidden="true" style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 44, WebkitAppRegion: 'drag' } as any} />
      
      <div style={{ width: '420px', display: 'flex', flexDirection: 'column', gap: '32px' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 64, height: 64, borderRadius: 16, background: 'var(--ol-accent)', margin: '0 auto 24px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon.Record width={32} height={32} style={{ color: 'var(--ol-on-accent)' }} />
          </div>
          <h1 style={{ fontSize: '24px', fontWeight: 600, margin: '0 0 8px 0' }}>Welcome to Open Loom</h1>
          <p style={{ color: 'var(--ol-text-secondary)', margin: 0, fontSize: '15px' }}>
            Let's get everything ready. We default to using <b>Llama 3.2</b> with Ollama, which is extremely fast and lightweight for local summaries.
          </p>
        </div>

        <div style={{ background: 'var(--ol-surface)', borderRadius: '16px', padding: '8px 20px', border: '1px solid var(--ol-border)' }}>
          <CheckRow
            title="Screen Recording"
            state={screenState}
            onFix={() => window.openLoom.openSystemSettings('screen')}
          />
          <CheckRow
            title="Camera & Microphone"
            state={mediaState}
            onFix={() => {
              void fixMedia('camera');
              void fixMedia('mic');
            }}
          />
          <CheckRow
            title="Core Engine (ffmpeg)"
            state={ffmpegState}
            fixLabel="Download"
            onFix={() => void fixFfmpeg()}
            fixing={fetchingFfmpeg}
            progress={fetchingFfmpeg ? progress : null}
            statusText={fetchingFfmpeg ? statusText : ''}
          />
          <CheckRow
            title="Local Transcription"
            state={whisperState}
            fixLabel="Download"
            onFix={() => void fixWhisper()}
            fixing={installingWhisper}
            progress={installingWhisper ? progress : null}
            statusText={installingWhisper ? statusText : ''}
          />
          <CheckRow
            title="AI Summaries (Ollama)"
            state={ollamaState}
            fixLabel={!ollamaStatus?.running ? 'Install App' : 'Download Model'}
            onFix={() => void fixOllama()}
            fixing={pullingOllama}
            progress={pullingOllama ? progress : null}
            statusText={pullingOllama ? statusText : ''}
          />
        </div>

        {canContinue ? (
          <Button
            variant="primary"
            style={{ width: '100%', justifyContent: 'center' }}
            onClick={onDone}
          >
            Start using Open Loom
          </Button>
        ) : (
          <Button
            variant="primary"
            style={{ width: '100%', justifyContent: 'center' }}
            disabled={autoInstalling}
            onClick={runAutoSetup}
          >
            {autoInstalling ? `Auto-Setup: ${statusText || 'Working...'}` : 'One-Click Auto Setup'}
          </Button>
        )}
      </div>
    </div>
  );
}
