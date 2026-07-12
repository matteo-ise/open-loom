import { useCallback, useEffect, useState } from 'react';
import type { Settings, VideoMeta } from '@shared/types';
import { Icon } from '../components/icons';

interface AnalyticsData {
  views: number;
  ctaClicks: number;
  beacons: {
    25: number;
    50: number;
    75: number;
    100: number;
  };
}

export function AnalyticsView({
  id,
  settings,
  onBack,
}: {
  id: string;
  settings: Settings;
  onBack: () => void;
}) {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalytics = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${settings.sharing.server.url}/analytics/${id}`);
      if (!res.ok) throw new Error('Failed to fetch analytics');
      const d = await res.json();
      setData(d);
      setError(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [id, settings.sharing.server.url]);

  useEffect(() => {
    void fetchAnalytics();
  }, [fetchAnalytics]);

  return (
    <div className="view-container" style={{ padding: '24px', maxWidth: '800px', margin: '0 auto' }}>
      <header className="view-head" style={{ marginBottom: '24px' }}>
        <button type="button" className="icon-btn" aria-label="Back" onClick={onBack}>
          <Icon.Back width={17} height={17} />
        </button>
        <h1 style={{ fontSize: '20px', marginLeft: '12px' }}>Analytics Dashboard</h1>
        <div style={{ flex: 1 }} />
        <button type="button" className="btn-secondary" onClick={fetchAnalytics}>
          <Icon.Refresh width={15} height={15} />
          Refresh
        </button>
      </header>

      {loading && <p>Loading analytics...</p>}
      {error && <p style={{ color: '#ef4444' }}>{error}</p>}

      {!loading && !error && data && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
          <div style={{ background: 'var(--surface-color, #fff)', padding: '20px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <h3 style={{ margin: 0, fontSize: '14px', color: 'var(--text-muted)' }}>Total Views</h3>
            <p style={{ fontSize: '32px', fontWeight: 'bold', margin: '8px 0 0' }}>{data.views}</p>
          </div>
          <div style={{ background: 'var(--surface-color, #fff)', padding: '20px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <h3 style={{ margin: 0, fontSize: '14px', color: 'var(--text-muted)' }}>CTA Clicks</h3>
            <p style={{ fontSize: '32px', fontWeight: 'bold', margin: '8px 0 0' }}>{data.ctaClicks}</p>
          </div>
          <div style={{ background: 'var(--surface-color, #fff)', padding: '20px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <h3 style={{ margin: 0, fontSize: '14px', color: 'var(--text-muted)' }}>Completion Milestones</h3>
            <ul style={{ listStyle: 'none', padding: 0, margin: '8px 0 0', display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <li>25%: {data.beacons['25']} views</li>
              <li>50%: {data.beacons['50']} views</li>
              <li>75%: {data.beacons['75']} views</li>
              <li>100%: {data.beacons['100']} views</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
