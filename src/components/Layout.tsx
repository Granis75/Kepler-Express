import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import {
  BarChart3,
  FileText,
  Plus,
  Receipt,
  Search,
  Settings,
  Truck,
  Users,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Header } from './Header'
import { Sidebar } from './Sidebar'
import { appRoutes } from '../lib/routes'

interface LayoutProps {
  children: ReactNode
}

interface CommandItem {
  id: string
  label: string
  description: string
  shortcut?: string
  icon: LucideIcon
  keywords: string[]
  run: () => void
}

function isTypingTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) {
    return false
  }

  const tagName = target.tagName.toLowerCase()
  return (
    target.isContentEditable ||
    tagName === 'input' ||
    tagName === 'textarea' ||
    tagName === 'select'
  )
}

export function Layout({ children }: LayoutProps) {
  const navigate = useNavigate()
  const location = useLocation()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false)
  const [commandQuery, setCommandQuery] = useState('')
  const [selectedCommandIndex, setSelectedCommandIndex] = useState(0)
  const commandInputRef = useRef<HTMLInputElement | null>(null)
  const commandItemRefs = useRef<Array<HTMLButtonElement | null>>([])
  const gotoTimeoutRef = useRef<number | null>(null)
  const awaitingGotoRef = useRef(false)
  const commandShortcutLabel =
    typeof navigator !== 'undefined' && /(Mac|iPhone|iPad|iPod)/i.test(navigator.platform)
      ? 'Cmd K'
      : 'Ctrl K'

  const openCommandPalette = () => {
    setSidebarOpen(false)
    setCommandQuery('')
    setSelectedCommandIndex(0)
    setCommandPaletteOpen(true)
  }

  const closeCommandPalette = () => {
    setCommandPaletteOpen(false)
    setCommandQuery('')
    setSelectedCommandIndex(0)
  }

  const focusPageSearch = () => {
    const searchInput = document.querySelector<HTMLInputElement>('[data-ops-search="true"]')
    if (!searchInput) {
      return
    }

    searchInput.focus()
    searchInput.select()
  }

  const navigateTo = (pathname: string, search?: string) => {
    setSidebarOpen(false)
    closeCommandPalette()

    if (search) {
      navigate({ pathname, search })
      return
    }

    navigate(pathname)
  }

  // Future command system hook placeholder: route high-frequency operator actions here.
  const commandItems = useMemo<CommandItem[]>(
    () => [
      {
        id: 'nav-dashboard',
        label: 'Go to Dashboard',
        description: 'Operational and financial pulse',
        shortcut: 'G D',
        icon: BarChart3,
        keywords: ['dashboard', 'home', 'overview', 'pulse'],
        run: () => navigateTo(appRoutes.dashboard),
      },
      {
        id: 'nav-clients',
        label: 'Go to Clients',
        description: 'Accounts and relationship context',
        shortcut: 'G C',
        icon: Users,
        keywords: ['clients', 'accounts', 'customers'],
        run: () => navigateTo(appRoutes.clients),
      },
      {
        id: 'nav-missions',
        label: 'Go to Missions',
        description: 'Active and planned operations queue',
        shortcut: 'G M',
        icon: Truck,
        keywords: ['missions', 'operations', 'queue'],
        run: () => navigateTo(appRoutes.missions),
      },
      {
        id: 'nav-assignments',
        label: 'Go to Assignments',
        description: 'Derived driver workload and margin visibility',
        shortcut: 'G A',
        icon: BarChart3,
        keywords: ['assignments', 'drivers', 'workload', 'margin'],
        run: () => navigateTo(appRoutes.assignments),
      },
      {
        id: 'nav-expenses',
        label: 'Go to Expenses',
        description: 'Approvals, receipts, and cost control',
        shortcut: 'G E',
        icon: Receipt,
        keywords: ['expenses', 'costs', 'approvals'],
        run: () => navigateTo(appRoutes.expenses),
      },
      {
        id: 'nav-invoices',
        label: 'Go to Invoices',
        description: 'Billing and collection follow-up',
        shortcut: 'G I',
        icon: FileText,
        keywords: ['invoices', 'billing', 'collections'],
        run: () => navigateTo(appRoutes.invoices),
      },
      {
        id: 'nav-settings',
        label: 'Go to Settings',
        description: 'Workspace visibility and environment',
        shortcut: 'G S',
        icon: Settings,
        keywords: ['settings', 'workspace', 'environment'],
        run: () => navigateTo(appRoutes.settings),
      },
      {
        id: 'create-mission',
        label: 'Create mission',
        description: 'Open the mission editor from anywhere',
        icon: Plus,
        keywords: ['create', 'new', 'mission', 'plan'],
        run: () =>
          navigateTo(appRoutes.missions, new URLSearchParams({ compose: 'new' }).toString()),
      },
      {
        id: 'create-invoice',
        label: 'Create invoice',
        description: 'Open the invoice editor from anywhere',
        icon: Plus,
        keywords: ['create', 'new', 'invoice', 'billing'],
        run: () =>
          navigateTo(appRoutes.invoices, new URLSearchParams({ compose: 'new' }).toString()),
      },
    ],
    [navigate]
  )

  const filteredCommands = useMemo(() => {
    const query = commandQuery.trim().toLowerCase()

    if (!query) {
      return commandItems
    }

    return commandItems.filter((item) =>
      [item.label, item.description, item.shortcut, ...item.keywords]
        .filter(Boolean)
        .some((value) => value?.toLowerCase().includes(query))
    )
  }, [commandItems, commandQuery])

  useEffect(() => {
    if (!commandPaletteOpen) {
      return
    }

    const frame = window.requestAnimationFrame(() => {
      commandInputRef.current?.focus()
      commandInputRef.current?.select()
    })

    return () => window.cancelAnimationFrame(frame)
  }, [commandPaletteOpen])

  useEffect(() => {
    closeCommandPalette()
  }, [location.pathname, location.search])

  useEffect(() => {
    if (!commandPaletteOpen) {
      return
    }

    setSelectedCommandIndex((current) => {
      if (filteredCommands.length === 0) {
        return 0
      }

      return Math.min(current, filteredCommands.length - 1)
    })
  }, [commandPaletteOpen, filteredCommands.length])

  useEffect(() => {
    if (!commandPaletteOpen) {
      return
    }

    const activeNode = commandItemRefs.current[selectedCommandIndex]
    activeNode?.scrollIntoView({ block: 'nearest' })
  }, [commandPaletteOpen, selectedCommandIndex])

  useEffect(() => {
    const resetGoto = () => {
      awaitingGotoRef.current = false
      if (gotoTimeoutRef.current) {
        window.clearTimeout(gotoTimeoutRef.current)
        gotoTimeoutRef.current = null
      }
    }

    const handleGoto = (key: string) => {
      const nextKey = key.toLowerCase()

      if (nextKey === 'd') {
        navigateTo(appRoutes.dashboard)
        return true
      }

      if (nextKey === 'c') {
        navigateTo(appRoutes.clients)
        return true
      }

      if (nextKey === 'm') {
        navigateTo(appRoutes.missions)
        return true
      }

      if (nextKey === 'a') {
        navigateTo(appRoutes.assignments)
        return true
      }

      if (nextKey === 'e') {
        navigateTo(appRoutes.expenses)
        return true
      }

      if (nextKey === 'i') {
        navigateTo(appRoutes.invoices)
        return true
      }

      if (nextKey === 's') {
        navigateTo(appRoutes.settings)
        return true
      }

      return false
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        if (commandPaletteOpen) {
          closeCommandPalette()
        } else {
          openCommandPalette()
        }
        resetGoto()
        return
      }

      if (commandPaletteOpen) {
        if (event.key === 'Escape') {
          event.preventDefault()
          closeCommandPalette()
        }
        return
      }

      if (isTypingTarget(event.target)) {
        return
      }

      if (event.key === '/') {
        const searchInput = document.querySelector<HTMLInputElement>('[data-ops-search="true"]')
        if (searchInput) {
          event.preventDefault()
          focusPageSearch()
        }
        resetGoto()
        return
      }

      if (awaitingGotoRef.current) {
        const didNavigate = handleGoto(event.key)
        resetGoto()
        if (didNavigate) {
          event.preventDefault()
        }
        return
      }

      if (!event.metaKey && !event.ctrlKey && !event.altKey && event.key.toLowerCase() === 'g') {
        event.preventDefault()
        awaitingGotoRef.current = true
        gotoTimeoutRef.current = window.setTimeout(() => {
          awaitingGotoRef.current = false
          gotoTimeoutRef.current = null
        }, 1200)
      }
    }

    window.addEventListener('keydown', handleKeyDown)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      resetGoto()
    }
  }, [commandPaletteOpen, location.pathname, location.search, navigate])

  return (
    <div className="flex min-h-screen bg-[radial-gradient(circle_at_top,_rgba(15,118,110,0.07),_transparent_18%),linear-gradient(180deg,_#faf8f3_0%,_#f4efe8_100%)] text-stone-900">
      <aside className="hidden border-r border-stone-200/80 bg-[#f7f2eb]/88 backdrop-blur md:sticky md:top-0 md:flex md:h-screen md:w-[292px] md:flex-col">
        <Sidebar onClose={() => setSidebarOpen(false)} />
      </aside>

      {sidebarOpen ? (
        <div
          className="fixed inset-0 z-40 bg-stone-950/40 backdrop-blur-sm md:hidden"
          onClick={() => setSidebarOpen(false)}
        >
          <div
            className="h-full w-[312px] border-r border-stone-200 bg-[#f7f2eb]"
            onClick={(event) => event.stopPropagation()}
          >
            <Sidebar onClose={() => setSidebarOpen(false)} />
          </div>
        </div>
      ) : null}

      <div className="flex min-w-0 flex-1 flex-col">
        <Header
          onMenuClick={() => setSidebarOpen((current) => !current)}
          onCommandPaletteOpen={openCommandPalette}
          commandShortcutLabel={commandShortcutLabel}
        />
        <main className="flex-1 overflow-y-auto pb-6">{children}</main>
      </div>

      {commandPaletteOpen ? (
        <div
          className="fixed inset-0 z-50 bg-stone-950/28 px-4 py-8 backdrop-blur-sm"
          onClick={closeCommandPalette}
        >
          <div
            className="mx-auto mt-[8vh] w-full max-w-2xl overflow-hidden rounded-[1.75rem] border border-stone-200/90 bg-[#fcfaf6] shadow-[0_30px_90px_rgba(28,25,23,0.18)]"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="border-b border-stone-200 px-5 py-4">
              <div className="flex items-center gap-3 rounded-[1.15rem] border border-stone-200 bg-white px-4 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.65)]">
                <Search className="h-4 w-4 text-stone-400" />
                <input
                  ref={commandInputRef}
                  type="text"
                  value={commandQuery}
                  onChange={(event) => {
                    setCommandQuery(event.target.value)
                    setSelectedCommandIndex(0)
                  }}
                  onKeyDown={(event) => {
                    if (event.key === 'ArrowDown' && filteredCommands.length > 0) {
                      event.preventDefault()
                      setSelectedCommandIndex((current) =>
                        current >= filteredCommands.length - 1 ? 0 : current + 1
                      )
                      return
                    }

                    if (event.key === 'ArrowUp' && filteredCommands.length > 0) {
                      event.preventDefault()
                      setSelectedCommandIndex((current) =>
                        current <= 0 ? filteredCommands.length - 1 : current - 1
                      )
                      return
                    }

                    if (event.key === 'Home' && filteredCommands.length > 0) {
                      event.preventDefault()
                      setSelectedCommandIndex(0)
                      return
                    }

                    if (event.key === 'End' && filteredCommands.length > 0) {
                      event.preventDefault()
                      setSelectedCommandIndex(filteredCommands.length - 1)
                      return
                    }

                    if (event.key === 'Enter' && filteredCommands[selectedCommandIndex]) {
                      event.preventDefault()
                      filteredCommands[selectedCommandIndex].run()
                    }
                  }}
                  placeholder="Search commands, jump to a page, or create a record"
                  aria-activedescendant={
                    filteredCommands[selectedCommandIndex]
                      ? `command-item-${filteredCommands[selectedCommandIndex].id}`
                      : undefined
                  }
                  aria-autocomplete="list"
                  aria-controls="command-palette-results"
                  aria-expanded="true"
                  role="combobox"
                  className="w-full bg-transparent text-sm text-stone-900 outline-none placeholder:text-stone-400"
                />
                <span className="rounded-full border border-stone-200 bg-stone-50 px-2.5 py-1 text-[11px] font-medium uppercase tracking-[0.16em] text-stone-500">
                  Esc
                </span>
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px] uppercase tracking-[0.16em] text-stone-500">
                <span className="rounded-full border border-stone-200 bg-white px-2.5 py-1">
                  {commandShortcutLabel}
                </span>
                <span className="rounded-full border border-stone-200 bg-white px-2.5 py-1">
                  /
                </span>
                <span className="rounded-full border border-stone-200 bg-white px-2.5 py-1">
                  Up Down
                </span>
                <span className="rounded-full border border-stone-200 bg-white px-2.5 py-1">
                  G then key
                </span>
              </div>
            </div>

            <div
              id="command-palette-results"
              role="listbox"
              className="max-h-[60vh] overflow-y-auto px-3 py-3"
            >
              {filteredCommands.length === 0 ? (
                <div className="rounded-[1.25rem] border border-dashed border-stone-300 bg-stone-50 px-4 py-8 text-center text-sm text-stone-500">
                  No commands match the current search.
                </div>
              ) : (
                <div className="space-y-1.5">
                  {filteredCommands.map((item, itemIndex) => {
                    const Icon = item.icon
                    const isSelected = itemIndex === selectedCommandIndex

                    return (
                      <button
                        key={item.id}
                        id={`command-item-${item.id}`}
                        ref={(node) => {
                          commandItemRefs.current[itemIndex] = node
                        }}
                        type="button"
                        onClick={item.run}
                        onMouseEnter={() => setSelectedCommandIndex(itemIndex)}
                        role="option"
                        aria-selected={isSelected}
                        className={
                          isSelected
                            ? 'flex w-full items-center gap-3 rounded-[1.2rem] bg-stone-100 px-3 py-3 text-left shadow-[inset_0_0_0_1px_rgba(214,211,209,0.8)] transition'
                            : 'flex w-full items-center gap-3 rounded-[1.2rem] px-3 py-3 text-left transition hover:bg-stone-100/80'
                        }
                      >
                        <div className="flex h-10 w-10 items-center justify-center rounded-[1rem] border border-stone-200 bg-white text-stone-700 shadow-sm">
                          <Icon className="h-4 w-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-stone-900">{item.label}</p>
                          <p className="mt-0.5 truncate text-sm text-stone-500">
                            {item.description}
                          </p>
                        </div>
                        {item.shortcut ? (
                          <span className="rounded-full border border-stone-200 bg-white px-2.5 py-1 text-[11px] font-medium uppercase tracking-[0.16em] text-stone-500">
                            {item.shortcut}
                          </span>
                        ) : null}
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
