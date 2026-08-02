import { memo, useEffect, useRef, useState } from 'react'
import WaveSurfer from 'wavesurfer.js'
import { Play, Pause, RotateCcw } from 'lucide-react'
import { formatDuration } from '../utils/formatters'

function Waveform({ file, accentColor = '#2563EB' }) {
  const containerRef = useRef(null)
  const wavesurferRef = useRef(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    if (!file || !containerRef.current) return

    const objectUrl = URL.createObjectURL(file)
    setIsReady(false)

    const ws = WaveSurfer.create({
      container: containerRef.current,
      waveColor: 'rgba(148, 163, 184, 0.35)',
      progressColor: accentColor,
      cursorColor: '#FFFFFF',
      cursorWidth: 1,
      barWidth: 2,
      barGap: 2,
      barRadius: 2,
      height: 72,
      normalize: true,
      url: objectUrl,
    })

    wavesurferRef.current = ws

    ws.on('ready', () => {
      setDuration(ws.getDuration())
      setIsReady(true)
    })
    ws.on('audioprocess', () => setCurrentTime(ws.getCurrentTime()))
    ws.on('seeking', (t) => setCurrentTime(t))
    ws.on('finish', () => setIsPlaying(false))

    return () => {
      ws.destroy()
      URL.revokeObjectURL(objectUrl)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [file])

  const togglePlay = () => {
    const ws = wavesurferRef.current
    if (!ws) return
    ws.playPause()
    setIsPlaying(ws.isPlaying())
  }

  const restart = () => {
    const ws = wavesurferRef.current
    if (!ws) return
    ws.seekTo(0)
    ws.play()
    setIsPlaying(true)
  }

  return (
    <div className="animate-fadeUp rounded-2xl border border-line bg-card/60 p-5 transition-colors duration-300 hover:border-primary/15">
      <div className="relative">
        <div ref={containerRef} className={`transition-opacity duration-500 ${isReady ? 'opacity-100' : 'opacity-0'}`} />
        {!isReady && (
          <div className="absolute inset-0 flex items-center gap-[3px]" aria-hidden="true">
            {Array.from({ length: 48 }).map((_, i) => (
              <span
                key={i}
                className="w-[2px] flex-1 rounded-full bg-line"
                style={{
                  height: `${20 + Math.abs(Math.sin(i * 0.7)) * 50}%`,
                  animation: `waveBar 1.4s ease-in-out ${i * 0.02}s infinite`,
                }}
              />
            ))}
          </div>
        )}
      </div>

      <div className="mt-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={togglePlay}
            disabled={!isReady}
            aria-label={isPlaying ? 'Pause' : 'Play'}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-white transition-all duration-200 hover:scale-105 hover:shadow-glow active:scale-95 disabled:opacity-40 disabled:hover:scale-100"
          >
            {isPlaying ? (
              <Pause className="h-4 w-4" fill="currentColor" />
            ) : (
              <Play className="ml-0.5 h-4 w-4" fill="currentColor" />
            )}
          </button>
          <button
            onClick={restart}
            disabled={!isReady}
            aria-label="Restart"
            className="flex h-9 w-9 items-center justify-center rounded-full border border-line text-muted transition-all duration-200 hover:border-primary/30 hover:text-ink active:scale-95 disabled:opacity-40"
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </button>
        </div>

        <p className="font-mono text-[12px] text-muted font-tabular">
          {formatDuration(currentTime)} <span className="text-muted/40">/</span> {formatDuration(duration)}
        </p>
      </div>
    </div>
  )
}

export default memo(Waveform)
