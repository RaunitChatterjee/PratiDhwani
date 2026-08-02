import { WifiOff, RefreshCcw } from 'lucide-react'

export default function ErrorBanner({ message, onRetry }) {
  return (
    <div className="animate-fadeUp flex flex-col items-center gap-4 rounded-2xl border border-danger/25 bg-danger/[0.06] px-6 py-10 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-danger/15">
        <WifiOff className="h-6 w-6 text-danger" strokeWidth={1.75} />
      </div>
      <div>
        <p className="text-[14px] font-medium text-ink">Analysis failed</p>
        <p className="mt-1 max-w-sm text-[13px] text-muted">{message}</p>
      </div>
      <button
        onClick={onRetry}
        className="flex items-center gap-2 rounded-lg border border-line bg-card px-4 py-2 text-[13px] text-ink transition-all duration-200 hover:border-primary/40 active:scale-95"
      >
        <RefreshCcw className="h-3.5 w-3.5" />
        Try again
      </button>
    </div>
  )
}
