import { useState } from 'react'
import { AudioLines, Menu, X } from 'lucide-react'
import { useBackendStatus } from '../hooks/useBackendStatus'
import { useScrollSpy } from '../hooks/useScrollSpy'

const NAV_LINKS = [
  { id: 'overview', label: 'Overview' },
  { id: 'analyze', label: 'Analyze' },
  { id: 'model', label: 'Model' },
  { id: 'history', label: 'History' },
]

const NAV_IDS = NAV_LINKS.map((l) => l.id)

function StatusBadge() {
  const online = useBackendStatus()

  const statusLabel = online === null ? 'Checking' : online ? 'Engine Online' : 'Engine Offline'
  const dotColor = online === null ? 'bg-warning' : online ? 'bg-success' : 'bg-danger'
  const ringColor =
    online === null ? 'ring-warning/20' : online ? 'ring-success/20' : 'ring-danger/20'

  return (
    <div
      className={`flex items-center gap-2 rounded-full border border-line bg-card/60 px-3 py-1.5 ring-1 ${ringColor} transition-colors duration-300`}
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
            <AudioLines className="h-5 w-5 text-primary" strokeWidth={2.25} />
          </div>
          <div className="leading-tight">
            <p className="font-display text-[15px] font-semibold tracking-tight text-ink">
              PratiDhwani
            </p>
            <p className="text-[11px] text-muted">Audio Forensics Lab</p>
          </div>
        </div>

        <nav className="hidden items-center gap-7 md:flex">
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
          aria-label="Toggle menu"
          aria-expanded={mobileOpen}
        >
          {mobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
        </button>
      </div>

      <div
        className={`overflow-hidden border-t border-line transition-[max-height,opacity] duration-300 ease-out md:hidden ${
          mobileOpen ? 'max-h-64 opacity-100' : 'max-h-0 opacity-0'
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
