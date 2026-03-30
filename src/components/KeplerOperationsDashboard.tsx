import { type ReactNode, useEffect, useRef, useState } from 'react'
import {
  ChevronDown,
  Eye,
  Pencil,
  Plus,
  Search,
  Settings2,
  Upload,
} from 'lucide-react'

type OperationStatus = 'FINI' | 'EN COURS' | 'ANNULÉ'

interface KpiItem {
  label: string
  value: string
  detail: string
}

interface OperationItem {
  id: string
  date: string
  client: string
  status: OperationStatus
  amount: string
}

const kpis: KpiItem[] = [
  {
    label: 'TOTAL OPÉRATIONS',
    value: '1,254',
    detail: '+5% vs last month',
  },
  {
    label: 'LIVRAISONS ACTIVES',
    value: '45',
    detail: 'En cours...',
  },
  {
    label: 'CA DU MOIS',
    value: '12,500 €',
    detail: 'Objectif 80%',
  },
]

const operations: OperationItem[] = [
  {
    id: '#001',
    date: '12 Mai',
    client: 'Client A',
    status: 'FINI',
    amount: '1500 €',
  },
  {
    id: '#002',
    date: '11 Mai',
    client: 'Client B',
    status: 'EN COURS',
    amount: '2200 €',
  },
  {
    id: '#003',
    date: '10 Mai',
    client: 'Client C',
    status: 'ANNULÉ',
    amount: '850 €',
  },
  {
    id: '#004',
    date: '10 Mai',
    client: 'Client D',
    status: 'FINI',
    amount: '1900 €',
  },
]

const exportOptions = ['PDF', 'EXCEL'] as const

const statusStyles: Record<OperationStatus, string> = {
  FINI: 'bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-100',
  'EN COURS': 'bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-100',
  ANNULÉ: 'bg-rose-50 text-rose-700 ring-1 ring-inset ring-rose-100',
}

function LogoMark() {
  return (
    <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-zinc-200 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
      <div className="grid grid-cols-2 gap-1.5">
        <span className="h-2.5 w-2.5 rounded-[4px] bg-zinc-950" />
        <span className="h-2.5 w-2.5 rounded-[4px] bg-zinc-300" />
        <span className="h-2.5 w-2.5 rounded-[4px] bg-zinc-200" />
        <span className="h-2.5 w-2.5 rounded-[4px] border border-zinc-300 bg-transparent" />
      </div>
    </div>
  )
}

function ActionIconButton({
  label,
  children,
}: {
  label: string
  children: ReactNode
}) {
  return (
    <button
      type="button"
      aria-label={label}
      className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-transparent text-zinc-500 transition-colors hover:border-zinc-200 hover:bg-white hover:text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900/10"
    >
      {children}
    </button>
  )
}

