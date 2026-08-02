import { useCallback, useRef, useState } from 'react'
import { UploadCloud, FileAudio, AlertCircle, CheckCircle2 } from 'lucide-react'
import { formatFileSize } from '../utils/formatters'

const ACCEPTED_TYPES = ['audio/wav', 'audio/x-wav', 'audio/flac', 'audio/x-flac']
const ACCEPTED_EXT = ['.wav', '.flac']
const SUCCESS_DELAY_MS = 420

function isAcceptedFile(file) {
  const ext = file.name.slice(file.name.lastIndexOf('.')).toLowerCase()
  return ACCEPTED_EXT.includes(ext) || ACCEPTED_TYPES.includes(file.type)
}

export default function UploadZone({ onFileSelected, disabled }) {
  const [isDragging, setIsDragging] = useState(false)
  const [validationError, setValidationError] = useState(null)
  const [shake, setShake] = useState(false)
  const [accepted, setAccepted] = useState(false)
  const inputRef = useRef(null)

  const triggerShake = () => {
    setShake(true)
    setTimeout(() => setShake(false), 420)
  }

  const handleFiles = useCallback(
    (fileList) => {
      const selected = fileList?.[0]
      if (!selected) return

      if (!isAcceptedFile(selected)) {
        setValidationError('Unsupported format. Please upload a .wav or .flac file.')
        triggerShake()
        return
      }

      setValidationError(null)
      setAccepted(true)
      // Let the success micro-animation play before handing off to the
      // analysis flow, so a valid drop always feels acknowledged.
      setTimeout(() => {
        onFileSelected(selected)
      }, SUCCESS_DELAY_MS)
    },
    [onFileSelected]
  )

  const onDrop = useCallback(
    (e) => {
      e.preventDefault()
      setIsDragging(false)
      if (disabled) return
      handleFiles(e.dataTransfer.files)
    },
    [handleFiles, disabled]
  )

  return (
    <div>
      <div
        role="button"
        tabIndex={0}
        aria-disabled={disabled}
        onClick={() => !disabled && !accepted && inputRef.current?.click()}
        onKeyDown={(e) => e.key === 'Enter' && !disabled && inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault()
          if (!disabled) setIsDragging(true)
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={onDrop}
        className={`group relative flex cursor-pointer flex-col items-center justify-center overflow-hidden rounded-2xl px-8 py-16 text-center transition-all duration-300 ${
          isDragging
            ? 'scale-[1.01] bg-primary/[0.06]'
            : accepted
              ? 'bg-success/[0.05]'
              : 'bg-card/40 hover:bg-card/60'
        } ${shake ? 'animate-shake' : ''} ${disabled && !accepted ? 'pointer-events-none opacity-50' : ''}`}
      >
        {/* Animated dashed border, color-reactive to state */}
        <svg className="pointer-events-none absolute inset-0 h-full w-full" aria-hidden="true">
          <rect
            x="1"
            y="1"
            width="calc(100% - 2px)"
            height="calc(100% - 2px)"
            rx="16"
            fill="none"
            className={`dropzone-border transition-colors duration-300 ${
              accepted
                ? 'stroke-success'
                : isDragging
                  ? 'stroke-primary'
                  : 'stroke-[rgba(255,255,255,0.14)] group-hover:stroke-primary/40'
            }`}
            strokeWidth="2"
          />
        </svg>

        <input
          ref={inputRef}
          type="file"
          accept=".wav,.flac,audio/wav,audio/flac"
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />

        {accepted ? (
          <div className="animate-successPop flex h-16 w-16 items-center justify-center rounded-full border border-success/40 bg-success/10">
            <CheckCircle2 className="h-7 w-7 text-success" strokeWidth={1.75} />
          </div>
        ) : (
          <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-full border border-line bg-bg transition-transform duration-300 group-hover:scale-105 group-hover:border-primary/30">
            {isDragging ? (
              <FileAudio className="h-7 w-7 text-primary" strokeWidth={1.75} />
            ) : (
              <UploadCloud className="h-7 w-7 text-muted transition-colors group-hover:text-primary" strokeWidth={1.75} />
            )}
          </div>
        )}

        <p className="mt-5 text-[15px] font-medium text-ink">
          {accepted ? 'Recording accepted' : isDragging ? 'Release to analyze' : 'Drag and drop a recording'}
        </p>
        <p className="mt-1.5 text-[13px] text-muted">
          {accepted ? 'Handing off to the inference engine…' : 'or click to browse your files'}
        </p>

        {!accepted && (
          <p className="mt-6 font-mono text-[11px] uppercase tracking-wider text-muted">
            Supports .wav · .flac
          </p>
        )}
      </div>

      {validationError && (
        <div className="animate-fadeUp mt-3 flex items-center gap-2 rounded-lg border border-danger/30 bg-danger/10 px-4 py-2.5 text-[13px] text-danger">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {validationError}
        </div>
      )}
    </div>
  )
}

export function SelectedFileBar({ file, onClear }) {
  if (!file) return null
  return (
    <div className="flex items-center justify-between rounded-xl border border-line bg-card/60 px-4 py-3 transition-colors hover:border-primary/20">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
          <FileAudio className="h-4 w-4 text-primary" />
        </div>
        <div>
          <p className="text-[13px] font-medium text-ink">{file.name}</p>
          <p className="font-mono text-[11px] text-muted">{formatFileSize(file.size)}</p>
        </div>
      </div>
      <button
        onClick={onClear}
        className="rounded-md px-2 py-1 text-[12px] text-muted transition-colors hover:bg-line hover:text-ink"
      >
        Remove
      </button>
    </div>
  )
}
