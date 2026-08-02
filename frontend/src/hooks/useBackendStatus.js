import { useEffect, useState } from 'react'
import { checkBackendStatus } from '../services/api'

export function useBackendStatus(intervalMs = 15000) {
  const [online, setOnline] = useState(null) // null = checking

  useEffect(() => {
    let cancelled = false

    async function poll() {
      const isOnline = await checkBackendStatus()
      if (!cancelled) setOnline(isOnline)
    }

    poll()
    const id = setInterval(poll, intervalMs)
    return () => {
      cancelled = true
      clearInterval(id)
    }
  }, [intervalMs])

  return online
}
