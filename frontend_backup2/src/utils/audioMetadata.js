// Client-side audio metadata extraction. Duration/sampleRate/channelCount
// come from the Web Audio API (works for any format the browser can
// decode). Bit depth isn't exposed by the Web Audio API, so for WAV and
// FLAC we additionally parse the file's own header — if the format or
// header isn't recognized, we honestly report "Not available" rather than
// guessing.

async function readBitDepthFromWav(buffer) {
  const view = new DataView(buffer)
  if (view.byteLength < 12) return null
  const riff = String.fromCharCode(view.getUint8(0), view.getUint8(1), view.getUint8(2), view.getUint8(3))
  const wave = String.fromCharCode(view.getUint8(8), view.getUint8(9), view.getUint8(10), view.getUint8(11))
  if (riff !== 'RIFF' || wave !== 'WAVE') return null

  let offset = 12
  while (offset + 8 <= view.byteLength) {
    const id = String.fromCharCode(
      view.getUint8(offset),
      view.getUint8(offset + 1),
      view.getUint8(offset + 2),
      view.getUint8(offset + 3)
    )
    const size = view.getUint32(offset + 4, true)
    if (id === 'fmt ' && offset + 8 + 16 <= view.byteLength) {
      // bitsPerSample sits at bytes 14-15 of the fmt chunk body
      return view.getUint16(offset + 8 + 14, true)
    }
    offset += 8 + size + (size % 2)
  }
  return null
}

async function readBitDepthFromFlac(buffer) {
  const view = new DataView(buffer)
  if (view.byteLength < 42) return null
  const marker = String.fromCharCode(view.getUint8(0), view.getUint8(1), view.getUint8(2), view.getUint8(3))
  if (marker !== 'fLaC') return null

  // STREAMINFO block starts right after the 4-byte marker, preceded by a
  // 4-byte metadata block header (type + length).
  const streamInfoStart = 4 + 4
  // Bytes 10-13 (relative to STREAMINFO data) pack sample rate (20 bits),
  // channels-1 (3 bits), bits-per-sample-1 (5 bits).
  const b12 = view.getUint8(streamInfoStart + 12)
  const b13 = view.getUint8(streamInfoStart + 13)
  const bitsPerSampleMinusOne = ((b12 & 0x01) << 4) | (b13 >> 4)
  return bitsPerSampleMinusOne + 1
}

async function readBitDepth(file) {
  try {
    const ext = file.name.slice(file.name.lastIndexOf('.')).toLowerCase()
    // Only the header is needed, but reading the whole small audio file is
    // simplest and safe for typical speech clips.
    const buffer = await file.arrayBuffer()
    if (ext === '.wav') return await readBitDepthFromWav(buffer)
    if (ext === '.flac') return await readBitDepthFromFlac(buffer)
    return null
  } catch {
    return null
  }
}

/**
 * Extracts playback metadata (duration, sample rate, channels) via the Web
 * Audio API, plus bit depth via manual header parsing where possible.
 * Never throws — on failure, fields are null and the caller can render
 * "Not available".
 */
export async function extractAudioMetadata(file) {
  const result = {
    duration: null,
    sampleRate: null,
    channels: null,
    bitDepth: null,
    fileSize: file.size,
  }

  try {
    const arrayBuffer = await file.arrayBuffer()
    const AudioCtx = window.AudioContext || window.webkitAudioContext
    if (AudioCtx) {
      const ctx = new AudioCtx()
      try {
        const decoded = await ctx.decodeAudioData(arrayBuffer.slice(0))
        result.duration = decoded.duration
        result.sampleRate = decoded.sampleRate
        result.channels = decoded.numberOfChannels
      } finally {
        ctx.close?.()
      }
    }
  } catch {
    // Decoding failed (e.g. unusual codec) — metadata stays null, which is
    // reported honestly in the UI rather than faked.
  }

  result.bitDepth = await readBitDepth(file)

  return result
}
