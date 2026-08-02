import { memo, useCallback, useState } from 'react'
import { FileText, Download, FileJson, CheckCircle2, Loader2 } from 'lucide-react'
import {
  formatFileSize,
  formatPercent,
  formatDurationPrecise,
  formatSampleRate,
  formatChannels,
  formatBitDepth,
} from '../utils/formatters'
import { downloadReportAsJSON, downloadReportAsPDF } from '../utils/reportGenerator'

function Field({ label, value }) {
  return (
    <div>
      <p className="font-mono text-[10px] uppercase tracking-wider text-muted">{label}</p>
      <p className="mt-1 text-[13px] text-ink">{value}</p>
    </div>
  )
}

function ReportPanel({ report, onGenerated }) {
  const [pdfState, setPdfState] = useState('idle') // idle | generating | done
  const [jsonState, setJsonState] = useState('idle')

  const handlePdf = useCallback(async () => {
    setPdfState('generating')
    try {
      await downloadReportAsPDF(report)
      setPdfState('done')
      onGenerated?.()
    } catch {
      setPdfState('idle')
    }
  }, [report, onGenerated])

  const handleJson = useCallback(() => {
    downloadReportAsJSON(report)
    setJsonState('done')
    onGenerated?.()
  }, [report, onGenerated])

  return (
    <section
      aria-labelledby="report-heading"
      className="animate-fadeUp rounded-2xl border border-line bg-card/60 p-6"
    >
      <div className="mb-5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-muted" aria-hidden="true" />
          <p
            id="report-heading"
            className="font-mono text-[11px] uppercase tracking-wider text-muted"
          >
            Forensic Report
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-3">
        <Field label="File Name" value={report.fileName} />
        <Field label="File Size" value={formatFileSize(report.fileSize)} />
        <Field label="Duration" value={formatDurationPrecise(report.duration)} />
        <Field label="Prediction" value={(report.prediction || 'Unknown').toUpperCase()} />
        <Field label="Confidence" value={formatPercent(report.confidence)} />
        <Field
          label="Inference Time"
          value={report.inferenceTimeMs != null ? `${report.inferenceTimeMs} ms` : 'Not available'}
        />
        <Field label="Timestamp" value={new Date(report.timestampIso).toLocaleString()} />
        <Field label="Model" value={report.modelName} />
        <Field label="Backend" value={report.backend} />
        <Field label="Sample Rate" value={formatSampleRate(report.sampleRate)} />
        <Field label="Channels" value={formatChannels(report.channels)} />
        <Field label="Bit Depth" value={formatBitDepth(report.bitDepth)} />
      </div>

      <div className="mt-6 flex flex-wrap gap-3 border-t border-line pt-5">
        <button
          onClick={handlePdf}
          disabled={pdfState === 'generating'}
          aria-label="Download forensic report as PDF"
          className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-[13px] font-medium text-white transition-all duration-200 hover:brightness-110 active:scale-95 disabled:opacity-60"
        >
          {pdfState === 'done' ? (
            <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
          ) : pdfState === 'generating' ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
          ) : (
            <Download className="h-3.5 w-3.5" aria-hidden="true" />
          )}
          {pdfState === 'generating' ? 'Generating…' : 'Download PDF'}
        </button>
        <button
          onClick={handleJson}
          aria-label="Download forensic report as JSON"
          className="flex items-center gap-2 rounded-lg border border-line bg-card px-4 py-2 text-[13px] text-ink transition-all duration-200 hover:border-primary/40 active:scale-95"
        >
          {jsonState === 'done' ? (
            <CheckCircle2 className="h-3.5 w-3.5 text-success" aria-hidden="true" />
          ) : (
            <FileJson className="h-3.5 w-3.5" aria-hidden="true" />
          )}
          Download JSON
        </button>
      </div>
    </section>
  )
}

export default memo(ReportPanel)
