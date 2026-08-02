import { useEffect, useRef } from 'react'

/**
 * Applies a subtle mouse-driven parallax transform to the returned ref's
 * element. Writes directly to the DOM via requestAnimationFrame instead of
 * React state, so it never triggers a component re-render.
 */
export function useParallax(strength = 12) {
  const ref = useRef(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    let frame = null
    let targetX = 0
    let targetY = 0

    const apply = () => {
      el.style.transform = `translate3d(${targetX}px, ${targetY}px, 0)`
      frame = null
    }

    const onMove = (e) => {
      const { innerWidth, innerHeight } = window
      targetX = ((e.clientX / innerWidth) - 0.5) * strength
      targetY = ((e.clientY / innerHeight) - 0.5) * strength
      if (!frame) frame = requestAnimationFrame(apply)
    }

    window.addEventListener('mousemove', onMove, { passive: true })
    return () => {
      window.removeEventListener('mousemove', onMove)
      if (frame) cancelAnimationFrame(frame)
    }
  }, [strength])

  return ref
}
