import { memo, useMemo } from 'react'

// Lightweight floating particles: a fixed set of absolutely-positioned dots
// animated purely with CSS. Positions/delays are randomized once via useMemo
// so re-renders never reshuffle or restart the animation.
function Particles({ count = 14 }) {
  const dots = useMemo(
    () =>
      Array.from({ length: count }).map((_, i) => ({
        id: i,
        left: Math.round(Math.random() * 100),
        top: Math.round(Math.random() * 100),
        size: 1.5 + Math.random() * 2,
        duration: 10 + Math.random() * 10,
        delay: Math.random() * 8,
        opacity: 0.25 + Math.random() * 0.35,
      })),
    [count]
  )

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      {dots.map((d) => (
        <span
          key={d.id}
          className="absolute rounded-full bg-primary"
          style={{
            left: `${d.left}%`,
            top: `${d.top}%`,
            width: d.size,
            height: d.size,
            opacity: d.opacity,
            animation: `floatParticle ${d.duration}s ease-in-out ${d.delay}s infinite`,
            boxShadow: '0 0 6px rgba(37, 99, 235, 0.8)',
          }}
        />
      ))}
    </div>
  )
}

export default memo(Particles)
