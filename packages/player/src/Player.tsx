import React, { useRef, useEffect, useState } from 'react';
import { AnalyticsTracker } from './Analytics';

export interface PlayerProps {
  videoId: string;
  src: string;
  poster?: string;
  analyticsEndpoint?: string;
  cta?: {
    label: string;
    url: string;
    color?: string;
  };
  chapters?: { t: number; title: string }[];
}

export function Player({ videoId, src, poster, analyticsEndpoint, cta, chapters }: PlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [tracker, setTracker] = useState<AnalyticsTracker | null>(null);

  useEffect(() => {
    if (analyticsEndpoint) {
      const t = new AnalyticsTracker(videoId, analyticsEndpoint);
      t.trackView();
      setTracker(t);
    }
  }, [videoId, analyticsEndpoint]);

  const handleTimeUpdate = () => {
    if (videoRef.current && tracker) {
      tracker.checkBeacons(videoRef.current.currentTime, videoRef.current.duration);
    }
  };

  const handleCtaClick = () => {
    if (analyticsEndpoint) {
      fetch(`${analyticsEndpoint}/cta/${videoId}/click`, { method: 'POST' }).catch(() => {});
    }
    window.open(cta!.url, '_blank');
  };

  return (
    <div style={{ position: 'relative', width: '100%', maxWidth: '800px', margin: '0 auto', background: '#000', borderRadius: '8px', overflow: 'hidden' }}>
      <video
        ref={videoRef}
        src={src}
        poster={poster}
        controls
        style={{ width: '100%', display: 'block' }}
        onTimeUpdate={handleTimeUpdate}
      />
      {cta && (
        <div style={{ position: 'absolute', top: '16px', right: '16px', zIndex: 10 }}>
          <button
            onClick={handleCtaClick}
            style={{
              padding: '8px 16px',
              background: cta.color || '#3b82f6',
              color: '#fff',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontWeight: 'bold',
              boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
            }}
          >
            {cta.label}
          </button>
        </div>
      )}
    </div>
  );
}
