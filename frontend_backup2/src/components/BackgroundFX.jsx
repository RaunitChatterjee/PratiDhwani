import { memo } from 'react'

// Purely decorative, fixed-position background. Rendered once at the app
// root so it never re-renders with page state, and uses only CSS animation
// (no JS ticking) to stay cheap.
function BackgroundFX() {
  return (
    <div className="bg-fx" aria-hidden="true">
      <div className="bg-fx__glow" />
      <div className="bg-fx__grid" />
      <div className="bg-fx__noise" />
    </div>
  )
}

export default memo(BackgroundFX)
