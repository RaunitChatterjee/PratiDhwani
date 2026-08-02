import { lazy, Suspense, useCallback, useMemo, useState } from 'react'
import Hero from '../components/Hero'
import UploadZone, { SelectedFileBar } from '../components/UploadZone'
import AnalyzingIndicator from '../components/AnalyzingIndicator'
import PredictionCard from '../components/PredictionCard'
import ProbabilityBars from '../components/ProbabilityBars'
import ModelInfo from '../components/ModelInfo'
import RecentAnalysis from '../components/RecentAnalysis'
import ErrorBanner from '../components/ErrorBanner'
import { useAudioAnalysis } from '../hooks/useAudioAnalysis'
import { formatTime } from '../utils/formatters'

// WaveSurfer.js is only needed once a result exists, so it's split into its
// own chunk and loaded lazily rather than bundled into the initial page.
const Waveform = lazy(() => import('../components/Waveform'))

function WaveformSkeleton() {
  return (
    <div className="h-[141px] animate-pulse rounded-2xl border border-line bg-card/60" />
  )
}

export default function Dashboard() {
  const [history, setHistory] = useState([])

  const handleComplete = useCallback(({ file, result }) => {
    setHistory((prev) =>
      [
        {
          id: `${file.name}-${Date.now()}`,
          filename: file.name,
          prediction: result.prediction,
          confidence: result.confidence,
          timestamp: formatTime(),
        },
        ...prev,
      ].slice(0, 8)
    )
  }, [])

  const analysisOptions = useMemo(() => ({ onComplete: handleComplete }), [handleComplete])
  const { status, progress, result, error, file, inferenceTimeMs, runAnalysis, reset } =
    useAudioAnalysis(analysisOptions)

  const isBusy = status === 'uploading' || status === 'analyzing'

  return (
    <>
      <Hero />

      <section id="analyze" className="mx-auto max-w-7xl px-6 py-14 md:py-16">
        <div className="grid gap-6 sm:gap-8 lg:grid-cols-[1.3fr_0.9fr]">
          {/* Left column: upload + analysis */}
          <div className="flex flex-col gap-5 sm:gap-6">
            {status === 'idle' && <UploadZone onFileSelected={runAnalysis} disabled={isBusy} />}

            {isBusy && (
              <>
                <SelectedFileBar file={file} onClear={reset} />
                <AnalyzingIndicator status={status} progress={progress} />
              </>
            )}

            {status === 'error' && <ErrorBanner message={error} onRetry={reset} />}

            {status === 'done' && result && (
              <div className="flex flex-col gap-5 sm:gap-6">
                <SelectedFileBar file={file} onClear={reset} />

                <Suspense fallback={<WaveformSkeleton />}>
                  <Waveform
                    file={file}
                    accentColor={
                      result.prediction?.toLowerCase() === 'bonafide' ? '#22C55E' : '#EF4444'
                    }
                  />
                </Suspense>

                <PredictionCard
                  prediction={result.prediction}
                  confidence={result.confidence}
                  inferenceTimeMs={inferenceTimeMs}
                />
                <ProbabilityBars bonafide={result.bonafide} spoof={result.spoof} />

                <button
                  onClick={reset}
                  className="self-start rounded-lg border border-line bg-card px-4 py-2 text-[13px] text-muted transition-all duration-200 hover:border-primary/40 hover:text-ink active:scale-95"
                >
                  Analyze another recording
                </button>
              </div>
            )}
          </div>

          {/* Right column: model info + history */}
          <div className="flex flex-col gap-5 sm:gap-6">
            <div id="model">
              <ModelInfo />
            </div>
            <div id="history">
              <RecentAnalysis items={history} />
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
