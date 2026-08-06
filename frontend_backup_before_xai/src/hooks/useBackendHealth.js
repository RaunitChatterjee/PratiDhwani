import { useCallback, useEffect, useState } from 'react'
import { fetchBackendHealth } from '../services/api'

const DEFAULT_STATE = {
  online: null, // null = checking
  modelLoaded: null,
  device: null,
  latencyMs: null,
  lastChecked: null,
}

/**
 * Polls backend health on an interval (default 30s) and exposes online
 * status, model load state, device, latency, and last-checked time. Fields
 * the backend doesn't report stay null and are rendered as "Not reported".
 */
export function useBackendHealth(intervalMs = 30000) {
  const [health, setHealth] = useState(DEFAULT_STATE)

  const check = useCallback(async () => {
    const result = await fetchBackendHealth()
    setHealth({ ...result, lastChecked: new Date() })
  }, [])

  useEffect(() => {
    check()
    const id = setInterval(check, intervalMs)
    return () => clearInterval(id)
  }, [check, intervalMs])

  return { ...health, refresh: check }
}
