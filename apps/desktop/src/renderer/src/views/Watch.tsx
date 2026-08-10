/**
 * Watch view (SPEC L4-L7): custom player (click-to-pause, hover-timestamp
 * scrubber with buffered ranges, speed menu, volume, captions, fullscreen,
 * keyboard shortcuts) plus Details / Transcript / Chapters / Activity tabs
 * rendering real data when present and designed empty states when absent.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Folder, Settings, VideoMeta, PermissionsSnapshot } from '@shared/types';
import { Icon } from '../components/icons';
import { cleanIpcError, formatBytes, formatDate, formatDuration, useToasts } from '../components/ui';
import { ShareDialog } from '../components/share/ShareDialog';
import { ActivityPanel } from '../components/share/ActivityPanel';
import { VideoPlayer, TranscriptView, Button } from 'matteo-brand';

/** Render transcript text with the search query highlighted. */
function HighlightedText({ text, query }: { text: string; query: string }) {
  const q = query.trim();
  if (!q) return <>{text}</>;
  const lower = text.toLowerCase();
  const needle = q.toLowerCase();
  const parts: React.ReactNode[] = [];
  let pos = 0;
  let idx: number;
  while ((idx = lower.indexOf(needle, pos)) >= 0) {
    if (idx > pos) parts.push(text.slice(pos, idx));
    parts.push(<mark key={idx}>{text.slice(idx, idx + q.length)}</mark>);
    pos = idx + q.length;
  }
  if (pos < text.length) parts.push(text.slice(pos));
  return <>{parts}</>;
}

const SPEEDS = [0.8, 1, 1.2, 1.5, 1.7, 2, 2.5];

interface VttCue {
  start: number;
  end: number;
  text: string;
}

function parseVttTime(t: string): number {
  const parts = t.trim().split(':');
  let sec = 0;
  for (const p of parts) sec = sec * 60 + parseFloat(p.replace(',', '.'));
  return sec;
}

function parseVtt(raw: string): VttCue[] {
  const cues: VttCue[] = [];
  const blocks = raw.replace(/\r/g, '').split('\n\n');
  for (const block of blocks) {
    const lines = block.split('\n').filter(Boolean);
    const timeLineIdx = lines.findIndex((l) => l.includes('-->'));
    if (timeLineIdx < 0) continue;
    const [startRaw, endRaw] = lines[timeLineIdx]!.split('-->');
    if (!startRaw || !endRaw) continue;
    const text = lines
      .slice(timeLineIdx + 1)
      .join(' ')
      .replace(/<[^>]+>/g, '')
      .trim();
    if (!text) continue;
    cues.push({ start: parseVttTime(startRaw), end: parseVttTime(endRaw.split(' ')[0] ?? endRaw), text });
  }
  return cues;
}

type Tab = 'details' | 'meeting' | 'transcript' | 'chapters' | 'activity';

