import { lazy, Suspense, useCallback, useMemo, useState } from 'react'
import Hero from '../components/Hero'
import UploadZone, { SelectedFileBar } from '../components/UploadZone'
import InvestigationTimeline from '../components/InvestigationTimeline'
import PredictionCard from '../components/PredictionCard'
import ProbabilityBars from '../components/ProbabilityBars'
import ConfidenceExplanation from '../components/ConfidenceExplanation'
import ForensicExplanationCard from '../components/ForensicExplanationCard'
import AudioMetadataCard from '../components/AudioMetadataCard'
import ReportPanel from '../components/ReportPanel'
import ModelInfo from '../components/ModelInfo'
import RecentAnalysis from '../components/RecentAnalysis'
import ErrorBanner from '../components/ErrorBanner'
import { useAudioAnalysis } from '../hooks/useAudioAnalysis'
import { useAudioMetadata } from '../hooks/useAudioMetadata'
import { useLocalHistory } from '../hooks/useLocalHistory'
import { formatTime } from '../utils/formatters'
import { buildReportData } from '../utils/reportGenerator'
import { generateForensicExplanation } from '../utils/forensicExplanation'

// WaveSurfer.js is only needed once a result exists, so it's split into its
// own chunk and loaded lazily rather than bundled into the initial page.
const Waveform = lazy(() => import('../components/Waveform'))

function WaveformSkeleton() {
  return <div className="h-[141px] animate-pulse rounded-2xl border border-line bg-card/60" />
}

export default function Dashboard() {
  const { items: history, addEntry, clear: clearHistory } = useLocalHistory()
  const [timestampIso, setTimestampIso] = useState(null)

  const handleComplete = useCallback(
    ({ file, result }) => {
      const nowIso = new Date().toISOString()
      setTimestampIso(nowIso)
      addEntry({
        id: `${file.name}-${Date.now()}`,
        filename: file.name,
        prediction: result.prediction,
        confidence: result.confidence,
        timestamp: formatTime(),
        createdAt: nowIso,
      })
    },
    [addEntry]
  )

  const analysisOptions = useMemo(() => ({ onComplete: handleComplete }), [handleComplete])
  const { status, progress, result, error, file, inferenceTimeMs, runAnalysis, reset } =
    useAudioAnalysis(analysisOptions)

  const { metadata, isLoading: metadataLoading } = useAudioMetadata(file)

  const isBusy = status === 'uploading' || status === 'analyzing'
  const isDone = status === 'done' && !!result

  // Heuristic forensic explanation layer — computed once here so the
  // on-screen card and the exported PDF/JSON always show identical data.
  // Derived only from prediction/confidence (model outputs) and metadata
  // (client-extracted), never fabricated.
  const forensicExplanation = useMemo(() => {
    if (!isDone) return null
    return generateForensicExplanation({
      prediction: result.prediction,
      confidence: result.confidence,
      metadata,
    })
  }, [isDone, result, metadata])

  const report = useMemo(() => {
    if (!isDone) return null
    return buildReportData({
      file,
      result,
      metadata,
      inferenceTimeMs,
      timestampIso: timestampIso || new Date().toISOString(),
      forensicExplanation,
    })
  }, [isDone, file, result, metadata, inferenceTimeMs, timestampIso, forensicExplanation])

  const handleReset = useCallback(() => {
    reset()
  }, [reset])

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
                <SelectedFileBar file={file} onClear={handleReset} />
                <InvestigationTimeline status={status} progress={progress} reportReady={false} />
              </>
            )}

            {status === 'error' && <ErrorBanner error={error} onRetry={handleReset} />}

            {isDone && (
              <div className="flex flex-col gap-5 sm:gap-6">
                <SelectedFileBar file={file} onClear={handleReset} />

                <InvestigationTimeline status={status} progress={progress} reportReady />

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

                <ForensicExplanationCard
                  explanation={forensicExplanation}
                  confidence={result.confidence}
                />

                <ConfidenceExplanation confidence={result.confidence} prediction={result.prediction} />
                <ProbabilityBars bonafide={result.bonafide} spoof={result.spoof} />

                {report && <ReportPanel report={report} />}

                <button
                  onClick={handleReset}
                  className="self-start rounded-lg border border-line bg-card px-4 py-2 text-[13px] text-muted transition-all duration-200 hover:border-primary/40 hover:text-ink active:scale-95"
                >
                  Analyze another recording
                </button>
              </div>
            )}
          </div>

          {/* Right column: model info + metadata + history */}
          <div className="flex flex-col gap-5 sm:gap-6">
            <div id="model">
              <ModelInfo />
            </div>

            {file && (
              <AudioMetadataCard
                metadata={metadata}
                isLoading={metadataLoading}
                fileSize={file.size}
              />
            )}

            <div id="history">
              <RecentAnalysis items={history} onClear={clearHistory} />
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
