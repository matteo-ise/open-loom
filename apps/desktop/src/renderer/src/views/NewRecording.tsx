/**
 * Minimal New-recording panel: one-click to record screen+cam or meeting.
 */
import { useCallback, useEffect, useState } from 'react';
import type { CaptureSource, Settings } from '@shared/types';
import { Icon } from '../components/icons';
import { Modal, useToasts, cleanIpcError } from '../components/ui';
import { Button } from 'matteo-brand';

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
  const [starting, setStarting] = useState(false);

  useEffect(() => {
    // Explicitly request OS permissions first so the app appears in macOS Settings!
    void window.openLoom.requestPermission('camera');
    void window.openLoom.requestPermission('mic');
    
    window.openLoom.listCaptureSources().then(setSources).catch(() => {});
  }, []);

  const start = async (mode: 'screen-cam' | 'meeting') => {
    if (starting) return;
    setStarting(true);
    
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
      setStarting(false);
    }
  };

  return (
    <Modal title="New Recording" onClose={onClose} width={400}>
      <div style={{ display: 'flex', flexDirection: 'column', padding: '32px 24px', gap: '16px', textAlign: 'center' }}>
        <p style={{ margin: '0 0 8px', color: 'var(--ol-text-secondary)', fontSize: '15px' }}>
          Select what you want to record.
        </p>

        <Button 
          variant="primary" 
          disabled={starting} 
          onClick={() => void start('screen-cam')}
          style={{ padding: '16px', fontSize: '16px', justifyContent: 'center', height: 'auto', borderRadius: '14px' }}
        >
          <Icon.ScreenCam width={20} height={20} style={{ marginRight: '8px' }} /> 
          {starting ? 'Starting...' : 'Record Screen & Camera'}
        </Button>
        
        <Button 
          variant="secondary" 
          disabled={starting} 
          onClick={() => void start('meeting')}
          style={{ padding: '16px', fontSize: '16px', justifyContent: 'center', height: 'auto', borderRadius: '14px' }}
        >
          <Icon.Mic width={20} height={20} style={{ marginRight: '8px' }} /> 
          {starting ? 'Starting...' : 'Record Meeting (Audio Only)'}
        </Button>
      </div>
    </Modal>
  );
}

