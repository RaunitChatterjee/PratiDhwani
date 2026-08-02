import {
  formatFileSize,
  formatPercent,
  formatDurationPrecise,
  formatSampleRate,
  formatChannels,
  formatBitDepth,
} from './formatters'

/**
 * Assembles the full forensic report object from the pieces already present
 * elsewhere in the app (prediction result, file, metadata). Pure data —
 * no network calls, no fabricated fields.
 */
export function buildReportData({ file, result, metadata, inferenceTimeMs, timestampIso }) {
  return {
    fileName: file?.name ?? 'Unknown',
    fileSize: file?.size ?? null,
    duration: metadata?.duration ?? null,
    sampleRate: metadata?.sampleRate ?? null,
    channels: metadata?.channels ?? null,
    bitDepth: metadata?.bitDepth ?? null,
    prediction: result?.prediction ?? null,
    confidence: result?.confidence ?? null,
    bonafide: result?.bonafide ?? null,
    spoof: result?.spoof ?? null,
    inferenceTimeMs: inferenceTimeMs ?? null,
    timestampIso: timestampIso ?? new Date().toISOString(),
    modelName: 'facebook/wav2vec2-base',
    backend: 'FastAPI',
  }
}

function safeFilenameFragment(name) {
  return (name || 'report').replace(/[^a-z0-9-_]+/gi, '_').slice(0, 60)
}

export function downloadReportAsJSON(report) {
  const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `pratidhwani-report-${safeFilenameFragment(report.fileName)}.json`
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

export async function downloadReportAsPDF(report) {
  // Loaded on demand: jsPDF (and its optional html-rendering dependencies)
  // are only needed when the user actually asks for a PDF, so they're kept
  // out of the main bundle entirely.
  const { jsPDF } = await import('jspdf')
  const doc = new jsPDF({ unit: 'pt', format: 'a4' })
  const margin = 48
  let y = margin

  const isBonafide = report.prediction?.toLowerCase() === 'bonafide'
  const verdictColor = isBonafide ? [34, 197, 94] : [239, 68, 68]

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(18)
  doc.setTextColor(15, 23, 42)
  doc.text('PratiDhwani — Forensic Analysis Report', margin, y)
  y += 22

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.setTextColor(100, 116, 139)
  doc.text(`Generated: ${new Date(report.timestampIso).toLocaleString()}`, margin, y)
  y += 28

  // Verdict block
  doc.setFillColor(...verdictColor)
  doc.roundedRect(margin, y, 512, 56, 6, 6, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(20)
  doc.text((report.prediction || 'UNKNOWN').toUpperCase(), margin + 16, y + 34)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(11)
  doc.text(`Confidence: ${formatPercent(report.confidence)}`, margin + 260, y + 34)
  y += 80

  const section = (title, rows) => {
    doc.setTextColor(15, 23, 42)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(12)
    doc.text(title, margin, y)
    y += 6
    doc.setDrawColor(226, 232, 240)
    doc.line(margin, y, margin + 512, y)
    y += 18

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10.5)
    rows.forEach(([label, value]) => {
      doc.setTextColor(100, 116, 139)
      doc.text(label, margin, y)
      doc.setTextColor(15, 23, 42)
      doc.text(String(value), margin + 180, y)
      y += 20
    })
    y += 14
  }

  section('File Information', [
    ['File Name', report.fileName],
    ['File Size', formatFileSize(report.fileSize)],
    ['Duration', formatDurationPrecise(report.duration)],
    ['Sample Rate', formatSampleRate(report.sampleRate)],
    ['Channels', formatChannels(report.channels)],
    ['Bit Depth', formatBitDepth(report.bitDepth)],
  ])

  section('Prediction Results', [
    ['Prediction', (report.prediction || 'Unknown').toUpperCase()],
    ['Confidence', formatPercent(report.confidence)],
    ['Bonafide Probability', formatPercent(report.bonafide)],
    ['Spoof Probability', formatPercent(report.spoof)],
    ['Inference Time', report.inferenceTimeMs != null ? `${report.inferenceTimeMs} ms` : 'Not available'],
  ])

  section('System Information', [
    ['Model', report.modelName],
    ['Backend', report.backend],
    ['Timestamp', new Date(report.timestampIso).toLocaleString()],
  ])

  doc.setFontSize(9)
  doc.setTextColor(148, 163, 184)
  doc.text(
    'This report reflects a probabilistic model assessment and is not conclusive proof of authenticity.',
    margin,
    780
  )

  doc.save(`pratidhwani-report-${safeFilenameFragment(report.fileName)}.pdf`)
}
