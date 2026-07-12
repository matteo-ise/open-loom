export class AnalyticsTracker {
  private videoId: string;
  private endpoint: string;
  private beaconsSent = new Set<number>();

  constructor(videoId: string, endpoint: string) {
    this.videoId = videoId;
    this.endpoint = endpoint;
  }

  public trackView() {
    this.send('/view', {
      id: crypto.randomUUID(),
      created_at: new Date().toISOString(),
    });
  }

  public checkBeacons(currentTime: number, duration: number) {
    if (duration <= 0) return;
    const pct = (currentTime / duration) * 100;

    const milestones = [25, 50, 75, 100];
    for (const m of milestones) {
      if (pct >= m && !this.beaconsSent.has(m)) {
        this.beaconsSent.add(m);
        this.send('/beacon', {
          id: crypto.randomUUID(),
          percentage: m,
          created_at: new Date().toISOString(),
        });
      }
    }
  }

  private send(path: string, data: any) {
    if (!this.endpoint) return;
    fetch(`${this.endpoint}/analytics/${this.videoId}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }).catch((err) => console.error('Analytics error:', err));
  }
}
