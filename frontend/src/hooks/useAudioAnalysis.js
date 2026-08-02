import { useCallback, useState } from 'react'
import { analyzeAudio } from '../services/api'

// status: 'idle' | 'uploading' | 'analyzing' | 'done' | 'error'
export function useAudioAnalysis({ onComplete } = {}) {
  const [status, setStatus] = useState('idle')
  const [progress, setProgress] = useState(0)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)
  const [file, setFile] = useState(null)
  const [inferenceTimeMs, setInferenceTimeMs] = useState(null)

  const reset = useCallback(() => {
    setStatus('idle')
    setProgress(0)
    setResult(null)
    setError(null)
    setFile(null)
    setInferenceTimeMs(null)
  }, [])

  const runAnalysis = useCallback(
    async (selectedFile) => {
      setFile(selectedFile)
      setError(null)
      setResult(null)
      setStatus('uploading')
      setProgress(0)

      const startedAt = performance.now()

      try {
        const data = await analyzeAudio(selectedFile, (pct) => {
          setProgress(pct)
          if (pct >= 100) setStatus('analyzing')
        })
        const elapsed = Math.round(performance.now() - startedAt)
        setInferenceTimeMs(elapsed)
        setResult(data)
        setStatus('done')
        onComplete?.({ file: selectedFile, result: data, inferenceTimeMs: elapsed })
      } catch (err) {
        const message =
          err.response?.data?.detail ||
          err.message ||
          'Unable to reach the PratiDhwani inference server.'
        setError(message)
        setStatus('error')
      }
    },
    [onComplete]
  )

  return { status, progress, result, error, file, inferenceTimeMs, runAnalysis, reset }
}
