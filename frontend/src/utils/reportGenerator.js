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
 * elsewhere in the app (prediction result, file, metadata, and the
 * heuristic forensic explanation). Pure data — no network calls, no
 * fabricated fields. `forensicExplanation` is expected to already be
 * computed (e.g. via generateForensicExplanation) so the on-screen card and
 * the exported report always agree.
 */
export function buildReportData({
  file,
  result,
  metadata,
  inferenceTimeMs,
  timestampIso,
  forensicExplanation,
}) {
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
    forensicExplanation: forensicExplanation ?? null,
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

const PAGE_HEIGHT = 842
const BOTTOM_MARGIN = 60

export async function downloadReportAsPDF(report) {
  // Loaded on demand: jsPDF (and its optional html-rendering dependencies)
  // are only needed when the user actually asks for a PDF, so they're kept
  // out of the main bundle entirely.
  const { jsPDF } = await import('jspdf')
  const doc = new jsPDF({ unit: 'pt', format: 'a4' })
  const margin = 48
  const contentWidth = 512
  let y = margin

  const ensureSpace = (needed) => {
    if (y + needed > PAGE_HEIGHT - BOTTOM_MARGIN) {
      doc.addPage()
      y = margin
    }
  }

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
  ensureSpace(80)
  doc.setFillColor(...verdictColor)
  doc.roundedRect(margin, y, contentWidth, 56, 6, 6, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(20)
  doc.text((report.prediction || 'UNKNOWN').toUpperCase(), margin + 16, y + 34)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(11)
  doc.text(`Confidence: ${formatPercent(report.confidence)}`, margin + 260, y + 34)
  y += 80

  const section = (title, rows) => {
    ensureSpace(40 + rows.length * 20)
    doc.setTextColor(15, 23, 42)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(12)
    doc.text(title, margin, y)
    y += 6
    doc.setDrawColor(226, 232, 240)
    doc.line(margin, y, margin + contentWidth, y)
    y += 18

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10.5)
    rows.forEach(([label, value]) => {
      ensureSpace(20)
      doc.setTextColor(100, 116, 139)
      doc.text(label, margin, y)
      doc.setTextColor(15, 23, 42)
      doc.text(String(value), margin + 180, y)
      y += 20
    })
    y += 14
  }

  const paragraph = (text, fontSize = 10) => {
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(fontSize)
    doc.setTextColor(71, 85, 105)
    const lines = doc.splitTextToSize(text, contentWidth)
    ensureSpace(lines.length * 14 + 6)
    lines.forEach((line) => {
      doc.text(line, margin, y)
      y += 14
    })
    y += 8
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

  // --- Forensic Explanation (heuristic, non-model-output layer) ----------
  const fx = report.forensicExplanation
  if (fx) {
    ensureSpace(40)
    doc.setTextColor(15, 23, 42)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(12)
    doc.text('Forensic Explanation', margin, y)
    y += 6
    doc.setDrawColor(226, 232, 240)
    doc.line(margin, y, margin + contentWidth, y)
    y += 16

    paragraph(
      'The following is a heuristic explanation layer derived from confidence and recording metadata. It is not a direct output of the neural network.',
      9
    )

    section('Explanation Summary', [
      ['Confidence Class', fx.classification],
      ['Prediction Reliability', fx.reliability],
      ['Recording Quality', fx.audioQuality?.label ?? 'Unknown'],
    ])

    paragraph(fx.summary, 10.5)

    ensureSpace(20)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(11)
    doc.setTextColor(15, 23, 42)
    doc.text('Supporting Indicators', margin, y)
    y += 18

    fx.indicators?.forEach((indicator) => {
      ensureSpace(32)
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(10)
      doc.setTextColor(15, 23, 42)
      doc.text(`\u2022 ${indicator.title}`, margin, y)
      y += 14
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(9.5)
      doc.setTextColor(100, 116, 139)
      const lines = doc.splitTextToSize(indicator.description, contentWidth - 14)
      lines.forEach((line) => {
        ensureSpace(13)
        doc.text(line, margin + 14, y)
        y += 13
      })
      y += 6
    })

    y += 6
    ensureSpace(20)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(10.5)
    doc.setTextColor(15, 23, 42)
    doc.text('Forensic Notes', margin, y)
    y += 16
    paragraph(fx.notes, 9.5)
  }

  ensureSpace(20)
  doc.setFontSize(9)
  doc.setTextColor(148, 163, 184)
  doc.text(
    'This report reflects a probabilistic model assessment and is not conclusive proof of authenticity.',
    margin,
    y
  )

  doc.save(`pratidhwani-report-${safeFilenameFragment(report.fileName)}.pdf`)
}
