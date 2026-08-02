import { useCallback, useState } from 'react'
import Hero from '../components/Hero'
import UploadZone, { SelectedFileBar } from '../components/UploadZone'
import AnalyzingIndicator from '../components/AnalyzingIndicator'
import Waveform from '../components/Waveform'
import PredictionCard from '../components/PredictionCard'
import ProbabilityBars from '../components/ProbabilityBars'
import ModelInfo from '../components/ModelInfo'
import RecentAnalysis from '../components/RecentAnalysis'
import ErrorBanner from '../components/ErrorBanner'
import { useAudioAnalysis } from '../hooks/useAudioAnalysis'
import { formatTime } from '../utils/formatters'

export default function Dashboard() {
  const [history, setHistory] = useState([])

  const handleComplete = useCallback(({ file, result }) => {
    setHistory((prev) => [
      {
        id: `${file.name}-${Date.now()}`,
        filename: file.name,
        prediction: result.prediction,
        confidence: result.confidence,
        timestamp: formatTime(),
      },
      ...prev,
    ].slice(0, 8))
  }, [])

  const { status, progress, result, error, file, inferenceTimeMs, runAnalysis, reset } =
    useAudioAnalysis({ onComplete: handleComplete })

  const isBusy = status === 'uploading' || status === 'analyzing'

  return (
    <>
      <Hero />

      <section className="mx-auto max-w-7xl px-6 py-14">
        <div className="grid gap-8 lg:grid-cols-[1.3fr_0.9fr]">
          {/* Left column: upload + analysis */}
          <div className="flex flex-col gap-6">
            {status === 'idle' && <UploadZone onFileSelected={runAnalysis} disabled={isBusy} />}

            {isBusy && (
              <>
                <SelectedFileBar file={file} onClear={reset} />
                <AnalyzingIndicator status={status} progress={progress} />
              </>
            )}

            {status === 'error' && <ErrorBanner message={error} onRetry={reset} />}

            {status === 'done' && result && (
              <div className="flex flex-col gap-6 animate-fadeUp">
                <SelectedFileBar file={file} onClear={reset} />
                <Waveform
                  file={file}
                  accentColor={
                    result.prediction?.toLowerCase() === 'bonafide' ? '#22C55E' : '#EF4444'
                  }
                />
                <PredictionCard
                  prediction={result.prediction}
                  confidence={result.confidence}
                  inferenceTimeMs={inferenceTimeMs}
                />
                <ProbabilityBars bonafide={result.bonafide} spoof={result.spoof} />

                <button
                  onClick={reset}
                  className="self-start rounded-lg border border-line bg-card px-4 py-2 text-[13px] text-muted transition-colors hover:border-primary/40 hover:text-ink"
                >
                  Analyze another recording
                </button>
              </div>
            )}
          </div>

          {/* Right column: model info + history */}
          <div className="flex flex-col gap-6">
            <ModelInfo />
            <RecentAnalysis items={history} />
          </div>
        </div>
      </section>
    </>
  )
}
