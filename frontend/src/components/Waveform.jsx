import { useEffect, useRef, useState } from 'react'
import WaveSurfer from 'wavesurfer.js'
import { Play, Pause, RotateCcw } from 'lucide-react'
import { formatDuration } from '../utils/formatters'

export default function Waveform({ file, accentColor = '#2563EB' }) {
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
    <div className="rounded-2xl border border-line bg-card/60 p-5">
      <div ref={containerRef} className={isReady ? '' : 'opacity-40'} />

      <div className="mt-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={togglePlay}
            disabled={!isReady}
            aria-label={isPlaying ? 'Pause' : 'Play'}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-white transition-transform hover:scale-105 disabled:opacity-40"
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
            className="flex h-9 w-9 items-center justify-center rounded-full border border-line text-muted transition-colors hover:text-ink disabled:opacity-40"
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </button>
        </div>

        <p className="font-mono text-[12px] text-muted">
          {formatDuration(currentTime)} / {formatDuration(duration)}
        </p>
      </div>
    </div>
  )
}
