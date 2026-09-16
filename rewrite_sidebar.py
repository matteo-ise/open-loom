import re

with open('apps/desktop/src/renderer/src/views/Watch.tsx', 'r') as f:
    code = f.read()

# 1. Replace aside class
code = code.replace('<aside className="watch-side">', '<aside className="w-[320px] flex-none flex flex-col border-l border-separator bg-surface overflow-hidden text-[13px] font-sans">')

# 2. Replace tabs
old_tabs = """          <div className="tabs" role="tablist">
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
          </div>"""

new_tabs = """          <div className="p-3 border-b border-separator shrink-0">
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
          </div>"""

code = code.replace(old_tabs, new_tabs)

# 3. Replace side-panel classes
code = code.replace('<div className="side-panel">', '<div className="flex-1 overflow-y-auto p-4 flex flex-col gap-6">')
code = code.replace('<label className="field-label" htmlFor="watch-desc">', '<label className="text-text-secondary font-medium mb-1 block" htmlFor="watch-desc">')
code = code.replace('className="input"', 'className="w-full bg-[rgba(255,255,255,0.03)] border border-separator rounded-md p-2.5 text-text-primary placeholder:text-text-muted focus:border-[rgba(255,255,255,0.2)] focus:outline-none resize-none transition-colors"')

# 4. Replace dl / meta-list
code = code.replace('<dl className="meta-list">', '<dl className="flex flex-col gap-2.5">')

# Replace div inside meta-list with flex flex-col
code = re.sub(r'<div>\s*<dt>', r'<div className="flex justify-between items-center">\n                  <dt className="text-text-secondary">', code)
code = re.sub(r'</dt>\s*<dd>', r'</dt>\n                  <dd className="text-text-primary font-medium text-right overflow-hidden text-ellipsis whitespace-nowrap pl-4">', code)

# 5. Fix buttons section
code = code.replace('<div style={{ marginTop: \'16px\', display: \'flex\', gap: \'8px\' }}>', '<div className="flex flex-col gap-2 mt-2">')
code = code.replace('className="btn-secondary"', 'className="flex items-center justify-center gap-2 w-full py-2 bg-[rgba(255,255,255,0.06)] hover:bg-[rgba(255,255,255,0.1)] text-text-primary rounded-md transition-colors"')
code = code.replace('className="action-btn danger"', 'className="flex items-center justify-center gap-2 w-full py-2 bg-[rgba(255,70,70,0.1)] hover:bg-[rgba(255,70,70,0.2)] text-[#ff736a] rounded-md transition-colors"')

# Fix textarea
code = code.replace('rows={3}\n              />', 'rows={3}\n                className="w-full bg-[rgba(255,255,255,0.03)] border border-separator rounded-md p-2.5 text-text-primary placeholder:text-text-muted focus:border-[rgba(255,255,255,0.2)] focus:outline-none resize-none transition-colors"\n              />')

with open('apps/desktop/src/renderer/src/views/Watch.tsx', 'w') as f:
    f.write(code)

print("Updated Watch.tsx sidebar")
