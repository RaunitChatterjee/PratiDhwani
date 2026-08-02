import { History, FileAudio } from 'lucide-react'
import { formatPercent, truncateFilename } from '../utils/formatters'

export default function RecentAnalysis({ items }) {
  return (
    <div className="rounded-2xl border border-line bg-card/60 p-6">
      <div className="mb-5 flex items-center gap-2">
        <History className="h-4 w-4 text-muted" />
        <p className="font-mono text-[11px] uppercase tracking-wider text-muted">
          Recent Analysis
        </p>
      </div>

      {items.length === 0 ? (
        <p className="py-6 text-center text-[13px] text-muted">
          Analyzed recordings will appear here.
        </p>
      ) : (
        <div className="flex flex-col divide-y divide-line">
          {items.map((item) => {
            const isBonafide = item.prediction?.toLowerCase() === 'bonafide'
            return (
              <div key={item.id} className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
                <div className="flex min-w-0 items-center gap-2.5">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-bg">
                    <FileAudio className="h-3.5 w-3.5 text-muted" />
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
