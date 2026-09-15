/**
 * Library grid (SPEC L1-L3): thumbnail cards with GIF hover preview,
 * duration badge, search across titles + transcripts, folder filtering,
 * card context menu, designed empty states.
 */
import { useEffect, useMemo, useState } from 'react';
import type { Folder, VideoMeta } from '@shared/types';
import { Icon } from '../components/icons';
import {
  ContextMenu,
  Modal,
  cleanIpcError,
  formatDate,
  formatDuration,
  useToasts,
  type MenuItem,
} from '../components/ui';
import { Card, Badge, Spinner } from 'matteo-brand';
import { ShareDialog } from '../components/share/ShareDialog';

/** Live upload state for a library card badge (SPEC R14). */
interface CardUpload {
  pct: number;
  failed: boolean;
}

function VideoCard({
  video,
  upload,
  selected,
  onToggleSelect,
  onOpen,
  onMenu,
  onRenameStart,
  onRetryUpload,
}: {
  video: VideoMeta;
  upload?: CardUpload;
  selected: boolean;
  onToggleSelect: () => void;
  onOpen: () => void;
  onMenu: (x: number, y: number) => void;
  onRenameStart: () => void;
  onRetryUpload: () => void;
}) {
  const [hover, setHover] = useState(false);
  const [imgError, setImgError] = useState(false);
  
  const thumb = window.openLoom.fileUrl(video.id, 'thumb.jpg');
  const gif = window.openLoom.fileUrl(video.id, 'preview.gif');
  const uploading = upload !== undefined && !upload.failed;
  const notLive = !!video.share && !video.share.uploadedAt;
  const showRetry = (upload?.failed ?? false) || (notLive && !uploading);

  return (
    <div
      className={`tv-card ${selected ? 'selected' : ''}`}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onContextMenu={(e) => {
        e.preventDefault();
        onMenu(e.clientX, e.clientY);
      }}
      onClick={onOpen}
      onDoubleClick={(e) => { e.stopPropagation(); onRenameStart(); }}
    >
      <div className="card-select" style={{ position: 'absolute', top: 12, right: 12, zIndex: 10 }} onClick={(e) => e.stopPropagation()}>
        <input type="checkbox" checked={selected} onChange={onToggleSelect} />
      </div>

      {!imgError ? (
        <img
          src={hover ? gif : thumb}
          className="tv-card-media"
          onError={() => setImgError(true)}
          alt=""
        />
      ) : (
        <div className="brush-placeholder tv-card-media" style={{ width: '100%', height: '100%' }} />
      )}

      <div className="tv-card-overlay" />

      <div className="tv-card-top-left">
        <div className="tv-card-duration">{formatDuration(video.durationSec)}</div>
      </div>

      <div className="tv-card-content">
        <div className="tv-card-title">{video.title || 'Untitled'}</div>
        <div className="tv-card-meta">
          {uploading ? (
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div className="spinner" style={{ width: 12, height: 12 }} />
              {upload.pct}%
            </span>
          ) : showRetry ? (
            <button
              onClick={(e) => { e.stopPropagation(); onRetryUpload(); }}
              style={{ background: 'transparent', border: 'none', color: '#ff453a', display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer', padding: 0 }}
            >
              <Icon.Warning width={14} height={14} /> Failed
            </button>
          ) : notLive ? (
            <span style={{ color: '#ffd60a' }}>Pending sync</span>
          ) : video.share ? (
            <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#32d74b' }}>
              <Icon.Link width={14} height={14} /> Shared
            </span>
          ) : (
            <span>Local</span>
          )}
        </div>
      </div>
    </div>
  );
}

export function LibraryView({
  videos,
  folders,
  folderId,
  onOpen,
  onChanged,
  onRecord,
  onOpenSharingSettings,
}: {
  videos: VideoMeta[];
  folders: Folder[];
  folderId: string | null;
  onOpen: (id: string) => void;
  onChanged: () => Promise<void>;
  onRecord: () => void;
  onOpenSharingSettings: () => void;
}) {
  const { push } = useToasts();
  const [query, setQuery] = useState('');
  const [searchIds, setSearchIds] = useState<Set<string> | null>(null);
  const [menu, setMenu] = useState<{ x: number; y: number; video: VideoMeta } | null>(null);
  const [renaming, setRenaming] = useState<VideoMeta | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [confirmDelete, setConfirmDelete] = useState<VideoMeta | null>(null);
  const [folderRename, setFolderRename] = useState<Folder | null>(null);
  const [folderRenameValue, setFolderRenameValue] = useState('');
  const [sharing, setSharing] = useState<VideoMeta | null>(null);
  const [uploads, setUploads] = useState<Record<string, CardUpload>>({});
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [sortBy, setSortBy] = useState<'date' | 'duration' | 'title'>('date');
  const [bulkMove, setBulkMove] = useState<boolean>(false);
  const [bulkDelete, setBulkDelete] = useState<boolean>(false);

  const folder = folders.find((f) => f.id === folderId) ?? null;

  // Clear selection when changing folders or search
  useEffect(() => {
    setSelectedIds(new Set());
  }, [folderId, searchIds]);

  // Track background upload progress for the per-card badge (SPEC R14).
  useEffect(() => {
    return window.openLoom.onJobProgress((j) => {
      if (j.kind !== 'upload') return;
      const failed = j.note?.startsWith('Upload failed') ?? false;
      if (j.pct >= 100 && !failed) {
        setUploads((u) => {
          const { [j.videoId]: _done, ...rest } = u;
          return rest;
        });
        void onChanged();
      } else {
        setUploads((u) => ({ ...u, [j.videoId]: { pct: j.pct, failed } }));
      }
    });
  }, [onChanged]);

  const retryUpload = (video: VideoMeta) => {
    setUploads((u) => ({ ...u, [video.id]: { pct: 0, failed: false } }));
    void window.openLoom.shareVideo(video.id).catch((err) => {
      push('error', cleanIpcError(err));
      setUploads((u) => ({ ...u, [video.id]: { pct: 100, failed: true } }));
    });
  };

  // Search titles locally for instant feedback + transcripts via main.
  useEffect(() => {
    const q = query.trim();
    if (!q) {
      setSearchIds(null);
      return;
    }
    let cancelled = false;
    const t = setTimeout(() => {
      void window.openLoom
        .searchVideos(q)
        .then((matches) => {
          if (!cancelled) setSearchIds(new Set(matches.map((m) => m.id)));
        })
        .catch(() => setSearchIds(new Set()));
    }, 150);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [query]);

  const shown = useMemo(() => {
    let list = videos;
    if (folderId !== null) list = list.filter((v) => v.folderId === folderId);
    if (searchIds !== null) list = list.filter((v) => searchIds.has(v.id));
    
    // Sort
    list = [...list].sort((a, b) => {
      if (sortBy === 'duration') return b.durationSec - a.durationSec;
      if (sortBy === 'title') return a.title.localeCompare(b.title);
      // date (default) is already handled by DB order, but we re-sort to be sure
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
    return list;
  }, [videos, folderId, searchIds, sortBy]);

  const menuItems = (video: VideoMeta): MenuItem[] => [
    ...(video.share
      ? [
          {
            label: 'Copy link',
            icon: <Icon.Link width={15} height={15} />,
            onClick: () => {
              window.openLoom.copyToClipboard(video.share!.url);
              push('success', 'Link copied.');
            },
          },
        ]
      : []),
    {
      label: video.share ? 'Share settings…' : 'Share…',
      icon: <Icon.Link width={15} height={15} />,
      onClick: () => setSharing(video),
    },
    {
      label: 'Rename',
      icon: <Icon.Pencil width={15} height={15} />,
      onClick: () => {
        setRenaming(video);
        setRenameValue(video.title);
      },
    },
    {
      label: 'Move to folder',
      icon: <Icon.Folder width={15} height={15} />,
      submenu: [
        {
          label: 'Library (no folder)',
          disabled: video.folderId == null,
          onClick: () => {
            void window.openLoom
              .moveVideo(video.id, null)
              .then(onChanged)
              .catch((err) => push('error', cleanIpcError(err)));
          },
        },
        ...folders.map((f) => ({
          label: f.name,
          disabled: video.folderId === f.id,
          onClick: () => {
            void window.openLoom
              .moveVideo(video.id, f.id)
              .then(onChanged)
              .catch((err) => push('error', cleanIpcError(err)));
          },
        })),
      ],
    },
    {
      label: navigator.platform.toLowerCase().includes('mac') ? 'Reveal in Finder' : 'Show in folder',
      icon: <Icon.Reveal width={15} height={15} />,
      onClick: () => window.openLoom.revealVideo(video.id),
    },
    {
      label: 'Duplicate',
      icon: <Icon.Duplicate width={15} height={15} />,
      separatorAfter: true,
      onClick: () => {
        void window.openLoom
          .duplicateVideo(video.id)
          .then(onChanged)
          .then(() => push('success', 'Video duplicated.'))
          .catch((err) => push('error', cleanIpcError(err)));
      },
    },
    {
      label: 'Delete',
      icon: <Icon.Trash width={15} height={15} />,
      danger: true,
      onClick: () => setConfirmDelete(video),
    },
  ];


  // Group videos by date if sortBy === 'date'
  const grouped = useMemo(() => {
    if (sortBy !== 'date') return [{ label: '', videos: shown }];
    const groups = new Map<string, import('@shared/types').VideoMeta[]>();
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    for (const v of shown) {
      const d = new Date(v.createdAt);
      const recDay = new Date(d.getFullYear(), d.getMonth(), d.getDate());
      const diff = Math.round((today.getTime() - recDay.getTime()) / 86400000);
      
      let label = '';
      if (diff === 0) label = 'Today';
      else if (diff === 1) label = 'Yesterday';
      else if (diff < 7) label = 'Previous 7 Days';
      else if (diff < 30) label = 'Previous 30 Days';
      else label = d.toLocaleDateString([], { month: 'long', year: 'numeric' });
      
      if (!groups.has(label)) groups.set(label, []);
      groups.get(label)!.push(v);
    }
    return Array.from(groups.entries()).map(([label, videos]) => ({ label, videos }));
  }, [shown, sortBy]);

  // Keyboard navigation for delete
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || document.querySelector('.modal-form')) return;
      if (e.key === 'Backspace' || e.key === 'Delete') {
        if (selectedIds.size > 0) {
          e.preventDefault();
          setBulkDelete(true);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedIds]);

  return (
    <div className="library">
      <header className="view-head">
        <div className="view-head-title">
          <h2>{folder ? folder.name : 'Library'}</h2>
          {folder && (
            <div className="folder-actions">
              <button
                type="button"
                className="icon-btn"
                aria-label="Rename folder"
                title="Rename folder"
                onClick={() => {
                  setFolderRename(folder);
                  setFolderRenameValue(folder.name);
                }}
              >
                <Icon.Pencil width={15} height={15} />
              </button>
              <button
                type="button"
                className="icon-btn"
                aria-label="Delete folder"
                title="Delete folder (videos move to Library)"
                onClick={() => {
                  void window.openLoom
                    .deleteFolder(folder.id)
                    .then(onChanged)
                    .then(() => push('success', 'Folder deleted. Its videos are back in the Library.'))
                    .catch((err) => push('error', cleanIpcError(err)));
                }}
              >
                <Icon.Trash width={15} height={15} />
              </button>
            </div>
          )}
        </div>
        <div className="searchbox">
          <Icon.Search width={15} height={15} />
          <input
            type="search"
            placeholder="Search titles and transcripts"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Search videos"
          />
        </div>
        <div className="sortbox">
          <select className="shortcut-field" style={{ appearance: 'auto', padding: '4px 8px', fontSize: '13px' }} value={sortBy} onChange={(e) => setSortBy(e.target.value as any)} aria-label="Sort videos">
            <option value="date">Date</option>
            <option value="duration">Duration</option>
            <option value="title">Title</option>
          </select>
        </div>
      </header>

      {selectedIds.size > 0 && (
        <div className="bulk-actions">
          <span className="bulk-count">{selectedIds.size} selected</span>
          <button type="button" className="btn-secondary" onClick={() => setSelectedIds(new Set())}>Clear</button>
          <div className="spacer" />
          <button type="button" className="btn-secondary" onClick={() => setBulkMove(true)}>Move to...</button>
          <button type="button" className="btn-danger" onClick={() => setBulkDelete(true)}>Delete</button>
        </div>
      )}

      {shown.length === 0 ? (
        query ? (
          <div className="empty-state">
            <Icon.Search width={40} height={40} />
            <h3>No matches for “{query}”</h3>
            <p>Search covers titles now and transcripts once a video has been transcribed.</p>
          </div>
        ) : (
          <div className="empty-state">
            <svg width="72" height="72" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" aria-hidden="true">
              <rect x="2.5" y="4.5" width="19" height="13" rx="2.5" />
              <circle cx="7.5" cy="13.5" r="2.4" fill="currentColor" stroke="none" opacity="0.5" />
              <path d="M9 21h6" />
              <circle cx="14.5" cy="10" r="3.2" stroke="currentColor" />
              <circle cx="14.5" cy="10" r="1.1" fill="currentColor" stroke="none" />
            </svg>
            <h3>{folder ? 'This folder is empty' : 'Record your first video'}</h3>
            <p>
              {folder
                ? 'Move recordings here from the Library, or record something new.'
                : 'Capture your screen, camera or both. Recordings stay on this machine until you share them.'}
            </p>
            <button type="button" className="btn-primary" onClick={onRecord}>
              <Icon.Record width={15} height={15} />
              New recording
            </button>
          </div>
        )
      ) : (
        <div className="video-groups flex flex-col gap-6 p-4">
          {grouped.map(g => (
            <div key={g.label} className="video-group">
              {g.label && <h3 className="text-body font-medium text-text-secondary mb-3">{g.label}</h3>}
              <div className="video-grid">
                {g.videos.map((v) => (
                  <VideoCard
                    key={v.id}
                    video={v}
                    upload={uploads[v.id]}
                    selected={selectedIds.has(v.id)}
                    onToggleSelect={() => {
                      setSelectedIds((set) => {
                        const next = new Set(set);
                        if (next.has(v.id)) next.delete(v.id);
                        else next.add(v.id);
                        return next;
                      });
                    }}
                    onOpen={() => onOpen(v.id)}
                    onMenu={(x, y) => setMenu({ x, y, video: v })}
                    onRenameStart={() => {
                      setRenaming(v);
                      setRenameValue(v.title);
                    }}
                    onRetryUpload={() => retryUpload(v)}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {menu && <ContextMenu x={menu.x} y={menu.y} items={menuItems(menu.video)} onClose={() => setMenu(null)} />}

      {sharing && (
        <ShareDialog
          video={sharing}
          onClose={() => setSharing(null)}
          onChange={() => void onChanged()}
          onOpenSharingSettings={() => {
            setSharing(null);
            onOpenSharingSettings();
          }}
        />
      )}

      {renaming && (
        <Modal title="Rename video" onClose={() => setRenaming(null)}>
          <form
            className="modal-form"
            onSubmit={(e) => {
              e.preventDefault();
              const title = renameValue.trim();
              if (!title) return;
              void window.openLoom
                .updateVideo(renaming.id, { title })
                .then(onChanged)
                .catch((err) => push('error', cleanIpcError(err)));
              setRenaming(null);
            }}
          >
            <input autoFocus value={renameValue} onChange={(e) => setRenameValue(e.target.value)} aria-label="Video title" />
            <div className="modal-actions">
              <button type="button" className="btn-secondary" onClick={() => setRenaming(null)}>
                Cancel
              </button>
              <button type="submit" className="btn-primary" disabled={!renameValue.trim()}>
                Rename
              </button>
            </div>
          </form>
        </Modal>
      )}

      {folderRename && (
        <Modal title="Rename folder" onClose={() => setFolderRename(null)}>
          <form
            className="modal-form"
            onSubmit={(e) => {
              e.preventDefault();
              const name = folderRenameValue.trim();
              if (!name) return;
              void window.openLoom
                .renameFolder(folderRename.id, name)
                .then(onChanged)
                .catch((err) => push('error', cleanIpcError(err)));
              setFolderRename(null);
            }}
          >
            <input autoFocus value={folderRenameValue} onChange={(e) => setFolderRenameValue(e.target.value)} aria-label="Folder name" />
            <div className="modal-actions">
              <button type="button" className="btn-secondary" onClick={() => setFolderRename(null)}>
                Cancel
              </button>
              <button type="submit" className="btn-primary" disabled={!folderRenameValue.trim()}>
                Rename
              </button>
            </div>
          </form>
        </Modal>
      )}

      {confirmDelete && (
        <Modal title="Delete video" onClose={() => setConfirmDelete(null)}>
          <div className="modal-form">
            <p className="modal-text">
              “{confirmDelete.title}” will move to the {navigator.platform.toLowerCase().includes('mac') ? 'Trash' : 'recycle bin'}
              {confirmDelete.share ? ' and its shared copy will be removed' : ''}. You can restore it from there.
            </p>
            <div className="modal-actions">
              <button type="button" className="btn-secondary" onClick={() => setConfirmDelete(null)}>
                Cancel
              </button>
              <button
                type="button"
                className="btn-danger"
                onClick={() => {
                  void window.openLoom
                    .deleteVideo(confirmDelete.id)
                    .then(onChanged)
                    .then(() => push('success', 'Video deleted.'))
                    .catch((err) => push('error', cleanIpcError(err)));
                  setConfirmDelete(null);
                }}
              >
                Delete
              </button>
            </div>
          </div>
        </Modal>
      )}

      {bulkDelete && (
        <Modal title="Delete videos" onClose={() => setBulkDelete(false)}>
          <div className="modal-form">
            <p className="modal-text">
              {selectedIds.size} videos will move to the {navigator.platform.toLowerCase().includes('mac') ? 'Trash' : 'recycle bin'}.
            </p>
            <div className="modal-actions">
              <button type="button" className="btn-secondary" onClick={() => setBulkDelete(false)}>Cancel</button>
              <button
                type="button"
                className="btn-danger"
                onClick={async () => {
                  try {
                    for (const id of Array.from(selectedIds)) {
                      await window.openLoom.deleteVideo(id);
                    }
                    await onChanged();
                    push('success', `${selectedIds.size} videos deleted.`);
                    setSelectedIds(new Set());
                  } catch (err) {
                    push('error', cleanIpcError(err));
                  }
                  setBulkDelete(false);
                }}
              >
                Delete {selectedIds.size} videos
              </button>
            </div>
          </div>
        </Modal>
      )}

      {bulkMove && (
        <Modal title="Move videos" onClose={() => setBulkMove(false)}>
          <div className="modal-form">
            <p className="modal-text">Select destination for {selectedIds.size} videos:</p>
            <ul className="folder-list">
              <li>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={async () => {
                    try {
                      for (const id of Array.from(selectedIds)) {
                        await window.openLoom.moveVideo(id, null);
                      }
                      await onChanged();
                      push('success', 'Videos moved to Library.');
                      setSelectedIds(new Set());
                    } catch (err) {
                      push('error', cleanIpcError(err));
                    }
                    setBulkMove(false);
                  }}
                >
                  Library (no folder)
                </button>
              </li>
              {folders.map(f => (
                <li key={f.id}>
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={async () => {
                      try {
                        for (const id of Array.from(selectedIds)) {
                          await window.openLoom.moveVideo(id, f.id);
                        }
                        await onChanged();
                        push('success', `Videos moved to ${f.name}.`);
                        setSelectedIds(new Set());
                      } catch (err) {
                        push('error', cleanIpcError(err));
                      }
                      setBulkMove(false);
                    }}
                  >
                    {f.name}
                  </button>
                </li>
              ))}
            </ul>
            <div className="modal-actions">
              <button type="button" className="btn-secondary" onClick={() => setBulkMove(false)}>Cancel</button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
