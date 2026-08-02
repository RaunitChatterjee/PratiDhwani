import { useEffect, useRef, useState } from 'react'

/**
 * Animates a numeric value from 0 to `value` over `duration` ms using
 * requestAnimationFrame, easing out. Returns the current animated number.
 */
export function useCountUp(value, duration = 900) {
  const [display, setDisplay] = useState(0)
  const frameRef = useRef(null)

  useEffect(() => {
    if (value === null || value === undefined || Number.isNaN(value)) {
      setDisplay(0)
      return undefined
    }

    const start = performance.now()
    const from = 0
    const to = Number(value)

    const tick = (now) => {
      const elapsed = now - start
      const t = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - t, 3) // ease-out cubic
      setDisplay(from + (to - from) * eased)
      if (t < 1) {
        frameRef.current = requestAnimationFrame(tick)
      } else {
        setDisplay(to)
      }
    }

    frameRef.current = requestAnimationFrame(tick)
    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current)
    }
  }, [value, duration])

  return display
}
