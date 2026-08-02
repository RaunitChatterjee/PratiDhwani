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
 * Lightweight health check used to reflect live backend status in the navbar.
 */
export async function checkBackendStatus() {
  try {
    await client.get('/', { timeout: 4000 })
    return true
  } catch (err) {
    // A 404 on "/" still proves the server is alive and responding.
    if (err.response) return true
    return false
  }
}

export default client
