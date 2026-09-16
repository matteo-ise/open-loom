import re
with open('apps/desktop/src/renderer/src/views/Watch.tsx', 'r') as f:
    content = f.read()

old_sidebar_code = """        <aside className="watch-side">
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
                  <dd>{meta.folderId || 'Library'}</dd>
                </div>
                <div>
                  <dt>Sharing</dt>
                  <dd>
                    {meta.share
                      ? meta.share.uploadedAt
                        ? 'Link copied'
                        : 'Uploading...'
                      : 'Local only'}
                  </dd>
                </div>
              </dl>

              <button type="button" className="action-btn" onClick={handleCustomThumbnail}>
                <Icon.Edit width={16} height={16} />
                Upload Custom Thumbnail
              </button>
              
              <button type="button" className="action-btn danger" onClick={onDelete}>
                <Icon.Delete width={16} height={16} />
                Delete video
              </button>
            </div>
          )}"""

new_sidebar_code = """        <aside className="w-[320px] flex-none flex flex-col border-l border-separator bg-surface overflow-hidden">
          <div className="p-3 border-b border-separator">
            <div className="flex bg-[rgba(255,255,255,0.06)] rounded-lg p-0.5" role="tablist">
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
                  className={`flex-1 px-2 py-1 text-[13px] font-medium rounded-md transition-all ${
                    tab === t 
                      ? 'bg-[rgba(255,255,255,0.12)] text-text-primary shadow-sm' 
                      : 'text-text-secondary hover:text-text-primary'
                  }`}
                  onClick={() => setTab(t)}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {tab === 'details' && (
            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-6 text-[13px]">
              <div className="flex flex-col gap-2">
                <label className="text-text-secondary font-medium" htmlFor="watch-desc">
                  Description
                </label>
                <textarea
                  id="watch-desc"
                  placeholder="Add a description"
                  value={descDraft ?? meta.description ?? ''}
                  onChange={(e) => setDescDraft(e.target.value)}
                  onBlur={() => void saveDescription()}
                  rows={3}
                  className="w-full bg-[rgba(255,255,255,0.03)] border border-separator rounded-md p-2.5 text-text-primary placeholder:text-text-muted focus:border-[rgba(255,255,255,0.2)] focus:outline-none resize-none transition-colors"
                />
              </div>

              <dl className="flex flex-col gap-2.5">
                <div className="flex justify-between items-center">
                  <dt className="text-text-secondary">Created</dt>
                  <dd className="text-text-primary font-medium">{formatDate(meta.createdAt)}</dd>
                </div>
                <div className="flex justify-between items-center">
                  <dt className="text-text-secondary">Duration</dt>
                  <dd className="text-text-primary font-medium">{formatDuration(meta.durationSec)}</dd>
                </div>
                <div className="flex justify-between items-center">
                  <dt className="text-text-secondary">Resolution</dt>
                  <dd className="text-text-primary font-medium">
                    {meta.width}×{meta.height} · {Math.round(meta.fps)} fps
                  </dd>
                </div>
                <div className="flex justify-between items-center">
                  <dt className="text-text-secondary">Size</dt>
                  <dd className="text-text-primary font-medium">{formatBytes(meta.sizeBytes)}</dd>
                </div>
                <div className="flex justify-between items-center">
                  <dt className="text-text-secondary">Mode</dt>
                  <dd className="text-text-primary font-medium">
                    {meta.mode === 'screen-cam' ? 'Screen + Camera' : meta.mode === 'screen' ? 'Screen' : 'Camera'}
                  </dd>
                </div>
                <div className="flex justify-between items-center">
                  <dt className="text-text-secondary">Folder</dt>
                  <dd className="text-text-primary font-medium">{meta.folderId || 'Library'}</dd>
                </div>
                <div className="flex justify-between items-center">
                  <dt className="text-text-secondary">Sharing</dt>
                  <dd className="text-text-primary font-medium">
                    {meta.share
                      ? meta.share.uploadedAt
                        ? 'Link copied'
                        : 'Uploading...'
                      : 'Local only'}
                  </dd>
                </div>
              </dl>

              <div className="flex flex-col gap-2 mt-2">
                <button 
                  type="button" 
                  className="flex items-center justify-center gap-2 w-full py-2 bg-[rgba(255,255,255,0.06)] hover:bg-[rgba(255,255,255,0.1)] text-text-primary rounded-md transition-colors"
                  onClick={handleCustomThumbnail}
                >
                  <Icon.Edit width={15} height={15} />
                  Upload Custom Thumbnail
                </button>
                
                <button 
                  type="button" 
                  className="flex items-center justify-center gap-2 w-full py-2 bg-[rgba(255,70,70,0.1)] hover:bg-[rgba(255,70,70,0.2)] text-[#ff736a] rounded-md transition-colors" 
                  onClick={onDelete}
                >
                  <Icon.Delete width={15} height={15} />
                  Delete video
                </button>
              </div>
            </div>
          )}"""

content = content.replace(old_sidebar_code, new_sidebar_code)
with open('apps/desktop/src/renderer/src/views/Watch.tsx', 'w') as f:
    f.write(content)
print("Replaced sidebar in Watch.tsx")
