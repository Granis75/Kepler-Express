import type { ReactNode } from 'react'
import { BarChart3, FileText, Receipt, Truck } from 'lucide-react'
import { Link } from 'react-router-dom'
import { publicRoutes } from '../lib/routes'

const previewItems = [
  { icon: BarChart3, label: 'Dashboard', note: 'Margin, unpaid cash, live overview' },
  { icon: Truck, label: 'Missions', note: 'Route planning and execution states' },
  { icon: Receipt, label: 'Expenses', note: 'Approvals, receipts, actual cost sync' },
  { icon: FileText, label: 'Invoices', note: 'Billing follow-up and overdue exposure' },
]

export function AuthScene({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string
  subtitle: string
  children: ReactNode
  footer: ReactNode
}) {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(15,118,110,0.14),_transparent_22%),linear-gradient(180deg,_#faf8f3_0%,_#f4f0e8_100%)] px-6 py-8">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-7xl flex-col gap-8 lg:grid lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
        <div className="flex items-center justify-between lg:hidden">
          <Link
            to={publicRoutes.landing}
            className="font-heading text-lg font-semibold tracking-tight text-stone-950"
          >
            Kepler Express
          </Link>
        </div>

        <div className="hidden rounded-[2rem] border border-stone-300/70 bg-white/70 p-8 shadow-[0_30px_100px_rgba(28,25,23,0.12)] backdrop-blur lg:block">
          <Link
            to={publicRoutes.landing}
            className="font-heading text-2xl font-semibold tracking-tight text-stone-950"
          >
            Kepler Express
          </Link>
          <p className="mt-2 text-sm text-stone-500">Internal operations workspace</p>

          <h2 className="mt-10 max-w-md font-heading text-4xl font-semibold tracking-tight text-stone-950">
            Stable access to the product surface that is already live.
          </h2>
          <p className="mt-4 max-w-lg text-sm leading-7 text-stone-600">
            No marketing shell, no placeholder modules. Only the routes backed by the
            current schema: dashboard, clients, missions, expenses, invoices, and settings.
          </p>

          <div className="mt-8 space-y-3">
            {previewItems.map((item) => {
              const Icon = item.icon

              return (
                <div
                  key={item.label}
                  className="flex items-center gap-4 rounded-[1.5rem] border border-stone-200 bg-[#fcfaf6] px-4 py-4"
                >
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-stone-100 text-stone-700">
                    <Icon className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-stone-950">{item.label}</p>
                    <p className="text-sm text-stone-500">{item.note}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <div className="mx-auto w-full max-w-xl">
          <div className="rounded-[2rem] border border-stone-300/80 bg-white/88 p-8 shadow-[0_24px_90px_rgba(28,25,23,0.12)] backdrop-blur sm:p-10">
            <p className="text-xs uppercase tracking-[0.24em] text-stone-500">Account access</p>
            <h1 className="mt-4 font-heading text-4xl font-semibold tracking-tight text-stone-950">
              {title}
            </h1>
            <p className="mt-3 text-sm leading-7 text-stone-600">{subtitle}</p>

            <div className="mt-8">{children}</div>
            <div className="mt-6 text-sm text-stone-500">{footer}</div>
          </div>
        </div>
      </div>
    </div>
  )
}
