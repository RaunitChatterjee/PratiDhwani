export const MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024 // 50 MB
export const ACCEPTED_EXTENSIONS = ['.wav', '.flac']

/**
 * Client-side pre-flight checks, run before any network request. Returns
 * a forensic-style { title, message } pair, or null if the file passes.
 */
export function validateAudioFile(file) {
  if (!file) {
    return { title: 'No file selected', message: 'Select a recording to begin analysis.' }
  }

  const ext = file.name.slice(file.name.lastIndexOf('.')).toLowerCase()
  if (!ACCEPTED_EXTENSIONS.includes(ext)) {
    return {
      title: 'Unsupported format',
      message: 'This file type isn\u2019t supported. Upload a .wav or .flac recording.',
    }
  }

  if (file.size === 0) {
    return {
      title: 'Empty file',
      message: 'This file contains no audio data and cannot be analyzed.',
    }
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    return {
      title: 'File too large',
      message: `This recording exceeds the 50 MB limit for analysis. Trim or compress it and try again.`,
    }
  }

  return null
}

/**
 * Maps a caught error (axios or otherwise) to a forensic-style alert. Only
 * describes what actually happened — no speculation about internal causes.
 */
export function classifyRequestError(err) {
  if (err?.code === 'ECONNABORTED' || /timeout/i.test(err?.message || '')) {
    return {
      title: 'Request timed out',
      message:
        'The inference server took too long to respond. It may be under heavy load — please try again.',
    }
  }

  if (err?.response) {
    const status = err.response.status
    const detail = err.response.data?.detail
    if (status >= 500) {
      return {
        title: 'Backend processing error',
        message: detail || 'The inference server encountered an internal error while analyzing this recording.',
      }
    }
    if (status === 413) {
      return {
        title: 'File too large',
        message: 'The server rejected this file for exceeding its size limit.',
      }
    }
    if (status === 415 || status === 400) {
      return {
        title: 'Rejected by backend',
        message: detail || 'The backend could not process this file format.',
      }
    }
    return {
      title: `Request failed (${status})`,
      message: detail || 'The backend returned an unexpected error.',
    }
  }

  if (err?.request || err?.code === 'ERR_NETWORK') {
    return {
      title: 'Backend unavailable',
      message:
        'Unable to reach the PratiDhwani inference server at 127.0.0.1:8000. Confirm it\u2019s running and reachable.',
    }
  }

  return {
    title: 'Analysis failed',
    message: err?.message || 'An unexpected error occurred during analysis.',
  }
}
