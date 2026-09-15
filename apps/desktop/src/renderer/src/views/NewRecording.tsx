/**
 * Minimal New-recording panel: Apple-style square blocks.
 */
import { useCallback, useEffect, useState } from 'react';
import type { CaptureSource, Settings } from '@shared/types';
import { Icon } from '../components/icons';
import { Modal, useToasts, cleanIpcError } from '../components/ui';

export function NewRecordingPanel({
  settings,
  onClose,
  onStarted,
}: {
  settings: Settings;
  onClose: () => void;
  onStarted: () => void;
}) {
  const { push } = useToasts();
  const [sources, setSources] = useState<CaptureSource[]>([]);
  const [starting, setStarting] = useState<string | null>(null);

  useEffect(() => {
    // Explicitly request OS permissions first so the app appears in macOS Settings!
    void window.openLoom.requestPermission('camera');
    void window.openLoom.requestPermission('mic');
    
    window.openLoom.listCaptureSources().then(setSources).catch(() => {});
  }, []);

  const start = async (mode: 'screen-cam' | 'meeting') => {
    if (starting) return;
    setStarting(mode);
    
    try {
      const displaySource = sources.find(s => s.display) || sources[0];
      const devices = await window.openLoom.listMediaDevices();
      const defaultCam = devices.cameras[0]?.deviceId;
      const defaultMic = devices.mics[0]?.deviceId;

      await window.openLoom.startRecording({
        mode,
        sourceId: displaySource?.id,
        sourceIsDisplay: displaySource?.display ?? false,
        cameraId: mode === 'meeting' ? undefined : (settings.recording.cameraId || defaultCam || undefined),
        micId: settings.recording.micId || defaultMic || undefined,
        cameraOn: mode === 'screen-cam',
        micOn: true,
        systemAudio: true, // Always capture system audio
        quality: settings.recording.quality,
        fps: settings.recording.fps,
      });
      onStarted();
    } catch (err) {
      push('error', cleanIpcError(err));
      setStarting(null);
    }
  };

  return (
    <Modal title="Record" onClose={onClose} width={420}>
      <div className="flex flex-col px-6 pb-8 pt-2">
        <p className="text-text-secondary text-[14px] text-center mb-6">
          Choose the format for your next recording.
        </p>

        <div className="flex gap-4">
          <button 
            disabled={starting !== null} 
            onClick={() => void start('screen-cam')}
            className={`group relative flex flex-col items-center justify-center flex-1 aspect-square rounded-[22px] transition-all duration-300 ease-out border overflow-hidden ${starting === 'screen-cam' ? 'bg-white/10 border-white/20 scale-95' : 'bg-black/20 hover:bg-white/5 border-white/5 hover:border-white/15 hover:scale-105 active:scale-95'}`}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-accent/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <Icon.ScreenCam className="w-11 h-11 text-accent mb-4 drop-shadow-md z-10" /> 
            <span className="font-medium text-[15px] tracking-tight z-10">{starting === 'screen-cam' ? 'Starting...' : 'Screen & Cam'}</span>
          </button>
          
          <button 
            disabled={starting !== null} 
            onClick={() => void start('meeting')}
            className={`group relative flex flex-col items-center justify-center flex-1 aspect-square rounded-[22px] transition-all duration-300 ease-out border overflow-hidden ${starting === 'meeting' ? 'bg-white/10 border-white/20 scale-95' : 'bg-black/20 hover:bg-white/5 border-white/5 hover:border-white/15 hover:scale-105 active:scale-95'}`}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <Icon.Mic className="w-11 h-11 text-purple-400 mb-4 drop-shadow-md z-10" /> 
            <span className="font-medium text-[15px] tracking-tight z-10">{starting === 'meeting' ? 'Starting...' : 'Audio Only'}</span>
          </button>
        </div>
      </div>
    </Modal>
  );
}
