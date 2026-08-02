import { useEffect, useRef, useState } from 'react'
import { AudioLines, Menu, X, ChevronDown } from 'lucide-react'
import { useBackendHealth } from '../hooks/useBackendHealth'
import { useScrollSpy } from '../hooks/useScrollSpy'

const NAV_LINKS = [
  { id: 'overview', label: 'Overview' },
  { id: 'analyze', label: 'Analyze' },
  { id: 'model', label: 'Model' },
  { id: 'history', label: 'History' },
]

const NAV_IDS = NAV_LINKS.map((l) => l.id)

function formatLastChecked(date) {
  if (!date) return 'Never'
  return new Intl.DateTimeFormat('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }).format(date)
}

function HealthRow({ label, value }) {
  return (
    <div className="flex items-center justify-between py-1.5">
      <span className="text-[12px] text-muted">{label}</span>
      <span className="font-mono text-[12px] text-ink">{value}</span>
    </div>
  )
}

function StatusBadge() {
  const health = useBackendHealth(30000)
  const [open, setOpen] = useState(false)
  const containerRef = useRef(null)

  const { online, modelLoaded, device, latencyMs, lastChecked } = health

  const statusLabel = online === null ? 'Checking' : online ? 'Backend Online' : 'Backend Offline'
  const dotColor = online === null ? 'bg-warning' : online ? 'bg-success' : 'bg-danger'
  const ringColor =
    online === null ? 'ring-warning/20' : online ? 'ring-success/20' : 'ring-danger/20'

  useEffect(() => {
    if (!open) return undefined
    const onClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) setOpen(false)
    }
    const onKey = (e) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onClickOutside)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onClickOutside)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="true"
        aria-label={`${statusLabel}. Click for backend health details.`}
        className={`flex items-center gap-2 rounded-full border border-line bg-card/60 px-3 py-1.5 ring-1 ${ringColor} transition-colors duration-300 hover:border-primary/30`}
      >
        <span className="relative flex h-2 w-2">
          <span
            className={`absolute inline-flex h-full w-full animate-ping rounded-full ${dotColor} opacity-60`}
          />
          <span className={`relative inline-flex h-2 w-2 rounded-full ${dotColor}`} />
        </span>
        <span className="font-mono text-[11px] uppercase tracking-wider text-muted">
          {statusLabel}
        </span>
        <ChevronDown
          className={`h-3 w-3 text-muted transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
          aria-hidden="true"
        />
      </button>

      {open && (
        <div
          role="region"
          aria-label="Backend health details"
          className="animate-fadeUp absolute right-0 top-[calc(100%+8px)] z-50 w-64 rounded-xl border border-line bg-card p-4 shadow-soft"
        >
          <p className="mb-2 font-mono text-[10px] uppercase tracking-wider text-muted">
            Backend Health
          </p>
          <div className="flex flex-col divide-y divide-line">
            <HealthRow label="Backend" value={online ? 'Online' : online === null ? 'Checking…' : 'Offline'} />
            <HealthRow label="Model Loaded" value={modelLoaded === null ? 'Not reported' : modelLoaded ? 'Yes' : 'No'} />
            <HealthRow label="Device" value={device || 'Not reported'} />
            <HealthRow label="API Latency" value={latencyMs != null ? `${latencyMs} ms` : '—'} />
            <HealthRow label="Last Check" value={formatLastChecked(lastChecked)} />
          </div>
          <p className="mt-3 text-[10px] leading-relaxed text-muted/70">
            Refreshes automatically every 30 seconds.
          </p>
        </div>
      )}
    </div>
  )
}

function NavLink({ id, label, isActive }) {
  const handleClick = (e) => {
    e.preventDefault()
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <a
      href={`#${id}`}
      onClick={handleClick}
      aria-current={isActive ? 'true' : undefined}
      className={`group relative px-1 py-2 text-[13px] font-medium transition-colors duration-200 ${
        isActive ? 'text-ink' : 'text-muted hover:text-ink'
      }`}
    >
      {label}
      <span
        className={`absolute -bottom-[1px] left-0 h-[2px] w-full origin-left scale-x-0 rounded-full bg-primary shadow-[0_0_8px_rgba(37,99,235,0.8)] transition-transform duration-300 ease-out ${
          isActive ? 'scale-x-100' : 'group-hover:scale-x-100 group-hover:opacity-50'
        }`}
      />
    </a>
  )
}

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const activeId = useScrollSpy(NAV_IDS)

  return (
    <header className="sticky top-0 z-50 border-b border-line glass">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/15 ring-1 ring-primary/30 transition-shadow duration-300 hover:shadow-glow">
            <AudioLines className="h-5 w-5 text-primary" strokeWidth={2.25} aria-hidden="true" />
          </div>
          <div className="leading-tight">
            <p className="font-display text-[15px] font-semibold tracking-tight text-ink">
              PratiDhwani
            </p>
            <p className="text-[11px] text-muted">Audio Forensics Lab</p>
          </div>
        </div>

        <nav className="hidden items-center gap-7 md:flex" aria-label="Primary">
          {NAV_LINKS.map((link) => (
            <NavLink key={link.id} {...link} isActive={activeId === link.id} />
          ))}
        </nav>

        <div className="hidden md:block">
          <StatusBadge />
        </div>

        <button
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-line text-muted transition-colors hover:text-ink md:hidden"
          onClick={() => setMobileOpen((v) => !v)}
          aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={mobileOpen}
          aria-controls="mobile-nav"
        >
          {mobileOpen ? <X className="h-4 w-4" aria-hidden="true" /> : <Menu className="h-4 w-4" aria-hidden="true" />}
        </button>
      </div>

      <div
        id="mobile-nav"
        className={`overflow-hidden border-t border-line transition-[max-height,opacity] duration-300 ease-out md:hidden ${
          mobileOpen ? 'max-h-80 opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="flex flex-col gap-1 px-6 py-4">
          {NAV_LINKS.map((link) => (
            <a
              key={link.id}
              href={`#${link.id}`}
              onClick={(e) => {
                e.preventDefault()
                document.getElementById(link.id)?.scrollIntoView({ behavior: 'smooth' })
                setMobileOpen(false)
              }}
              className={`rounded-lg px-3 py-2.5 text-[14px] transition-colors ${
                activeId === link.id
                  ? 'bg-primary/10 text-ink'
                  : 'text-muted hover:bg-card/60 hover:text-ink'
              }`}
            >
              {link.label}
            </a>
          ))}
          <div className="mt-2 px-1">
            <StatusBadge />
          </div>
        </div>
      </div>
    </header>
  )
}
