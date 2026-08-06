import { memo, useMemo } from 'react'

// Decorative animated EQ-style bars. Heights/delays randomized once so the
// motion feels organic without any per-frame JS work.
function SoundWaveBars({ count = 24, className = '' }) {
  const bars = useMemo(
    () =>
      Array.from({ length: count }).map((_, i) => ({
        id: i,
        duration: 0.9 + Math.random() * 0.8,
        delay: Math.random() * 1.2,
        base: 30 + Math.random() * 40,
      })),
    [count]
  )

  return (
    <div className={`flex items-center gap-[3px] ${className}`} aria-hidden="true">
      {bars.map((b) => (
        <span
          key={b.id}
          className="w-[2.5px] rounded-full bg-gradient-to-t from-primary/30 to-primary origin-bottom"
          style={{
            height: `${b.base}%`,
            animation: `waveBar ${b.duration}s ease-in-out ${b.delay}s infinite`,
          }}
        />
      ))}
    </div>
  )
}

export default memo(SoundWaveBars)