export function WatchView({
  id,
  folders,
  settings,
  onBack,
  onEdit,
  onAnalytics,
  onChanged,
  onDeleted,
  onOpenSharingSettings,
}: {
  id: string;
  folders: Folder[];
  settings: Settings;
  onBack: () => void;
  onEdit: () => void;
  onAnalytics: () => void;
  onChanged: () => Promise<void>;
  onDeleted: () => void;
  onOpenSharingSettings: () => void;
}) {
  const { push } = useToasts();
  const [meta, setMeta] = useState<VideoMeta | null>(null);
  const [tab, setTab] = useState<Tab>('details');
  const videoRef = useRef<HTMLVideoElement>(null);
  const playerRef = useRef<HTMLDivElement>(null);
  const [playing, setPlaying] = useState(false);
  const [current, setCurrent] = useState(0);
  const [duration, setDuration] = useState(0);
  const [buffered, setBuffered] = useState<{ start: number; end: number }[]>([]);
  const [speed, setSpeed] = useState(1);
  const [volume, setVolume] = useState(1);
  const [muted, setMuted] = useState(false);
  const [speedOpen, setSpeedOpen] = useState(false);
  const [captionsOn, setCaptionsOn] = useState(false);
  const [cues, setCues] = useState<VttCue[] | null>(null);
  const [hoverT, setHoverT] = useState<{ x: number; t: number } | null>(null);
  const [videoError, setVideoError] = useState<string | null>(null);
  const [titleDraft, setTitleDraft] = useState<string | null>(null);
  const [descDraft, setDescDraft] = useState<string | null>(null);
  const [shareOpen, setShareOpen] = useState(false);
  const [transcriptQuery, setTranscriptQuery] = useState('');
  const [refresh, setRefresh] = useState(0);
  const [runningJob, setRunningJob] = useState<{ kind: string; pct: number; note?: string } | null>(null);
  const [chapterDraft, setChapterDraft] = useState<{ index: number; title: string } | null>(null);
  const [taskDraft, setTaskDraft] = useState<{ index: number; text: string } | null>(null);
  const [summaryDraft, setSummaryDraft] = useState<string | null>(null);
  const [youtubeOpen, setYoutubeOpen] = useState(false);
  const [youtubeDraft, setYoutubeDraft] = useState('');
  const [youtubeError, setYoutubeError] = useState<string | null>(null);
  const [installingWhisper, setInstallingWhisper] = useState(false);
  const [progress, setProgress] = useState<number | null>(null);
  const [statusText, setStatusText] = useState('');
  const [perms, setPerms] = useState<PermissionsSnapshot | null>(null);

  const videoUrl = `${window.openLoom.fileUrl(id, 'video.mp4')}?v=${refresh}`;
  const vttUrl = `${window.openLoom.fileUrl(id, 'transcript.vtt')}?v=${refresh}`;

  const transcriptionConfigured = settings.transcription.engine !== 'off';
  const aiConfigured = settings.ai.provider !== 'off';

  useEffect(() => {
    void window.openLoom
      .getVideo(id)
      .then(setMeta)
      .catch((err) => push('error', cleanIpcError(err)));
  }, [id, push, refresh]);

  useEffect(() => {
    window.openLoom.getPermissions().then(setPerms);
  }, []);

  useEffect(() => {
    if (!installingWhisper) return;
    return window.openLoom.onSetupLog((line) => {
      const pctMatch = /(\d+)%/.exec(line);
      if (pctMatch && pctMatch[1]) {
        setProgress(Number(pctMatch[1]));
      }
      setStatusText(line);
    });
  }, [installingWhisper]);

  // Live progress for transcription / AI / edit jobs on this video; reload
  // meta + captions when one lands.
  useEffect(() => {
    return window.openLoom.onJobProgress((j) => {
      if (j.videoId !== id) return;
      // Share uploads surface here too (this is where the user lands after
      // stop + auto-share), so a failed background upload is visible rather than
      // leaving a confidently-copied link that 404s. The failure toast fires
      // globally; here we reload meta so the persistent "not live" state below
      // reflects whether uploadedAt was written.
      if (j.kind === 'upload') {
        if (j.pct >= 100) {
          setRefresh((r) => r + 1);
          void onChanged();
        }
        return;
      }
      if (!['transcribe', 'ai', 'trim', 'stitch', 'revert'].includes(j.kind)) return;
      if (j.pct >= 100) {
        setRunningJob(null);
        setRefresh((r) => r + 1);
        void onChanged();
      } else {
        setRunningJob({ kind: j.kind, pct: j.pct, note: j.note });
      }
    });
  }, [id, onChanged]);

  /** Merge a patch into meta.ai and persist. */
  const saveAi = useCallback(
    async (patch: Partial<NonNullable<VideoMeta['ai']>>) => {
      if (!meta) return;
      try {
        setMeta(await window.openLoom.updateVideo(id, { ai: { ...meta.ai, ...patch } }));
      } catch (err) {
        push('error', cleanIpcError(err));
      }
    },
    [id, meta, push]
  );

  const installWhisperInline = async () => {
    setInstallingWhisper(true);
    setProgress(0);
    setStatusText('Downloading Transcription Engine (whisper.cpp)...');
    try {
      await window.openLoom.installWhisper();
      const current = await window.openLoom.getSettings();
      await window.openLoom.setSettings({ transcription: { ...current.transcription, engine: 'whisper' } });
      setProgress(100);
      setStatusText('Whisper ready!');
      push('success', 'Transcription engine installed and enabled!');
      setPerms(await window.openLoom.getPermissions());
    } catch (err) {
      push('error', `Whisper installation failed: ${cleanIpcError(err)}`);
      setProgress(null);
      setStatusText('');
    } finally {
      setInstallingWhisper(false);
    }
  };

  const transcribeNow = () => {
    push('info', 'Transcribing in the background. The transcript appears here when it is ready.');
    void window.openLoom.transcribeVideo(id).catch((err) => push('error', cleanIpcError(err)));
  };

  const generateNow = (kinds: string[]) => {
    push('info', 'Generating with AI.');
    void window.openLoom.generateAI(id, kinds).then(
      () => setRefresh((r) => r + 1),
      (err) => push('error', cleanIpcError(err))
    );
  };

  // Guided "Publish to YouTube (unlisted)": main reveals the MP4 in Finder and
  // opens youtube.com/upload; the AI title (if any) is copied for pasting.
  const startYouTubePublish = () => {
    setTab('details');
    setYoutubeOpen(true);
    setYoutubeError(null);
    void window.openLoom.youtubePublishStart(id).then(
      (res) => {
        if (res.titleCopied) {
          push('info', 'Your AI title is on the clipboard, ready to paste into the YouTube title field.');
        }
      },
      (err) => push('error', cleanIpcError(err))
    );
  };

  const saveYouTubeLink = () => {
    setYoutubeError(null);
    void window.openLoom.youtubeSaveLink(id, youtubeDraft).then(
      (m) => {
        setMeta(m);
        setYoutubeDraft('');
        if (m.youtubeUrl) {
          window.openLoom.copyToClipboard(m.youtubeUrl);
          push('success', 'YouTube link saved and copied.');
        }
        void onChanged();
      },
      (err) => setYoutubeError(cleanIpcError(err))
    );
  };

  // Load captions when present (transcription module writes transcript.vtt).
  useEffect(() => {
    let cancelled = false;
    void fetch(vttUrl)
      .then(async (res) => {
        if (!res.ok) throw new Error('no captions');
        const text = await res.text();
        if (!cancelled) setCues(parseVtt(text));
      })
      .catch(() => {
        if (!cancelled) setCues(null);
      });
    return () => {
      cancelled = true;
    };
  }, [vttUrl]);

  const seek = useCallback((t: number) => {
    const v = document.querySelector('.watch video') as HTMLVideoElement;
    if (!v || !Number.isFinite(t)) return;
    v.currentTime = Math.max(0, Math.min(t, v.duration || t));
  }, []);

  const togglePlay = useCallback(() => {
    const v = document.querySelector('.watch video') as HTMLVideoElement;
    if (!v) return;
    if (v.paused) void v.play().catch(() => undefined);
    else v.pause();
  }, []);

  // Keyboard shortcuts (SPEC L4).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) return;
      const v = document.querySelector('.watch video') as HTMLVideoElement;
      if (!v) return;
      switch (e.key) {
        case ' ':
          e.preventDefault();
          togglePlay();
          break;
        case 'ArrowLeft':
          seek(v.currentTime - 5);
          break;
        case 'ArrowRight':
          seek(v.currentTime + 5);
          break;
        case 'ArrowUp':
          e.preventDefault();
          setMuted(false);
          setVolume((x) => Math.min(1, Math.round((x + 0.1) * 10) / 10));
          break;
        case 'ArrowDown':
          e.preventDefault();
          setVolume((x) => Math.max(0, Math.round((x - 0.1) * 10) / 10));
          break;
        case 'f':
        case 'F':
          void toggleFullscreen();
          break;
        case 'c':
        case 'C':
          if (cues) setCaptionsOn((x) => !x);
          break;
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [togglePlay, seek, cues]);

  useEffect(() => {
    const v = videoRef.current;
    if (v) {
      v.playbackRate = speed;
      v.volume = volume;
      v.muted = muted;
    }
  }, [speed, volume, muted]);

  const toggleFullscreen = async () => {
    const el = playerRef.current;
    if (!el) return;
    if (document.fullscreenElement) await document.exitFullscreen();
    else await el.requestFullscreen();
  };

  const activeCue = useMemo(() => {
    if (!captionsOn || !cues) return null;
    return cues.find((c) => current >= c.start && current <= c.end) ?? null;
  }, [captionsOn, cues, current]);

  const saveTitle = async () => {
    if (titleDraft === null || !meta) return;
    const title = titleDraft.trim();
    setTitleDraft(null);
    if (!title || title === meta.title) return;
    try {
      setMeta(await window.openLoom.updateVideo(id, { title }));
      await onChanged();
    } catch (err) {
      push('error', cleanIpcError(err));
    }
  };

  const saveDescription = async () => {
    if (descDraft === null || !meta) return;
    const description = descDraft.trim();
    setDescDraft(null);
    if (description === (meta.description ?? '')) return;
    try {
      setMeta(await window.openLoom.updateVideo(id, { description }));
    } catch (err) {
      push('error', cleanIpcError(err));
    }
  };

  if (!meta) return <div className="boot" />;

  const filteredCues =
    cues?.filter((c) => !transcriptQuery.trim() || c.text.toLowerCase().includes(transcriptQuery.toLowerCase())) ?? [];
  const chapters = meta.ai?.chapters ?? [];

  return (
    <div className="watch">
      <header className="view-head watch-head">
        <button type="button" className="icon-btn" aria-label="Back to library" onClick={onBack}>
          <Icon.Back width={17} height={17} />
        </button>
        {titleDraft !== null ? (
          <input
            className="title-edit"
            autoFocus
            value={titleDraft}
            onChange={(e) => setTitleDraft(e.target.value)}
            onBlur={() => void saveTitle()}
            onKeyDown={(e) => {
              if (e.key === 'Enter') void saveTitle();
              if (e.key === 'Escape') setTitleDraft(null);
            }}
            aria-label="Video title"
          />
        ) : (
          <button type="button" className="watch-title" title="Rename" onClick={() => setTitleDraft(meta.title)}>
            {meta.title}
            <Icon.Pencil width={13} height={13} />
          </button>
        )}
        <div className="watch-head-actions">
          <button type="button" className="btn-secondary" onClick={onEdit} title="Trim, cut and stitch">
            <Icon.Scissors width={15} height={15} />
            Edit
          </button>
          <button
            type="button"
            className="btn-secondary"
            onClick={() => window.openLoom.revealVideo(id)}
            title="Show the MP4 file"
          >
            <Icon.Reveal width={15} height={15} />
            {navigator.platform.toLowerCase().includes('mac') ? 'Reveal in Finder' : 'Show in folder'}
          </button>
          {meta.share?.uploadedAt && (
            <button
              type="button"
              className="btn-secondary"
              onClick={onAnalytics}
              title="View Analytics"
            >
              <Icon.Sparkle width={15} height={15} />
              Analytics
            </button>
          )}
          <button
            type="button"
            className="btn-secondary"
            onClick={startYouTubePublish}
            title="Publish this recording to YouTube as unlisted"
          >
            <Icon.Play width={15} height={15} />
            Publish to YouTube
          </button>
          <button type="button" className="btn-primary" onClick={() => setShareOpen(true)}>
            <Icon.Link width={15} height={15} />
            {meta.share ? 'Share settings' : 'Share'}
          </button>
        </div>
      </header>

      <div className="watch-body">
        <div className="watch-player-col">
          <div className="player w-full h-[60vh] md:h-auto" ref={playerRef}>
            {videoError ? (
              <div className="player-error">
                <Icon.Warning width={28} height={28} />
                <p>{videoError}</p>
              </div>
            ) : (
              <VideoPlayer
                src={videoUrl}
                onTimeUpdate={setCurrent}
                captions={cues ? vttUrl : undefined}
                captionsEnabled={true}
                className="w-full h-full"
              />
            )}
          </div>
        </div>

        <aside className="watch-side">
          <div className="tabs" role="tablist">
            {(
              [
                ['details', 'Details'],
                ...(meta.mode === 'meeting' ? [['meeting', 'Meeting'] as [Tab, string]] : []),
                ['transcript', 'Transcript'],
                ['chapters', 'Chapters'],
                ['activity', 'Activity'],
              ] as [Tab, string][]
            ).map(([t, label]) => (
              <button
                key={t}
                type="button"
                role="tab"
                aria-selected={tab === t}
                className={`tab${tab === t ? ' selected' : ''}`}
                onClick={() => setTab(t)}
              >
                {label}
              </button>
            ))}
          </div>

          {tab === 'details' && (
            <div className="side-panel">
              <label className="field-label" htmlFor="watch-desc">
                Description
              </label>
              <textarea
                id="watch-desc"
                placeholder="Add a description"
                value={descDraft ?? meta.description ?? ''}
                onChange={(e) => setDescDraft(e.target.value)}
                onBlur={() => void saveDescription()}
                rows={3}
              />
              <dl className="meta-list">
                <div>
                  <dt>Created</dt>
                  <dd>{formatDate(meta.createdAt)}</dd>
                </div>
                <div>
                  <dt>Duration</dt>
                  <dd>{formatDuration(meta.durationSec)}</dd>
                </div>
                <div>
                  <dt>Resolution</dt>
                  <dd>
                    {meta.width}×{meta.height} · {Math.round(meta.fps)} fps
                  </dd>
                </div>
                <div>
                  <dt>Size</dt>
                  <dd>{formatBytes(meta.sizeBytes)}</dd>
                </div>
                <div>
                  <dt>Mode</dt>
                  <dd>
                    {meta.mode === 'screen-cam' ? 'Screen + Camera' : meta.mode === 'screen' ? 'Screen' : 'Camera'}
                  </dd>
                </div>
                <div>
                  <dt>Folder</dt>
                  <dd>{folders.find((f) => f.id === meta.folderId)?.name ?? 'Library'}</dd>
                </div>
                <div>
                  <dt>Sharing</dt>
                  <dd>
                    {meta.share
                      ? meta.share.uploadedAt
                        ? `Shared via ${meta.share.provider}`
                        : `Shared via ${meta.share.provider} - upload not finished`
                      : 'Local only'}
                  </dd>
                </div>
              </dl>

              <div style={{ marginTop: '16px', display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={async () => {
                    const p = await window.openLoom.pickFile('image/*');
                    if (p) {
                      try {
                        await window.openLoom.setCustomThumbnail(id, { path: p });
                        push('success', 'Custom thumbnail updated.');
                        setRefresh((r) => r + 1);
                        void onChanged();
                      } catch (err) {
                        push('error', cleanIpcError(err));
                      }
                    }
                  }}
                >
                  <Icon.Pencil width={15} height={15} />
                  Upload Custom Thumbnail
                </button>
              </div>

              {meta.share && !meta.share.uploadedAt && (
                <p className="side-note" role="status">
                  The upload did not finish, so this link is not live yet. Retry to make it work.
                </p>
              )}
              {meta.share &&
                (meta.share.uploadedAt ? (
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => {
                      window.openLoom.copyToClipboard(meta.share!.url);
                      push('success', 'Link copied.');
                    }}
                  >
                    <Icon.Link width={15} height={15} />
                    Copy share link
                  </button>
                ) : (
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => {
                      push('info', 'Retrying the upload in the background.');
                      void window.openLoom
                        .shareVideo(id)
                        .then(() => onChanged())
                        .catch((err) => push('error', cleanIpcError(err)));
                    }}
                  >
                    <Icon.Refresh width={15} height={15} />
                    Retry upload
                  </button>
                ))}

              {(youtubeOpen || meta.youtubeUrl) && (
                <div className="ai-block youtube-block">
                  <div className="ai-block-head">
                    <Icon.Play width={15} height={15} />
                    <h4>Publish to YouTube</h4>
                  </div>

                  {meta.youtubeUrl ? (
                    <>
                      <p className="side-note">This recording is published on YouTube as unlisted.</p>
                      <a
                        className="youtube-link"
                        href={meta.youtubeUrl}
                        onClick={(e) => {
                          e.preventDefault();
                          window.openLoom.openExternal(meta.youtubeUrl!);
                        }}
                      >
                        {meta.youtubeUrl}
                      </a>
                      <button
                        type="button"
                        className="btn-secondary"
                        onClick={() => {
                          window.openLoom.copyToClipboard(meta.youtubeUrl!);
                          push('success', 'Link copied.');
                        }}
                      >
                        <Icon.Link width={15} height={15} />
                        Copy YouTube link
                      </button>
                    </>
                  ) : (
                    <>
                      <ol className="youtube-steps" style={{ marginBottom: '16px', lineHeight: 1.5, color: 'var(--ol-text-secondary)' }}>
                        <li>We just opened YouTube Upload and highlighted your video in Finder.</li>
                        <li>Drag the video file into the browser.</li>
                        <li>Set visibility to <b>Unlisted</b> and paste the resulting link below!</li>
                      </ol>
                      <label className="field-label" htmlFor="youtube-url" style={{ marginBottom: '6px', display: 'block' }}>
                        YouTube link
                      </label>
                      <input
                        id="youtube-url"
                        className="shortcut-field"
                        style={{ width: '100%', marginBottom: '12px' }}
                        type="url"
                        placeholder="https://www.youtube.com/watch?v=..."
                        value={youtubeDraft}
                        onChange={(e) => {
                          setYoutubeDraft(e.target.value);
                          if (youtubeError) setYoutubeError(null);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') saveYouTubeLink();
                        }}
                      />
                      {youtubeError && (
                        <p className="youtube-error" role="alert">
                          {youtubeError}
                        </p>
                      )}
                      <button
                        type="button"
                        className="btn-secondary"
                        onClick={saveYouTubeLink}
                        disabled={!youtubeDraft.trim()}
                      >
                        Save link
                      </button>
                    </>
                  )}
                </div>
              )}

              {(aiConfigured || meta.ai?.summary || meta.ai?.tasks || meta.ai?.title) && (
                <div className="ai-block">
                  <div className="ai-block-head">
                    <Icon.Sparkle width={15} height={15} />
                    <h4>AI</h4>
                    {aiConfigured && (
                      <button
                        type="button"
                        className="btn-secondary btn-small"
                        disabled={!meta.transcript || runningJob?.kind === 'ai'}
                        title={meta.transcript ? 'Generate from the transcript' : 'Transcribe this video first'}
                        onClick={() =>
                          generateNow(
                            (Object.entries(settings.ai.features) as [string, boolean][])
                              .filter(([, on]) => on)
                              .map(([k]) => k)
                          )
                        }
                      >
                        {meta.ai?.summary || meta.ai?.title ? 'Regenerate' : 'Generate'}
                      </button>
                    )}
                  </div>

                  {meta.ai?.title && meta.ai.title !== meta.title && (
                    <div className="ai-title-suggest">
                      <span className="ai-title-text">{meta.ai.title}</span>
                      <button
                        type="button"
                        className="btn-secondary btn-small"
                        onClick={() =>
                          void window.openLoom.updateVideo(id, { title: meta.ai!.title! }).then(
                            (m) => {
                              setMeta(m);
                              void onChanged();
                            },
                            (err) => push('error', cleanIpcError(err))
                          )
                        }
                      >
                        Use as title
                      </button>
                    </div>
                  )}

                  <label className="field-label" htmlFor="ai-summary">
                    Summary
                  </label>
                  <textarea
                    id="ai-summary"
                    placeholder={
                      meta.transcript
                        ? 'No summary yet. Generate one or write your own.'
                        : 'Transcribe this video, then generate a summary.'
                    }
                    value={summaryDraft ?? meta.ai?.summary ?? ''}
                    onChange={(e) => setSummaryDraft(e.target.value)}
                    onBlur={() => {
                      if (summaryDraft !== null && summaryDraft !== (meta.ai?.summary ?? '')) {
                        void saveAi({ summary: summaryDraft });
                      }
                      setSummaryDraft(null);
                    }}
                    rows={3}
                  />

                  <span className="field-label">Action items</span>
                  {(meta.ai?.tasks ?? []).length === 0 ? (
                    <p className="side-note">No action items yet.</p>
                  ) : (
                    <ul className="task-list">
                      {(meta.ai?.tasks ?? []).map((t, i) => (
                        <li key={i} className="task-item">
                          {taskDraft?.index === i ? (
                            <input
                              autoFocus
                              value={taskDraft.text}
                              aria-label="Edit action item"
                              onChange={(e) => setTaskDraft({ index: i, text: e.target.value })}
                              onBlur={() => {
                                const tasks = [...(meta.ai?.tasks ?? [])];
                                if (taskDraft.text.trim()) tasks[i] = taskDraft.text.trim();
                                setTaskDraft(null);
                                void saveAi({ tasks });
                              }}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
                                if (e.key === 'Escape') setTaskDraft(null);
                              }}
                            />
                          ) : (
                            <button
                              type="button"
                              className="task-text"
                              title="Edit"
                              onClick={() => setTaskDraft({ index: i, text: t })}
                            >
                              {t}
                            </button>
                          )}
                          <button
                            type="button"
                            className="icon-btn"
                            aria-label="Remove action item"
                            onClick={() =>
                              void saveAi({ tasks: (meta.ai?.tasks ?? []).filter((_, j) => j !== i) })
                            }
                          >
                            <Icon.Close width={12} height={12} />
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}

              <button
                type="button"
                className="btn-danger-quiet"
                onClick={() =>
                  void window.openLoom.deleteVideo(id).then(onDeleted, (err) => push('error', cleanIpcError(err)))
                }
              >
                <Icon.Trash width={15} height={15} />
                Delete video
              </button>
            </div>
          )}

          {tab === 'meeting' && (
            <div className="side-panel">
              {meta.meeting ? (
                <div className="meeting-summary">
                  <div className="btn-row" style={{ marginBottom: '16px' }}>
                    <button className="btn-secondary btn-small" onClick={() => void window.openLoom.exportMeeting(id, 'pdf').catch(err => push('error', cleanIpcError(err)))}>Export PDF</button>
                    <button className="btn-secondary btn-small" onClick={() => void window.openLoom.exportMeeting(id, 'docx').catch(err => push('error', cleanIpcError(err)))}>Export Word</button>
                    <button className="btn-secondary btn-small" onClick={() => void window.openLoom.exportMeeting(id, 'txt').catch(err => push('error', cleanIpcError(err)))}>Export TXT</button>
                  </div>
                  <h3>Summary</h3>
                  <p>{meta.meeting.summary}</p>
                  
                  <h3>Key Outcomes</h3>
                  <ul className="task-list">
                    {meta.meeting.keyOutcomes.map((o, i) => <li key={i} className="task-item">{o}</li>)}
                  </ul>

                  <h3>Next Steps</h3>
                  <ul className="task-list">
                    {meta.meeting.nextSteps.map((s, i) => <li key={i} className="task-item">{s}</li>)}
                  </ul>

                  <h3>Diarized Transcript</h3>
                  <div style={{ marginTop: '8px', opacity: 0.8, fontSize: '0.9em', whiteSpace: 'pre-wrap' }}>
                    {meta.meeting.transcriptDiarized}
                  </div>
                </div>
              ) : runningJob?.kind === 'meeting-summary' ? (
                <div className="side-progress" role="status">
                  <span className="spinner" aria-hidden="true" />
                  <span>{runningJob.note ?? 'Generating meeting summary...'}</span>
                  <div className="job-bar">
                    <div className="job-bar-fill" style={{ width: `${runningJob.pct}%` }} />
                  </div>
                </div>
              ) : (
                <div className="side-empty-state">
                  <Icon.Sparkle width={30} height={30} />
                  <h4>No meeting summary yet</h4>
                  <p>Wait for the AI to summarize this meeting after transcription completes.</p>
                </div>
              )}
            </div>
          )}

          {tab === 'transcript' && (
            <div className="side-panel">
              {runningJob?.kind === 'transcribe' && (
                <div className="side-progress" role="status">
                  <span className="spinner" aria-hidden="true" />
                  <span>{runningJob.note ?? 'Transcribing'}</span>
                  <div className="job-bar">
                    <div className="job-bar-fill" style={{ width: `${runningJob.pct}%` }} />
                  </div>
                </div>
              )}
              {cues && cues.length > 0 ? (
                <>
                  <div className="searchbox small">
                    <Icon.Search width={14} height={14} />
                    <input
                      type="search"
                      placeholder="Search transcript"
                      value={transcriptQuery}
                      onChange={(e) => setTranscriptQuery(e.target.value)}
                      aria-label="Search transcript"
                    />
                  </div>
                  <TranscriptView
                    segments={filteredCues.map((c) => ({
                      speaker: 'Speaker',
                      startTime: c.start,
                      endTime: c.end,
                      text: c.text,
                    }))}
                    currentTime={current}
                    searchQuery={transcriptQuery}
                    onSeek={seek}
                    className="flex-1 mt-2"
                  />
                  {transcriptionConfigured && (
                    <button
                      type="button"
                      className="btn-secondary"
                      disabled={runningJob?.kind === 'transcribe'}
                      onClick={transcribeNow}
                    >
                      <Icon.Refresh width={14} height={14} />
                      Re-run transcription
                    </button>
                  )}
                </>
              ) : runningJob?.kind === 'transcribe' ? null : (
                <div className="side-empty-state">
                  <Icon.Captions width={30} height={30} />
                  <h4>No transcript yet</h4>
                  {!transcriptionConfigured || perms?.whisper === false ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', alignItems: 'center', width: '100%' }}>
                      <p style={{ color: 'var(--ol-text-secondary)', fontSize: '13px' }}>
                        Local transcription engine (whisper.cpp) is not installed or configured.
                      </p>
                      <Button
                        variant="primary"
                        disabled={installingWhisper}
                        onClick={installWhisperInline}
                        style={{ width: '100%', justifyContent: 'center' }}
                      >
                        {installingWhisper ? 'Installing...' : 'Install Whisper Engine'}
                      </Button>
                      {installingWhisper && (
                        <div style={{ width: '100%', marginTop: '8px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--ol-text-secondary)', marginBottom: '4px' }}>
                            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '80%' }}>{statusText}</span>
                            {progress !== null && <span>{progress}%</span>}
                          </div>
                          <div style={{ width: '100%', height: '4px', background: 'rgba(255,255,255,0.08)', borderRadius: '2px', overflow: 'hidden' }}>
                            <div style={{ width: `${progress ?? 0}%`, height: '100%', background: 'var(--ol-accent)', transition: 'width 0.2s ease-out' }} />
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <>
                      <p>Transcribe this video to get clickable, searchable lines and captions in the player.</p>
                      <button type="button" className="btn-primary" onClick={transcribeNow}>
                        Transcribe now
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          )}

          {tab === 'chapters' && (
            <div className="side-panel">
              {runningJob?.kind === 'ai' && (
                <div className="side-progress" role="status">
                  <span className="spinner" aria-hidden="true" />
                  <span>{runningJob.note ?? 'Generating chapters'}</span>
                </div>
              )}
              {chapters.length > 0 ? (
                <>
                  <div className="cue-list">
                    {chapters.map((c, i) => (
                      <div key={`${c.t}-${i}`} className="chapter-row">
                        {chapterDraft?.index === i ? (
                          <input
                            autoFocus
                            className="chapter-edit"
                            value={chapterDraft.title}
                            aria-label="Chapter title"
                            onChange={(e) => setChapterDraft({ index: i, title: e.target.value })}
                            onBlur={() => {
                              const next = [...chapters];
                              if (chapterDraft.title.trim()) {
                                next[i] = { ...next[i]!, title: chapterDraft.title.trim() };
                              }
                              setChapterDraft(null);
                              void saveAi({ chapters: next });
                            }}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
                              if (e.key === 'Escape') setChapterDraft(null);
                            }}
                          />
                        ) : (
                          <button type="button" className="cue" onClick={() => seek(c.t)}>
                            <span className="cue-time">{formatDuration(c.t)}</span>
                            <span className="cue-text">{c.title}</span>
                          </button>
                        )}
                        <div className="chapter-actions">
                          <button
                            type="button"
                            className="icon-btn"
                            aria-label="Rename chapter"
                            title="Rename"
                            onClick={() => setChapterDraft({ index: i, title: c.title })}
                          >
                            <Icon.Pencil width={13} height={13} />
                          </button>
                          <button
                            type="button"
                            className="icon-btn"
                            aria-label="Delete chapter"
                            title="Delete"
                            onClick={() => void saveAi({ chapters: chapters.filter((_, j) => j !== i) })}
                          >
                            <Icon.Close width={12} height={12} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="btn-row">
                    <button
                      type="button"
                      className="btn-secondary"
                      onClick={() => {
                        const t = Math.round(current * 10) / 10;
                        const next = [...chapters, { t, title: `Chapter at ${formatDuration(t)}` }].sort(
                          (a, b) => a.t - b.t
                        );
                        void saveAi({ chapters: next });
                      }}
                    >
                      <Icon.Plus width={14} height={14} />
                      Add at {formatDuration(current)}
                    </button>
                    {aiConfigured && meta.transcript && (
                      <button
                        type="button"
                        className="btn-secondary"
                        disabled={runningJob?.kind === 'ai'}
                        onClick={() => generateNow(['chapters'])}
                      >
                        <Icon.Sparkle width={14} height={14} />
                        Regenerate
                      </button>
                    )}
                  </div>
                </>
              ) : (
                <div className="side-empty-state">
                  <Icon.Sparkle width={30} height={30} />
                  <h4>No chapters yet</h4>
                  {aiConfigured && meta.transcript ? (
                    <>
                      <p>Generate chapters from the transcript, or add them by hand at the current time.</p>
                      <div className="btn-row">
                        <button
                          type="button"
                          className="btn-primary"
                          disabled={runningJob?.kind === 'ai'}
                          onClick={() => generateNow(['chapters'])}
                        >
                          Generate chapters
                        </button>
                        <button
                          type="button"
                          className="btn-secondary"
                          onClick={() => {
                            const t = Math.round(current * 10) / 10;
                            void saveAi({ chapters: [{ t, title: `Chapter at ${formatDuration(t)}` }] });
                          }}
                        >
                          Add manually
                        </button>
                      </div>
                    </>
                  ) : aiConfigured ? (
                    <>
                      <p>Chapters are generated from the transcript. Transcribe this video first.</p>
                      <button
                        type="button"
                        className="btn-secondary"
                        onClick={() => {
                          const t = Math.round(current * 10) / 10;
                          void saveAi({ chapters: [{ t, title: `Chapter at ${formatDuration(t)}` }] });
                        }}
                      >
                        Add manually instead
                      </button>
                    </>
                  ) : (
                    <>
                      <p>
                        Configure an AI provider in Settings to generate chapters from the transcript, or add them
                        by hand at the current time.
                      </p>
                      <button
                        type="button"
                        className="btn-secondary"
                        onClick={() => {
                          const t = Math.round(current * 10) / 10;
                          void saveAi({ chapters: [{ t, title: `Chapter at ${formatDuration(t)}` }] });
                        }}
                      >
                        Add a chapter at {formatDuration(current)}
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          )}

          {tab === 'activity' && (
            <div className="side-panel">
              <ActivityPanel video={meta} onSeek={seek} />
            </div>
          )}
        </aside>
      </div>

      {shareOpen && (
        <ShareDialog
          video={meta}
          onClose={() => setShareOpen(false)}
          onChange={(fresh) => {
            setMeta(fresh);
            void onChanged();
          }}
          onOpenSharingSettings={() => {
            setShareOpen(false);
            onOpenSharingSettings();
          }}
        />
      )}
    </div>
  );
}
