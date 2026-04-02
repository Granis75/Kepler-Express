import {
  ArrowRight,
  BriefcaseBusiness,
  Building2,
  ChartNoAxesCombined,
  Receipt,
  ShieldCheck,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { useAuthState } from '../lib/auth'
import { appRoutes, publicRoutes } from '../lib/routes'

const previewStats = [
  { label: 'Active missions', value: '24', tone: 'text-emerald-700' },
  { label: 'Pending expenses', value: '6', tone: 'text-amber-700' },
  { label: 'Invoices overdue', value: '2', tone: 'text-rose-700' },
]

const previewModules = [
  { icon: Building2, label: 'Clients', note: 'Clean records and account context' },
  { icon: ChartNoAxesCombined, label: 'Dashboard', note: 'Revenue, margin, overdue exposure' },
  { icon: BriefcaseBusiness, label: 'Operations', note: 'Missions, expenses, invoices' },
  { icon: ShieldCheck, label: 'Workspace', note: 'Secure access with organization scoping' },
]

const previewQueue = [
  {
    title: 'Dispatch review',
    note: '3 missions start before 08:00',
    icon: BriefcaseBusiness,
  },
  {
    title: 'Expense approvals',
    note: '2 receipts still waiting for validation',
    icon: Receipt,
  },
  {
    title: 'Billing follow-up',
    note: '1 overdue invoice needs action today',
    icon: Building2,
  },
]

export function Landing() {
  const { user } = useAuthState()

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(15,118,110,0.14),_transparent_26%),radial-gradient(circle_at_bottom_right,_rgba(120,113,108,0.12),_transparent_24%),linear-gradient(180deg,_#faf8f3_0%,_#f3efe7_100%)] text-stone-900">
      <div className="mx-auto flex min-h-screen max-w-[1560px] flex-col px-6 py-8 lg:px-10">
        <header className="flex items-center justify-between py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-[1rem] border border-stone-300/80 bg-white/84 shadow-sm backdrop-blur">
              <ChartNoAxesCombined className="h-5 w-5 text-teal-700" />
            </div>
            <div>
              <p className="font-heading text-lg font-semibold tracking-tight text-stone-900">
                Kepler Express
              </p>
              <p className="text-xs uppercase tracking-[0.24em] text-stone-500">
                Internal operations
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <Link
              to={publicRoutes.login}
              className="btn-secondary px-4 py-2"
            >
              Log in
            </Link>
            <Link
              to={user ? appRoutes.dashboard : publicRoutes.signup}
              className="btn-primary px-4 py-2"
            >
              {user ? 'Open workspace' : 'Create account'}
            </Link>
          </div>
        </header>

        <div className="grid flex-1 items-center gap-14 py-12 lg:grid-cols-[0.95fr_1.05fr]">
          <section className="max-w-2xl">
            <span className="eyebrow-chip">Internal tool V1</span>
            <h1 className="mt-7 max-w-xl font-heading text-5xl font-semibold leading-[1.02] tracking-tight text-stone-950 sm:text-[4.35rem]">
              Run daily operations from one quiet workspace.
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-8 text-stone-600">
              Kepler Express keeps the live surface narrow and dependable: dashboard,
              clients, missions, expenses, invoices, and workspace access, all aligned
              to the current Supabase schema.
            </p>

            <div className="mt-10 flex flex-col gap-3 sm:flex-row">
              <Link
                to={user ? appRoutes.dashboard : publicRoutes.login}
                className="btn-primary bg-teal-700 shadow-[0_12px_30px_rgba(15,118,110,0.18)] hover:bg-teal-800"
              >
                {user ? 'Open workspace' : 'Log in'}
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to={user ? appRoutes.clients : publicRoutes.signup}
                className="btn-secondary"
              >
                {user ? 'Go to clients' : 'Create account'}
              </Link>
            </div>

            <div className="mt-10 grid gap-3 sm:grid-cols-3">
              <div className="rounded-[1.35rem] border border-stone-200/80 bg-white/74 px-4 py-4 shadow-sm">
                <p className="text-[11px] uppercase tracking-[0.2em] text-stone-500">
                  Surface
                </p>
                <p className="mt-2 text-sm font-semibold text-stone-950">Only live modules</p>
              </div>
              <div className="rounded-[1.35rem] border border-stone-200/80 bg-white/74 px-4 py-4 shadow-sm">
                <p className="text-[11px] uppercase tracking-[0.2em] text-stone-500">
                  Access
                </p>
                <p className="mt-2 text-sm font-semibold text-stone-950">Stable login and signup</p>
              </div>
              <div className="rounded-[1.35rem] border border-stone-200/80 bg-white/74 px-4 py-4 shadow-sm">
                <p className="text-[11px] uppercase tracking-[0.2em] text-stone-500">
                  Workspace
                </p>
                <p className="mt-2 text-sm font-semibold text-stone-950">Organization scoped</p>
              </div>
            </div>
          </section>

          <section className="relative">
            <div className="absolute inset-0 -z-10 rounded-[2.5rem] bg-white/30 blur-3xl" />
            <div className="overflow-hidden rounded-[2.2rem] border border-stone-300/70 bg-white/84 shadow-[0_34px_100px_rgba(28,25,23,0.14)] ring-1 ring-white/40 backdrop-blur">
              <div className="border-b border-stone-200 bg-stone-950 px-6 py-5 text-stone-100">
                <p className="text-xs uppercase tracking-[0.28em] text-stone-400">
                  Product preview
                </p>
                <div className="mt-3 flex items-center justify-between">
                  <div>
                    <p className="font-heading text-2xl font-semibold tracking-tight">
                      Operational workspace
                    </p>
                    <p className="mt-1 text-sm text-stone-400">
                      One surface for dispatch, cost control, and billing follow-up.
                    </p>
                  </div>
                  <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-stone-300">
                    Internal
                  </div>
                </div>
              </div>

              <div className="grid gap-5 p-6 lg:grid-cols-[1.12fr_0.88fr]">
                <div className="space-y-5">
                  <div className="grid gap-3 sm:grid-cols-3">
                    {previewStats.map((stat) => (
                      <div
                        key={stat.label}
                        className="rounded-[1.4rem] border border-stone-200 bg-stone-50/90 px-4 py-4"
                      >
                        <p className="text-[11px] uppercase tracking-[0.2em] text-stone-500">
                          {stat.label}
                        </p>
                        <p
                          className={`mt-3 text-[2rem] font-semibold tracking-[-0.04em] ${stat.tone}`}
                        >
                          {stat.value}
                        </p>
                      </div>
                    ))}
                  </div>

                  <div className="rounded-[1.6rem] border border-stone-200 bg-white p-5">
                    <div className="mb-4 flex items-center justify-between">
                      <div>
                        <p className="text-sm font-semibold text-stone-900">Today’s queue</p>
                        <p className="text-sm text-stone-500">
                          Priority items visible at a glance
                        </p>
                      </div>
                      <div className="rounded-full bg-stone-100 px-3 py-1 text-xs font-medium text-stone-600">
                        Live view
                      </div>
                    </div>

                    <div className="space-y-3">
                      {previewQueue.map((item) => {
                        const Icon = item.icon

                        return (
                          <div
                            key={item.title}
                            className="flex items-center gap-3 rounded-[1.25rem] border border-stone-200 bg-stone-50/80 px-4 py-3"
                          >
                            <div className="flex h-10 w-10 items-center justify-center rounded-[0.95rem] bg-stone-900 text-white">
                              <Icon className="h-4 w-4" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-semibold text-stone-950">{item.title}</p>
                              <p className="text-sm text-stone-500">{item.note}</p>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </div>

                <div className="rounded-[1.6rem] border border-stone-200 bg-white p-5">
                  <div className="mb-4 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-stone-900">Modules</p>
                      <p className="text-sm text-stone-500">
                        Built around the current Supabase contract
                      </p>
                    </div>
                    <div className="rounded-full bg-teal-50 px-3 py-1 text-xs font-medium text-teal-700">
                      Schema-aligned
                    </div>
                  </div>

                  <div className="space-y-3">
                    {previewModules.map((module) => {
                      const Icon = module.icon

                      return (
                        <div
                          key={module.label}
                          className="flex items-center justify-between rounded-[1.25rem] border border-stone-200 px-4 py-3"
                        >
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-[0.95rem] bg-stone-100 text-stone-700">
                              <Icon className="h-4 w-4" />
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-stone-900">
                                {module.label}
                              </p>
                              <p className="text-sm text-stone-500">{module.note}</p>
                            </div>
                          </div>
                          <div className="h-2 w-2 rounded-full bg-teal-600" />
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
