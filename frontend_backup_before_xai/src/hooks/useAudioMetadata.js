import { useEffect, useState } from 'react'
import { extractAudioMetadata } from '../utils/audioMetadata'

export function useAudioMetadata(file) {
  const [metadata, setMetadata] = useState(null)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (!file) {
      setMetadata(null)
      return undefined
    }

    let cancelled = false
    setIsLoading(true)

    extractAudioMetadata(file).then((result) => {
      if (!cancelled) {
        setMetadata(result)
        setIsLoading(false)
      }
    })

    return () => {
      cancelled = true
    }
  }, [file])

  return { metadata, isLoading }
}
