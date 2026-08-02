export function formatPercent(value) {
  if (value === null || value === undefined || Number.isNaN(value)) return '—'
  return `${Number(value).toFixed(2)}%`
}

export function formatTime(date = new Date()) {
  return new Intl.DateTimeFormat('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).format(date)
}

export function formatDuration(seconds) {
  if (!Number.isFinite(seconds)) return '0:00'
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

export function formatFileSize(bytes) {
  if (!bytes) return '0 KB'
  const kb = bytes / 1024
  if (kb < 1024) return `${kb.toFixed(0)} KB`
  return `${(kb / 1024).toFixed(2)} MB`
}

/**
 * Maps a 0-100 confidence value to a qualitative tier used for the
 * confidence badge. Thresholds are a UX convenience, not a model output.
 */
export function confidenceTier(value) {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return { label: 'Unknown', level: 'unknown' }
  }
  const v = Number(value)
  if (v >= 85) return { label: 'High confidence', level: 'high' }
  if (v >= 60) return { label: 'Medium confidence', level: 'medium' }
  return { label: 'Low confidence', level: 'low' }
}

export function truncateFilename(name, max = 28) {
  if (!name || name.length <= max) return name
  const extIndex = name.lastIndexOf('.')
  const ext = extIndex > -1 ? name.slice(extIndex) : ''
  const base = name.slice(0, max - ext.length - 1)
  return `${base}…${ext}`
}
