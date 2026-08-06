import { memo, useMemo, useState } from 'react'
import { History, FileAudio, Search, Trash2 } from 'lucide-react'
import { formatPercent, truncateFilename } from '../utils/formatters'

function RecentAnalysis({ items, onClear }) {
  const [query, setQuery] = useState('')

  const filtered = useMemo(() => {
    if (!query.trim()) return items
    const q = query.trim().toLowerCase()
    return items.filter((item) => item.filename?.toLowerCase().includes(q))
  }, [items, query])

  return (
    <div className="rounded-2xl border border-line bg-card/60 p-6 transition-colors duration-300 hover:border-primary/15">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <History className="h-4 w-4 text-muted" aria-hidden="true" />
          <p className="font-mono text-[11px] uppercase tracking-wider text-muted">
            Recent Analysis
          </p>
        </div>
        {items.length > 0 && (
          <button
            onClick={onClear}
            aria-label="Clear analysis history"
            className="flex items-center gap-1.5 rounded-md px-2 py-1 text-[11px] text-muted transition-colors hover:bg-danger/10 hover:text-danger"
          >
            <Trash2 className="h-3 w-3" aria-hidden="true" />
            Clear
          </button>
        )}
      </div>

      {items.length > 0 && (
        <div className="relative mb-4">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted"
            aria-hidden="true"
          />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by filename…"
            aria-label="Search analysis history by filename"
            className="w-full rounded-lg border border-line bg-bg py-2 pl-9 pr-3 text-[12px] text-ink placeholder:text-muted/60 transition-colors focus:border-primary/50 focus:outline-none"
          />
        </div>
      )}

      {items.length === 0 ? (
        <p className="py-6 text-center text-[13px] text-muted">
          Analyzed recordings will appear here.
        </p>
      ) : filtered.length === 0 ? (
        <p className="py-6 text-center text-[13px] text-muted">
          No recordings match "{query}".
        </p>
      ) : (
        <div className="flex max-h-80 flex-col divide-y divide-line overflow-y-auto no-scrollbar">
          {filtered.map((item) => {
            const isBonafide = item.prediction?.toLowerCase() === 'bonafide'
            return (
              <div
                key={item.id}
                className="animate-fadeUp flex items-center justify-between gap-3 py-3 transition-colors first:pt-0 last:pb-0 hover:bg-white/[0.02]"
              >
                <div className="flex min-w-0 items-center gap-2.5">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-bg">
                    <FileAudio className="h-3.5 w-3.5 text-muted" aria-hidden="true" />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-[13px] text-ink">
                      {truncateFilename(item.filename)}
                    </p>
                    <p className="font-mono text-[11px] text-muted">{item.timestamp}</p>
                  </div>
                </div>

                <div className="shrink-0 text-right">
                  <p
                    className={`text-[12px] font-semibold uppercase tracking-wide ${
                      isBonafide ? 'text-success' : 'text-danger'
                    }`}
                  >
                    {item.prediction}
                  </p>
                  <p className="font-mono text-[11px] text-muted">
                    {formatPercent(item.confidence)}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default memo(RecentAnalysis)
