import { Menu, Search } from 'lucide-react'
import { useLocation } from 'react-router-dom'
import { appRoutes } from '../lib/routes'
import { useWorkspaceState } from '../lib/workspace'

interface HeaderProps {
  onMenuClick: () => void
  onCommandPaletteOpen: () => void
  commandShortcutLabel: string
}

const routeMeta: Record<string, { title: string; subtitle: string }> = {
  [appRoutes.dashboard]: {
    title: 'Dashboard',
    subtitle: 'Operational and financial pulse',
  },
  [appRoutes.clients]: {
    title: 'Clients',
    subtitle: 'Customer accounts and active relationships',
  },
  [appRoutes.missions]: {
    title: 'Missions',
    subtitle: 'Planned, active, and delivered operations',
  },
  [appRoutes.expenses]: {
    title: 'Expenses',
    subtitle: 'Operational costs and reimbursement control',
  },
  [appRoutes.invoices]: {
    title: 'Invoices',
    subtitle: 'Billing follow-up and outstanding cash',
  },
  [appRoutes.settings]: {
    title: 'Settings',
    subtitle: 'Workspace visibility and environment status',
  },
}

export function Header({
  onMenuClick,
  onCommandPaletteOpen,
  commandShortcutLabel,
}: HeaderProps) {
  const location = useLocation()
  const { organization, profile } = useWorkspaceState()
  const meta = routeMeta[location.pathname] ?? routeMeta[appRoutes.dashboard]

  return (
    <header className="sticky top-0 z-20 border-b border-stone-200/80 bg-[#f6f2eb]/86 backdrop-blur">
      <div className="mx-auto flex max-w-[1560px] items-center justify-between gap-4 px-5 py-4 sm:px-6 lg:px-8">
        <div className="flex min-w-0 items-center gap-3">
          <button
            type="button"
            onClick={onMenuClick}
            className="rounded-[1rem] border border-stone-300 bg-white/90 p-2 text-stone-700 shadow-sm transition hover:border-stone-400 md:hidden"
            aria-label="Toggle navigation"
          >
            <Menu className="h-5 w-5" />
          </button>

          <div className="min-w-0">
            <span className="eyebrow-chip">
              {organization?.slug ?? 'workspace'}
            </span>
            <h1 className="mt-3 truncate font-heading text-[2rem] font-semibold tracking-tight text-stone-950">
              {meta.title}
            </h1>
            <p className="mt-1 truncate text-sm text-stone-500">{meta.subtitle}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onCommandPaletteOpen}
            className="inline-flex items-center gap-3 rounded-[1.15rem] border border-stone-200 bg-white/88 px-3.5 py-3 text-left text-sm text-stone-600 shadow-sm transition hover:border-stone-300 hover:text-stone-900"
            aria-label="Open command palette"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-[0.95rem] bg-stone-100 text-stone-700">
              <Search className="h-4 w-4" />
            </div>
            <div className="hidden min-w-0 sm:block">
              <p className="text-sm font-medium text-stone-900">Search, jump, or create</p>
              <p className="mt-0.5 text-xs text-stone-500">Command palette</p>
            </div>
            <span className="hidden rounded-full border border-stone-200 bg-stone-50 px-2.5 py-1 text-[11px] font-medium uppercase tracking-[0.16em] text-stone-500 lg:inline-flex">
              {commandShortcutLabel}
            </span>
          </button>

          <div className="hidden min-w-[220px] rounded-[1.25rem] border border-stone-200 bg-white/82 px-4 py-3 text-right shadow-sm sm:block">
            <p className="text-sm font-semibold text-stone-900">
              {profile?.name ?? 'Workspace user'}
            </p>
            <p className="mt-1 text-[11px] uppercase tracking-[0.18em] text-stone-500">
              {organization?.name ?? 'Organization'}
            </p>
          </div>
        </div>
      </div>
    </header>
  )
}
