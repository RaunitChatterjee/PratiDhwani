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

export function formatSampleRate(hz) {
  if (!hz) return 'Not available'
  return `${(hz / 1000).toFixed(1)} kHz`
}

export function formatChannels(count) {
  if (!count) return 'Not available'
  if (count === 1) return 'Mono (1)'
  if (count === 2) return 'Stereo (2)'
  return `${count} channels`
}

export function formatBitDepth(bits) {
  if (!bits) return 'Not available'
  return `${bits}-bit`
}

export function formatDurationPrecise(seconds) {
  if (!Number.isFinite(seconds)) return 'Not available'
  const m = Math.floor(seconds / 60)
  const s = (seconds % 60).toFixed(2)
  return `${m}:${s.padStart(5, '0')}`
}

/**
 * Produces a plain-language explanation of a confidence score. Deliberately
 * conservative: it describes the score qualitatively and states the
 * probabilistic nature of the result, without asserting any technical
 * mechanism the model doesn't actually expose.
 */
export function explainConfidence(confidence, prediction) {
  if (confidence === null || confidence === undefined || Number.isNaN(confidence)) {
    return 'Confidence could not be determined for this recording.'
  }

  const v = Number(confidence)
  const isSpoof = prediction?.toLowerCase() === 'spoof'
  const subject = isSpoof ? 'AI-generated speech' : 'authentic human speech'

  let strength
  if (v >= 85) strength = 'strong characteristics associated with'
  else if (v >= 60) strength = 'some characteristics associated with'
  else strength = 'only weak indications associated with'

  return `${v.toFixed(1)}% confidence indicates the model found ${strength} ${subject} in this recording. This is a probabilistic assessment based on learned patterns, not absolute proof — it should be treated as one input among several in any investigation.`
}

export function truncateFilename(name, max = 28) {
  if (!name || name.length <= max) return name
  const extIndex = name.lastIndexOf('.')
  const ext = extIndex > -1 ? name.slice(extIndex) : ''
  const base = name.slice(0, max - ext.length - 1)
  return `${base}…${ext}`
}
