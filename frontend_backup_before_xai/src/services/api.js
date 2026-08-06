import axios from 'axios'

export const API_BASE_URL = 'http://127.0.0.1:8000'

const client = axios.create({
  baseURL: API_BASE_URL,
  timeout: 60000,
})

/**
 * Sends an audio file to the PratiDhwani backend for deepfake detection.
 * @param {File} file - .wav or .flac audio file
 * @param {(progress: number) => void} onUploadProgress
 * @returns {Promise<{prediction: string, confidence: number, bonafide: number, spoof: number}>}
 */
export async function analyzeAudio(file, onUploadProgress) {
  const formData = new FormData()
  formData.append('file', file)

  const response = await client.post('/predict', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: (event) => {
      if (onUploadProgress && event.total) {
        onUploadProgress(Math.round((event.loaded * 100) / event.total))
      }
    },
  })

  return response.data
}

/**
 * Lightweight health check used to reflect live backend status. Tries a
 * conventional /health route first for richer detail (model load state,
 * device); if the backend doesn't expose one, falls back to a plain
 * liveness probe against "/" and only reports what was actually returned —
 * unreported fields are left null rather than guessed.
 */
export async function fetchBackendHealth() {
  const started = performance.now()

  try {
    const res = await client.get('/health', { timeout: 5000 })
    const latencyMs = Math.round(performance.now() - started)
    const data = res.data || {}
    return {
      online: true,
      modelLoaded: data.model_loaded ?? data.modelLoaded ?? null,
      device: data.device ?? null,
      latencyMs,
    }
  } catch (err) {
    if (err.response) {
      // Server responded (even with 404) — it's alive, it just doesn't
      // expose a /health route.
      const latencyMs = Math.round(performance.now() - started)
      return { online: true, modelLoaded: null, device: null, latencyMs }
    }

    try {
      const rootStarted = performance.now()
      await client.get('/', { timeout: 4000 })
      const latencyMs = Math.round(performance.now() - rootStarted)
      return { online: true, modelLoaded: null, device: null, latencyMs }
    } catch {
      return { online: false, modelLoaded: null, device: null, latencyMs: null }
    }
  }
}

export async function checkBackendStatus() {
  const health = await fetchBackendHealth()
  return health.online
}

export default client
