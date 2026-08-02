import { useCallback, useEffect, useState } from 'react'

const STORAGE_KEY = 'pratidhwani:history:v1'
const MAX_ITEMS = 20

function readFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

/**
 * Persists analysis history to localStorage, capped at the most recent 20
 * entries, always sorted newest-first by createdAt.
 */
export function useLocalHistory() {
  const [items, setItems] = useState(readFromStorage)

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
    } catch {
      // Storage may be unavailable (private browsing, quota) — history
      // simply won't persist across reloads in that case.
    }
  }, [items])

  const addEntry = useCallback((entry) => {
    setItems((prev) => {
      const next = [entry, ...prev].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )
      return next.slice(0, MAX_ITEMS)
    })
  }, [])

  const clear = useCallback(() => setItems([]), [])

  return { items, addEntry, clear }
}
