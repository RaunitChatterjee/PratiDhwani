import { memo } from 'react'
import { Waves, FileDigit } from 'lucide-react'
import {
  formatSampleRate,
  formatChannels,
  formatBitDepth,
  formatDurationPrecise,
  formatFileSize,
} from '../utils/formatters'

function Row({ label, value, loading }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-[13px] text-muted">{label}</span>
      {loading ? (
        <span className="h-3.5 w-16 animate-pulse rounded bg-line" aria-hidden="true" />
      ) : (
        <span className="font-mono text-[13px] text-ink">{value}</span>
      )}
    </div>
  )
}

function AudioMetadataCard({ metadata, isLoading, fileSize }) {
  return (
    <div className="animate-fadeUp rounded-2xl border border-line bg-card/60 p-6 transition-colors duration-300 hover:border-primary/15">
      <div className="mb-5 flex items-center gap-2">
        <Waves className="h-4 w-4 text-muted" aria-hidden="true" />
        <p className="font-mono text-[11px] uppercase tracking-wider text-muted">
          Audio Metadata
        </p>
      </div>

      <div className="flex flex-col gap-3.5">
        <Row
          label="Duration"
          loading={isLoading}
          value={formatDurationPrecise(metadata?.duration)}
        />
        <Row
          label="Sample Rate"
          loading={isLoading}
          value={formatSampleRate(metadata?.sampleRate)}
        />
        <Row
          label="Channels"
          loading={isLoading}
          value={formatChannels(metadata?.channels)}
        />
        <Row
          label="Bit Depth"
          loading={isLoading}
          value={formatBitDepth(metadata?.bitDepth)}
        />
        <Row label="File Size" loading={false} value={formatFileSize(fileSize)} />
      </div>

      {!isLoading && (!metadata?.sampleRate || !metadata?.bitDepth) && (
        <div className="mt-4 flex items-start gap-2 rounded-lg border border-line bg-bg px-3 py-2.5 text-[11px] text-muted">
          <FileDigit className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          <span>
            Some fields aren't available for this file's format or codec and are shown as
            "Not available" rather than estimated.
          </span>
        </div>
      )}
    </div>
  )
}

export default memo(AudioMetadataCard)