export default function KeplerOperationsDashboard() {
  const [isExportOpen, setIsExportOpen] = useState(false)
  const exportMenuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (!exportMenuRef.current?.contains(event.target as Node)) {
        setIsExportOpen(false)
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsExportOpen(false)
      }
    }

    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('keydown', handleEscape)

    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [])

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-zinc-950 [font-family:Inter,Geist,ui-sans-serif,system-ui,sans-serif]">
      <header className="border-b border-zinc-200/80 bg-white">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3.5">
            <LogoMark />
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-zinc-900">
                KEPLER EXPRESS OPS
              </p>
              <p className="text-xs text-zinc-500">Espace opérationnel</p>
            </div>
          </div>

          <div className="hidden items-center rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1.5 text-xs font-medium text-zinc-500 md:inline-flex">
            Outil interne
          </div>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {kpis.map((item) => (
            <article
              key={item.label}
              className="rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)] sm:p-6"
            >
              <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-zinc-500">
                {item.label}
              </p>
              <p className="mt-4 text-[2rem] font-semibold tracking-[-0.04em] text-zinc-950">
                {item.value}
              </p>
              <p className="mt-3 text-sm text-zinc-500">{item.detail}</p>
            </article>
          ))}
        </section>

        <section className="rounded-2xl border border-zinc-200/80 bg-white p-4 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
          <div className="grid gap-4 lg:grid-cols-[auto,minmax(0,1fr),auto] lg:items-center">
            <button
              type="button"
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-zinc-950 px-4 text-sm font-medium uppercase tracking-[0.08em] text-white transition-colors hover:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-900/10"
            >
              <Plus className="h-4 w-4" />
              <span>Nouvelle opération</span>
            </button>

            <div className="relative w-full lg:max-w-xl lg:justify-self-center">
              <label htmlFor="kepler-operations-search" className="sr-only">
                Rechercher une opération
              </label>
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
              <input
                id="kepler-operations-search"
                type="search"
                placeholder="RECHERCHE..."
                className="h-11 w-full rounded-xl border border-zinc-200 bg-white pl-10 pr-4 text-sm text-zinc-900 outline-none transition-colors placeholder:text-zinc-400 focus:border-zinc-300 focus:ring-2 focus:ring-zinc-900/5"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2 lg:justify-self-end">
              <div className="relative" ref={exportMenuRef}>
                <button
                  type="button"
                  aria-expanded={isExportOpen}
                  aria-haspopup="menu"
                  onClick={() => setIsExportOpen((open) => !open)}
                  className="inline-flex h-11 items-center gap-2 rounded-xl bg-zinc-900 px-4 text-sm font-medium uppercase tracking-[0.08em] text-white transition-colors hover:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-900/10"
                >
                  <Upload className="h-4 w-4" />
                  <span>Exporter</span>
                  <ChevronDown
                    className={`h-4 w-4 transition-transform ${
                      isExportOpen ? 'rotate-180' : ''
                    }`}
                  />
                </button>

                {isExportOpen && (
                  <div
                    role="menu"
                    className="absolute right-0 top-[calc(100%+0.5rem)] z-20 w-36 rounded-xl border border-zinc-200 bg-white p-1.5 shadow-[0_12px_30px_rgba(15,23,42,0.08)]"
                  >
                    {exportOptions.map((option) => (
                      <button
                        key={option}
                        type="button"
                        role="menuitem"
                        onClick={() => setIsExportOpen(false)}
                        className="flex w-full items-center rounded-lg px-3 py-2 text-left text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 hover:text-zinc-950 focus:outline-none focus:bg-zinc-50"
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <button
                type="button"
                aria-label="Ouvrir les réglages"
                className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-zinc-200 bg-white text-zinc-600 transition-colors hover:bg-zinc-50 hover:text-zinc-950 focus:outline-none focus:ring-2 focus:ring-zinc-900/10"
              >
                <Settings2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        </section>

        <section className="overflow-hidden rounded-2xl border border-zinc-200/80 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
          <div className="flex items-center justify-between border-b border-zinc-200/80 px-5 py-4 sm:px-6">
            <div>
              <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-zinc-900">
                OPÉRATIONS / ACTIVITÉ
              </h2>
              <p className="mt-1 text-sm text-zinc-500">Vue consolidée des opérations récentes</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-[760px] w-full border-separate border-spacing-0">
              <thead>
                <tr className="bg-white">
                  <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.16em] text-zinc-500 sm:px-6">
                    ID
                  </th>
                  <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.16em] text-zinc-500 sm:px-6">
                    DATE
                  </th>
                  <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.16em] text-zinc-500 sm:px-6">
                    CLIENT
                  </th>
                  <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.16em] text-zinc-500 sm:px-6">
                    STATUT
                  </th>
                  <th className="px-5 py-3 text-right text-[11px] font-semibold uppercase tracking-[0.16em] text-zinc-500 sm:px-6">
                    MONTANT
                  </th>
                  <th className="px-5 py-3 text-right text-[11px] font-semibold uppercase tracking-[0.16em] text-zinc-500 sm:px-6">
                    ACTIONS
                  </th>
                </tr>
              </thead>

              <tbody>
                {operations.map((operation) => (
                  <tr key={operation.id} className="transition-colors hover:bg-zinc-50/70">
                    <td className="border-t border-zinc-100 px-5 py-4 text-sm font-medium text-zinc-900 sm:px-6">
                      {operation.id}
                    </td>
                    <td className="border-t border-zinc-100 px-5 py-4 text-sm text-zinc-600 sm:px-6">
                      {operation.date}
                    </td>
                    <td className="border-t border-zinc-100 px-5 py-4 text-sm text-zinc-900 sm:px-6">
                      {operation.client}
                    </td>
                    <td className="border-t border-zinc-100 px-5 py-4 sm:px-6">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] ${statusStyles[operation.status]}`}
                      >
                        {operation.status}
                      </span>
                    </td>
                    <td className="border-t border-zinc-100 px-5 py-4 text-right text-sm font-medium text-zinc-900 sm:px-6">
                      {operation.amount}
                    </td>
                    <td className="border-t border-zinc-100 px-5 py-4 sm:px-6">
                      <div className="flex justify-end gap-2">
                        <ActionIconButton label={`Voir ${operation.id}`}>
                          <Eye className="h-4 w-4" />
                        </ActionIconButton>
                        <ActionIconButton label={`Modifier ${operation.id}`}>
                          <Pencil className="h-4 w-4" />
                        </ActionIconButton>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  )
}
