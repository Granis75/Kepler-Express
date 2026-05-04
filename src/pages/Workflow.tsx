import {
  ArrowRight,
  Banknote,
  CheckCircle2,
  ClipboardList,
  FileText,
  MapPinned,
  ReceiptText,
  UserRoundCheck,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { appRoutes, publicRoutes } from '../lib/routes'

const steps = [
  {
    icon: ClipboardList,
    title: 'Mission',
    text: 'Create the transport job with client, route, timing, operational notes, and current status.',
  },
  {
    icon: UserRoundCheck,
    title: 'Driver',
    text: 'Assign the mission to the right driver so dispatch and back office share the same source of truth.',
  },
  {
    icon: ReceiptText,
    title: 'Expense',
    text: 'Attach fuel, tolls, advances, and other mission costs before billing and margin review.',
  },
  {
    icon: FileText,
    title: 'Invoice',
    text: 'Turn completed work into invoice follow-up while preserving the mission and client context.',
  },
  {
    icon: Banknote,
    title: 'Payment',
    text: 'Track paid, pending, due, and overdue payment status from the same operational workspace.',
  },
]

export function Workflow() {
  return (
    <main className="min-h-screen bg-[#f7f9fb] text-slate-950">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 sm:px-6 lg:px-8">
          <Link to={publicRoutes.landing} className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-950 text-white">
              <MapPinned className="h-5 w-5" />
            </div>
            <div>
              <p className="font-heading text-lg font-semibold tracking-tight">Kepler Ops</p>
              <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500">
                Logistics operations
              </p>
            </div>
          </Link>
          <div className="flex items-center gap-2">
            <Link to={publicRoutes.landing} className="btn-secondary px-4 py-2">
              Landing
            </Link>
            <Link to={appRoutes.dashboard} className="btn-primary px-4 py-2">
              Open app
            </Link>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-5 py-14 sm:px-6 md:py-20 lg:px-8">
        <div className="max-w-3xl">
          <span className="eyebrow-chip border-teal-200 bg-teal-50 text-teal-800">
            How Kepler works
          </span>
          <h1 className="mt-6 font-heading text-5xl font-semibold leading-[1.02] tracking-tight sm:text-6xl">
            A simple operating flow from mission creation to payment follow-up.
          </h1>
          <p className="mt-6 text-lg leading-8 text-slate-600">
            Kepler Ops keeps the logistics workflow connected so small teams can see the work,
            the driver, the cost, the invoice, and the payment status in one place.
          </p>
        </div>

        <div className="mt-12 grid gap-4 lg:grid-cols-5">
          {steps.map((step, index) => {
            const Icon = step.icon

            return (
              <article key={step.title} className="rounded-lg border border-slate-200 bg-white p-5">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-teal-50 text-teal-800">
                    <Icon className="h-5 w-5" />
                  </div>
                  <span className="text-sm font-semibold text-slate-400">0{index + 1}</span>
                </div>
                <h2 className="mt-8 text-xl font-semibold">{step.title}</h2>
                <p className="mt-3 text-sm leading-6 text-slate-600">{step.text}</p>
              </article>
            )
          })}
        </div>

        <div className="mt-8 rounded-xl border border-slate-200 bg-white p-6 sm:p-8">
          <div className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
            <div>
              <h2 className="font-heading text-3xl font-semibold tracking-tight">
                Why this flow matters
              </h2>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                Small logistics teams often run these steps across calls, messages, spreadsheets,
                and accounting tools. Kepler Ops gives the team a cleaner operational spine.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              {['Fewer missed costs', 'Cleaner invoice handoff', 'Better payment visibility'].map(
                (point) => (
                  <div key={point} className="rounded-lg bg-slate-50 p-4">
                    <CheckCircle2 className="h-5 w-5 text-teal-700" />
                    <p className="mt-4 text-sm font-semibold">{point}</p>
                  </div>
                )
              )}
            </div>
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-3 sm:flex-row">
          <Link to={publicRoutes.landing} className="btn-secondary">
            Back to landing
          </Link>
          <Link to={appRoutes.dashboard} className="btn-primary bg-teal-700 hover:bg-teal-800">
            Open app
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </main>
  )
}
