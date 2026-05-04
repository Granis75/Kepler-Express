import {
  ArrowRight,
  Banknote,
  CheckCircle2,
  CircleDollarSign,
  ClipboardList,
  FileText,
  Fuel,
  Gauge,
  MapPinned,
  ReceiptText,
  Route,
  Truck,
  UserRoundCheck,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { useAuthState } from '../lib/auth'
import { appRoutes, publicRoutes } from '../lib/routes'

const workflowSteps = ['Mission', 'Driver', 'Expense', 'Invoice', 'Payment']

const productRows = [
  {
    mission: 'Paris to Lille transfer',
    driver: 'Samir B.',
    expense: 'Fuel receipt pending',
    invoice: 'Draft ready',
    payment: 'Not sent',
  },
  {
    mission: 'Depot pickup route 18',
    driver: 'Nadia K.',
    expense: 'Approved',
    invoice: 'INV-2048 sent',
    payment: 'Due Friday',
  },
  {
    mission: 'Express airport delivery',
    driver: 'Omar T.',
    expense: 'Toll added',
    invoice: 'INV-2046 paid',
    payment: 'Complete',
  },
]

const features = [
  {
    icon: ClipboardList,
    title: 'Mission tracking',
    text: 'Follow active, planned, completed, and blocked missions without losing the commercial context.',
  },
  {
    icon: UserRoundCheck,
    title: 'Driver assignment',
    text: 'Connect every mission to the right driver and keep daily dispatch decisions visible.',
  },
  {
    icon: ReceiptText,
    title: 'Expense visibility',
    text: 'Capture fuel, tolls, advances, and operational costs before they disappear into messages.',
  },
  {
    icon: FileText,
    title: 'Invoice follow-up',
    text: 'Move completed work into billing and keep invoice status tied to the original mission.',
  },
  {
    icon: CircleDollarSign,
    title: 'Payment status',
    text: 'See what is paid, due, late, or waiting for action from the same operational workspace.',
  },
  {
    icon: Truck,
    title: 'Fleet/operations overview',
    text: "Give managers a clean read on today's field activity, cost exposure, and cash follow-up.",
  },
]

const valuePoints = [
  'Less time reconciling spreadsheets, receipts, invoices, and status messages.',
  'Clearer ownership between dispatch, drivers, accounting, and management.',
  'A practical operating rhythm for small logistics teams that need control without enterprise bloat.',
]

function ProductPreview() {
  return (
    <div className="overflow-hidden rounded-[1.6rem] border border-slate-200 bg-white shadow-[0_28px_90px_rgba(15,23,42,0.13)]">
      <div className="border-b border-slate-200 bg-slate-950 px-5 py-4 text-white sm:px-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">
              Operations workspace
            </p>
            <h2 className="mt-2 font-heading text-2xl font-semibold tracking-tight">
              Today's logistics control
            </h2>
          </div>
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-300">
            <span className="h-2 w-2 rounded-full bg-emerald-400" />
            Live operations
          </div>
        </div>
      </div>

      <div className="grid gap-0 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="border-b border-slate-200 p-5 sm:p-6 lg:border-b-0 lg:border-r">
          <div className="grid gap-3 sm:grid-cols-3">
            {[
              { label: 'Active missions', value: '24', icon: Route },
              { label: 'Open expenses', value: '6', icon: Fuel },
              { label: 'Invoices to chase', value: '2', icon: Banknote },
            ].map((stat) => {
              const Icon = stat.icon

              return (
                <div key={stat.label} className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                  <Icon className="h-4 w-4 text-teal-700" />
                  <p className="mt-4 text-3xl font-semibold tracking-tight text-slate-950">
                    {stat.value}
                  </p>
                  <p className="mt-1 text-xs font-medium text-slate-500">{stat.label}</p>
                </div>
              )
            })}
          </div>

          <div className="mt-5 hidden overflow-hidden rounded-xl border border-slate-200 md:block">
            <div className="grid grid-cols-[1.15fr_0.75fr_0.95fr_0.85fr_0.85fr] gap-4 bg-slate-100 px-4 py-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">
              <span>Mission</span>
              <span>Driver</span>
              <span>Expense</span>
              <span>Invoice</span>
              <span>Payment</span>
            </div>
            {productRows.map((row) => (
              <div
                key={row.mission}
                className="grid grid-cols-[1.15fr_0.75fr_0.95fr_0.85fr_0.85fr] gap-4 border-t border-slate-200 px-4 py-3 text-sm text-slate-700"
              >
                <span className="font-medium text-slate-950">{row.mission}</span>
                <span>{row.driver}</span>
                <span>{row.expense}</span>
                <span>{row.invoice}</span>
                <span>{row.payment}</span>
              </div>
            ))}
          </div>

          <div className="mt-5 grid gap-3 md:hidden">
            {productRows.map((row) => (
              <div key={row.mission} className="rounded-xl border border-slate-200 bg-white p-4">
                <p className="text-sm font-semibold text-slate-950">{row.mission}</p>
                <div className="mt-3 grid grid-cols-2 gap-3 text-xs text-slate-600">
                  <span>Driver: {row.driver}</span>
                  <span>Expense: {row.expense}</span>
                  <span>Invoice: {row.invoice}</span>
                  <span>Payment: {row.payment}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-slate-50 p-5 sm:p-6">
          <p className="text-sm font-semibold text-slate-950">Operational timeline</p>
          <div className="mt-5 space-y-4">
            {workflowSteps.map((step, index) => (
              <div key={step} className="flex items-center gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-sm font-semibold text-teal-800 ring-1 ring-slate-200">
                  {index + 1}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-slate-950">{step}</p>
                  <div className="mt-2 h-2 rounded-full bg-slate-200">
                    <div
                      className="h-2 rounded-full bg-teal-700"
                      style={{ width: `${88 - index * 11}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export function Landing() {
  const { user } = useAuthState()
  const workspaceTarget = user ? appRoutes.dashboard : publicRoutes.login

  return (
    <main className="min-h-screen bg-[#f7f9fb] text-slate-950">
      <header className="border-b border-slate-200 bg-white/92">
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

          <nav className="hidden items-center gap-6 text-sm font-medium text-slate-600 md:flex">
            <a href="#preview">Product</a>
            <Link to={publicRoutes.workflow}>Workflow</Link>
            <a href="#features">Features</a>
          </nav>

          <div className="flex items-center gap-2">
            <Link to={publicRoutes.login} className="btn-secondary px-4 py-2">
              Log in
            </Link>
            <Link to={workspaceTarget} className="btn-primary px-4 py-2">
              {user ? 'Open app' : 'View demo'}
            </Link>
          </div>
        </div>
      </header>

      <section className="mx-auto grid max-w-7xl items-center gap-10 px-5 py-14 sm:px-6 md:py-20 lg:grid-cols-[0.9fr_1.1fr] lg:px-8">
        <div>
          <span className="eyebrow-chip border-teal-200 bg-teal-50 text-teal-800">
            Mission to payment visibility
          </span>
          <h1 className="mt-6 max-w-3xl font-heading text-5xl font-semibold leading-[1.02] tracking-tight text-slate-950 sm:text-6xl">
            Kepler Ops helps small logistics teams run the full mission workflow.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600">
            Track missions, drivers, expenses, invoicing and payment follow-up from one operational
            workspace built for lean logistics teams.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link to={workspaceTarget} className="btn-primary bg-teal-700 hover:bg-teal-800">
              {user ? 'Open workspace' : 'Explore Kepler'}
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link to={publicRoutes.workflow} className="btn-secondary">
              See workflow
            </Link>
          </div>
        </div>

        <ProductPreview />
      </section>

      <section id="preview" className="border-y border-slate-200 bg-white py-16">
        <div className="mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">
          <div className="grid gap-8 lg:grid-cols-[0.75fr_1.25fr]">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-teal-700">
                Product preview
              </p>
              <h2 className="mt-3 font-heading text-4xl font-semibold tracking-tight">
                One workspace for the daily operating picture.
              </h2>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              {[
                ['Dispatch', 'Know what is planned, active, blocked, and completed.'],
                ['Cost control', 'Keep receipts and operational expenses connected to missions.'],
                ['Cash follow-up', 'Move from delivered work to invoices and payment status.'],
              ].map(([title, text]) => (
                <div key={title} className="rounded-lg border border-slate-200 bg-slate-50 p-5">
                  <CheckCircle2 className="h-5 w-5 text-teal-700" />
                  <h3 className="mt-5 text-base font-semibold">{title}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-16 sm:px-6 lg:px-8">
        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-teal-700">
              Workflow
            </p>
            <h2 className="mt-3 font-heading text-4xl font-semibold tracking-tight">
              Mission to payment, without losing the thread.
            </h2>
          </div>
          <Link to={publicRoutes.workflow} className="btn-secondary w-fit">
            How Kepler works
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="mt-8 grid gap-3 md:grid-cols-5">
          {workflowSteps.map((step, index) => (
            <div key={step} className="rounded-lg border border-slate-200 bg-white p-5">
              <p className="text-sm font-semibold text-teal-700">0{index + 1}</p>
              <h3 className="mt-8 text-lg font-semibold">{step}</h3>
            </div>
          ))}
        </div>
      </section>

      <section id="features" className="bg-white py-16">
        <div className="mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-teal-700">
              Features
            </p>
            <h2 className="mt-3 font-heading text-4xl font-semibold tracking-tight">
              Built around the operational jobs small logistics teams repeat every day.
            </h2>
          </div>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => {
              const Icon = feature.icon

              return (
                <div key={feature.title} className="rounded-lg border border-slate-200 p-5">
                  <Icon className="h-5 w-5 text-teal-700" />
                  <h3 className="mt-5 text-lg font-semibold">{feature.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{feature.text}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-16 sm:px-6 lg:px-8">
        <div className="grid gap-8 rounded-xl border border-slate-200 bg-slate-950 p-6 text-white sm:p-8 lg:grid-cols-[0.75fr_1.25fr]">
          <div>
            <Gauge className="h-6 w-6 text-teal-300" />
            <h2 className="mt-5 font-heading text-4xl font-semibold tracking-tight">
              Operational value
            </h2>
          </div>
          <div className="grid gap-3">
            {valuePoints.map((point) => (
              <div key={point} className="flex gap-3 rounded-lg bg-white/7 p-4">
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-teal-300" />
                <p className="text-sm leading-6 text-slate-200">{point}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white py-16">
        <div className="mx-auto flex max-w-7xl flex-col justify-between gap-6 px-5 sm:px-6 md:flex-row md:items-center lg:px-8">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-teal-700">
              Ready for operations
            </p>
            <h2 className="mt-3 max-w-2xl font-heading text-4xl font-semibold tracking-tight">
              Give dispatch, finance, and management one shared operating view.
            </h2>
          </div>
          <Link to={workspaceTarget} className="btn-primary bg-teal-700 hover:bg-teal-800">
            {user ? 'Open Kepler Ops' : 'Start with Kepler Ops'}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </main>
  )
}
