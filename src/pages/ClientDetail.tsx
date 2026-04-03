import { useMemo, useState } from 'react'
import { ArrowLeft, Mail, MapPin, PencilLine, Phone } from 'lucide-react'
import { createSearchParams, useNavigate, useParams } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import { ClientForm } from '../components/ClientForm'
import { PageContainer } from '../components/PageContainer'
import {
  ModalSurface,
  PageLoadingSkeleton,
  SectionCard,
  StatePanel,
  StatCard,
  StatusBadge,
} from '../components/WorkspaceUi'
import { useClients, useInvoices, useMissions } from '../hooks'
import { getClientStatusConfig } from '../lib/domain'
import { updateClient } from '../lib/data'
import {
  getInvoiceBalance,
  getMissionInvoiceMap,
  getMissionMarginSnapshot,
  isMissionActive,
} from '../lib/operations'
import { appRoutes, getInvoiceDetailRoute, getMissionDetailRoute } from '../lib/routes'
import {
  formatCurrencyWithDecimals,
  formatDate,
  formatDateTime,
  formatPercentage,
  formatPhoneNumber,
} from '../lib/utils'
import type { Client, CreateClientInput, Invoice, Mission } from '../types'

function clientTone(status: Client['status']) {
  switch (status) {
    case 'active':
      return 'success' as const
    case 'inactive':
      return 'warning' as const
    default:
      return 'neutral' as const
  }
}

function missionTone(status: Mission['status']) {
  switch (status) {
    case 'delivered':
      return 'success' as const
    case 'in_progress':
      return 'info' as const
    case 'issue':
      return 'danger' as const
    case 'assigned':
      return 'warning' as const
    default:
      return 'neutral' as const
  }
}

function invoiceTone(status: Invoice['status']) {
  switch (status) {
    case 'partial':
      return 'warning' as const
    case 'overdue':
      return 'danger' as const
    case 'sent':
      return 'info' as const
    case 'paid':
      return 'success' as const
    default:
      return 'neutral' as const
  }
}

const invoiceStatusLabels: Record<Invoice['status'], string> = {
  draft: 'Draft',
  sent: 'Sent',
  partial: 'Partial',
  paid: 'Paid',
  overdue: 'Overdue',
  cancelled: 'Cancelled',
}

const secondaryButtonClasses =
  'inline-flex items-center justify-center gap-2 rounded-full border border-stone-300 bg-white px-4 py-2 text-sm font-medium text-stone-700 transition hover:border-stone-400 hover:bg-stone-100 hover:text-stone-900 active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-stone-300'

const primaryButtonClasses =
  'inline-flex items-center justify-center gap-2 rounded-full bg-stone-950 px-4 py-2 text-sm font-medium text-white transition hover:bg-stone-800 active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-stone-300'

const inlineButtonClasses =
  'inline-flex items-center gap-1.5 rounded-full border border-stone-300 bg-white px-2.5 py-1.5 text-[11px] font-medium text-stone-700 transition hover:border-stone-400 hover:bg-stone-100 hover:text-stone-900 active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-stone-300'

export function ClientDetail() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const [showForm, setShowForm] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const clientsQuery = useClients()
  const missionsQuery = useMissions()
  const invoicesQuery = useInvoices()

  const clients = clientsQuery.data ?? []
  const missions = missionsQuery.data ?? []
  const invoices = invoicesQuery.data ?? []
  const isLoading =
    clientsQuery.isLoading || missionsQuery.isLoading || invoicesQuery.isLoading
  const error =
    (clientsQuery.error instanceof Error && clientsQuery.error.message) ||
    (missionsQuery.error instanceof Error && missionsQuery.error.message) ||
    (invoicesQuery.error instanceof Error && invoicesQuery.error.message) ||
    null

  const client = useMemo(
    () => clients.find((item) => item.client_id === id) ?? null,
    [clients, id]
  )

  const missionInvoiceMap = useMemo(() => getMissionInvoiceMap(invoices), [invoices])

  const clientMissions = useMemo(
    () =>
      missions
        .filter((mission) => mission.client_id === id)
        .sort((left, right) => {
          if (isMissionActive(left.status) && !isMissionActive(right.status)) {
            return -1
          }

          if (!isMissionActive(left.status) && isMissionActive(right.status)) {
            return 1
          }

          return (
            new Date(right.departure_datetime).getTime() -
            new Date(left.departure_datetime).getTime()
          )
        }),
    [id, missions]
  )

  const missionById = useMemo(
    () => new Map(clientMissions.map((mission) => [mission.mission_id, mission] as const)),
    [clientMissions]
  )

  const clientInvoices = useMemo(
    () =>
      invoices
        .filter((invoice) => invoice.client_id === id)
        .sort((left, right) => {
          if (left.status === 'overdue' && right.status !== 'overdue') {
            return -1
          }

          if (left.status !== 'overdue' && right.status === 'overdue') {
            return 1
          }

          return new Date(right.issue_date).getTime() - new Date(left.issue_date).getTime()
        }),
    [id, invoices]
  )

  const metrics = useMemo(() => {
    const totalRevenue = clientMissions.reduce(
      (sum, mission) => sum + Number(mission.revenue_amount ?? 0),
      0
    )
    const totalInvoiced = clientInvoices.reduce(
      (sum, invoice) => sum + Number(invoice.amount_total ?? 0),
      0
    )
    const totalPaid = clientInvoices.reduce(
      (sum, invoice) => sum + Number(invoice.amount_paid ?? 0),
      0
    )
    const outstanding = clientInvoices.reduce(
      (sum, invoice) => sum + getInvoiceBalance(invoice),
      0
    )
    const activeMissionCount = clientMissions.filter((mission) =>
      isMissionActive(mission.status)
    ).length
    const overdueInvoiceCount = clientInvoices.filter(
      (invoice) => invoice.status === 'overdue'
    ).length
    const activeUninvoicedMissionCount = clientMissions.filter((mission) => {
      const linkedInvoices = missionInvoiceMap.get(mission.mission_id) ?? []
      return isMissionActive(mission.status) && linkedInvoices.length === 0
    }).length
    const marginSnapshots = clientMissions.map((mission) => getMissionMarginSnapshot(mission))
    const portfolioBaselineCost = marginSnapshots.reduce(
      (sum, snapshot) => sum + snapshot.baselineCost,
      0
    )
    const marginAmount = totalRevenue - portfolioBaselineCost
    const marginRatio = totalRevenue > 0 ? marginAmount / totalRevenue : 0
    const marginSensitiveCount = marginSnapshots.filter((snapshot) => snapshot.isSensitive).length
    const actualCostCoverageCount = clientMissions.filter(
      (mission) => Number(mission.actual_cost_amount ?? 0) > 0
    ).length

    return {
      totalRevenue,
      totalInvoiced,
      totalPaid,
      outstanding,
      activeMissionCount,
      overdueInvoiceCount,
      activeUninvoicedMissionCount,
      marginAmount,
      marginRatio,
      marginSensitiveCount,
      missionCount: clientMissions.length,
      invoiceCount: clientInvoices.length,
      actualCostCoverageCount,
    }
  }, [clientInvoices, clientMissions, missionInvoiceMap])

  const locationLine = [client?.city, client?.postal_code, client?.country]
    .filter(Boolean)
    .join(', ')
  const addressLine = [client?.address, locationLine].filter(Boolean).join(' • ')
  const statusConfig = client ? getClientStatusConfig(client.status) : null

  const portfolioSummary = useMemo(() => {
    if (!client || !statusConfig) {
      return ''
    }

    const segments = [
      `${metrics.missionCount} mission${metrics.missionCount === 1 ? '' : 's'}`,
      `${metrics.invoiceCount} invoice${metrics.invoiceCount === 1 ? '' : 's'}`,
    ]

    if (metrics.activeMissionCount > 0) {
      segments.push(
        `${metrics.activeMissionCount} active mission${
          metrics.activeMissionCount === 1 ? '' : 's'
        }`
      )
    }

    if (metrics.outstanding > 0) {
      segments.push(`${formatCurrencyWithDecimals(metrics.outstanding)} outstanding`)
    }

    if (metrics.overdueInvoiceCount > 0) {
      segments.push(
        `${metrics.overdueInvoiceCount} overdue invoice${
          metrics.overdueInvoiceCount === 1 ? '' : 's'
        }`
      )
    }

    return `${statusConfig.label} account with ${segments.join(' • ')}.`
  }, [client, metrics, statusConfig])

  const closeForm = () => {
    setShowForm(false)
    setActionError(null)
  }

  const handleSave = async (payload: CreateClientInput) => {
    if (!client) {
      return
    }

    setIsSaving(true)
    setActionError(null)

    try {
      await updateClient(client.client_id, payload)
      toast.success('Client updated.')
      closeForm()
      await clientsQuery.refetch()
    } catch (saveError) {
      const message =
        saveError instanceof Error ? saveError.message : 'Unable to save the client.'
      setActionError(message)
      toast.error(message)
    } finally {
      setIsSaving(false)
    }
  }

  const openMission = (missionId: string) => {
    navigate(getMissionDetailRoute(missionId))
  }

  const openInvoice = (invoiceId: string) => {
    navigate(getInvoiceDetailRoute(invoiceId))
  }

  const openInvoiceComposer = (missionId: string) => {
    if (!client) {
      return
    }

    navigate({
      pathname: appRoutes.invoices,
      search: createSearchParams({
        client: client.client_id,
        mission: missionId,
        compose: 'new',
      }).toString(),
    })
  }

  if (isLoading) {
    return (
      <PageContainer>
        <PageLoadingSkeleton stats={5} rows={3} />
      </PageContainer>
    )
  }

  if (error) {
    return (
      <PageContainer>
        <StatePanel
          tone="danger"
          title="Unable to load client portfolio"
          message={error}
          action={
            <button
              type="button"
              onClick={() => {
                void Promise.all([
                  clientsQuery.refetch(),
                  missionsQuery.refetch(),
                  invoicesQuery.refetch(),
                ])
              }}
              className={primaryButtonClasses}
            >
              Retry
            </button>
          }
        />
      </PageContainer>
    )
  }

  if (!client || !statusConfig) {
    return (
      <PageContainer>
        <StatePanel
          title="Client not found"
          message="The requested account is not available in the current workspace."
          action={
            <button
              type="button"
              onClick={() => navigate(appRoutes.clients)}
              className={secondaryButtonClasses}
            >
              Back to clients
            </button>
          }
        />
      </PageContainer>
    )
  }

  return (
    <PageContainer>
      {showForm ? (
        <ModalSurface
          title="Edit client"
          description="Keep customer details aligned across missions, invoicing, and reporting."
          onClose={closeForm}
        >
          {actionError ? (
            <div className="mb-5 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {actionError}
            </div>
          ) : null}
          <ClientForm
            initialData={client}
            onSubmit={handleSave}
            onCancel={closeForm}
            submitLabel="Save client"
            isLoading={isSaving}
          />
        </ModalSurface>
      ) : null}

      <div className="space-y-5">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <button
              type="button"
              onClick={() => navigate(appRoutes.clients)}
              className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-medium text-stone-500 transition hover:bg-stone-100 hover:text-stone-900 active:scale-[0.98]"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to clients
            </button>

            <div className="mt-4 flex flex-wrap items-center gap-3">
              <h1 className="font-heading text-4xl font-semibold tracking-tight text-stone-950">
                {client.name}
              </h1>
              <StatusBadge label={statusConfig.label} tone={clientTone(client.status)} />
              {metrics.overdueInvoiceCount > 0 ? (
                <StatusBadge label="overdue billing" tone="danger" />
              ) : null}
              {metrics.activeUninvoicedMissionCount > 0 ? (
                <StatusBadge label="needs invoicing" tone="warning" />
              ) : null}
            </div>

            <p className="mt-3 max-w-3xl text-sm leading-7 text-stone-500">
              Account portfolio across missions, invoicing, and collection exposure.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => setShowForm(true)}
              className={primaryButtonClasses}
            >
              <PencilLine className="h-4 w-4" />
              Edit client
            </button>
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
          <StatCard
            label="Revenue"
            value={formatCurrencyWithDecimals(metrics.totalRevenue)}
            detail={`${metrics.missionCount} mission${metrics.missionCount === 1 ? '' : 's'}`}
            onClick={() =>
              navigate({
                pathname: appRoutes.missions,
                search: createSearchParams({ client: client.client_id }).toString(),
              })
            }
          />
          <StatCard
            label="Paid"
            value={formatCurrencyWithDecimals(metrics.totalPaid)}
            detail={`${metrics.invoiceCount} invoice${metrics.invoiceCount === 1 ? '' : 's'} issued`}
            tone="success"
            onClick={() =>
              navigate({
                pathname: appRoutes.invoices,
                search: createSearchParams({ client: client.client_id }).toString(),
              })
            }
          />
          <StatCard
            label="Outstanding"
            value={formatCurrencyWithDecimals(metrics.outstanding)}
            detail={`${metrics.invoiceCount} invoice${metrics.invoiceCount === 1 ? '' : 's'} tracked`}
            tone={metrics.outstanding > 0 ? 'warning' : 'default'}
            onClick={() =>
              navigate({
                pathname: appRoutes.invoices,
                search: createSearchParams({
                  client: client.client_id,
                  queue: 'unpaid',
                }).toString(),
              })
            }
          />
          <StatCard
            label="Missions"
            value={String(metrics.missionCount)}
            detail={`${metrics.activeMissionCount} active`}
            tone={metrics.activeMissionCount > 0 ? 'warning' : 'default'}
            onClick={() =>
              navigate({
                pathname: appRoutes.missions,
                search: createSearchParams({ client: client.client_id }).toString(),
              })
            }
          />
          <StatCard
            label="Overdue invoices"
            value={String(metrics.overdueInvoiceCount)}
            detail={`${metrics.activeUninvoicedMissionCount} active not invoiced`}
            tone={metrics.overdueInvoiceCount > 0 ? 'danger' : 'default'}
            onClick={() =>
              navigate({
                pathname: appRoutes.invoices,
                search: createSearchParams({
                  client: client.client_id,
                  queue: 'overdue',
                }).toString(),
              })
            }
          />
        </div>

        <div className="grid gap-5 xl:grid-cols-[minmax(0,1.35fr)_320px]">
          <div className="space-y-5">
            <SectionCard>
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0">
                  <h2 className="font-heading text-2xl font-semibold tracking-tight text-stone-950">
                    Portfolio summary
                  </h2>
                  <p className="mt-2 text-sm leading-7 text-stone-600">{portfolioSummary}</p>
                </div>
                <div className="rounded-full border border-stone-200 bg-stone-50 px-4 py-2 text-sm text-stone-600">
                  {statusConfig.label}
                </div>
              </div>

              <div className="mt-5 grid gap-4 md:grid-cols-2">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.18em] text-stone-500">
                    Relationship
                  </p>
                  <p className="mt-2 text-sm text-stone-900">
                    {metrics.activeMissionCount > 0
                      ? 'Active logistics workload currently in motion.'
                      : 'No live missions are currently assigned to this account.'}
                  </p>
                  <p className="mt-2 text-sm text-stone-500">
                    {metrics.outstanding > 0
                      ? `${formatCurrencyWithDecimals(metrics.outstanding)} remains outstanding across active billing.`
                      : 'No open balance is currently outstanding.'}
                  </p>
                </div>

                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <Mail className="mt-0.5 h-4 w-4 text-stone-500" />
                    <div className="min-w-0">
                      <p className="text-[11px] uppercase tracking-[0.18em] text-stone-500">
                        Email
                      </p>
                      <p className="mt-1 text-sm text-stone-900">
                        {client.email || 'No email on file'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Phone className="mt-0.5 h-4 w-4 text-stone-500" />
                    <div className="min-w-0">
                      <p className="text-[11px] uppercase tracking-[0.18em] text-stone-500">
                        Phone
                      </p>
                      <p className="mt-1 text-sm text-stone-900">
                        {formatPhoneNumber(client.phone)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <MapPin className="mt-0.5 h-4 w-4 text-stone-500" />
                    <div className="min-w-0">
                      <p className="text-[11px] uppercase tracking-[0.18em] text-stone-500">
                        Location
                      </p>
                      <p className="mt-1 text-sm text-stone-900">
                        {addressLine || 'No address on file'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {client.notes ? (
                <div className="mt-5 rounded-[1.1rem] border border-stone-200 bg-stone-50/90 px-4 py-4">
                  <p className="text-[11px] uppercase tracking-[0.18em] text-stone-500">Notes</p>
                  <p className="mt-2 text-sm leading-7 text-stone-600">{client.notes}</p>
                </div>
              ) : null}
            </SectionCard>

            <SectionCard className="overflow-hidden p-0">
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-stone-200 px-5 py-4">
                <div>
                  <h2 className="font-heading text-2xl font-semibold tracking-tight text-stone-950">
                    Missions
                  </h2>
                  <p className="mt-1 text-sm text-stone-500">
                    {metrics.missionCount} linked mission
                    {metrics.missionCount === 1 ? '' : 's'} in this account portfolio.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    navigate({
                      pathname: appRoutes.missions,
                      search: createSearchParams({ client: client.client_id }).toString(),
                    })
                  }
                  className={secondaryButtonClasses}
                >
                  Open missions
                </button>
              </div>

              {clientMissions.length === 0 ? (
                <div className="px-5 py-8">
                  <p className="text-sm font-medium text-stone-900">
                    No missions are linked to this client yet.
                  </p>
                  <p className="mt-2 text-sm text-stone-500">
                    Open the mission queue to schedule the first operation for this account.
                  </p>
                  <button
                    type="button"
                    onClick={() =>
                      navigate({
                        pathname: appRoutes.missions,
                        search: createSearchParams({ client: client.client_id }).toString(),
                      })
                    }
                    className="mt-4 inline-flex items-center rounded-full border border-stone-300 bg-white px-3 py-1.5 text-sm font-medium text-stone-700 transition hover:border-stone-400 hover:bg-stone-100 hover:text-stone-900 active:scale-[0.98]"
                  >
                    Open mission queue
                  </button>
                </div>
              ) : (
                <div className="divide-y divide-stone-200">
                  {clientMissions.map((mission) => {
                    const linkedInvoices = missionInvoiceMap.get(mission.mission_id) ?? []
                    const margin = getMissionMarginSnapshot(mission)

                    return (
                      <article
                        key={mission.mission_id}
                        className="grid gap-4 px-5 py-4 md:grid-cols-[minmax(0,1.2fr)_160px_170px_auto] md:items-center"
                      >
                        <button
                          type="button"
                          onClick={() => openMission(mission.mission_id)}
                          className="min-w-0 rounded-[1rem] px-1 py-1 text-left transition hover:bg-stone-50"
                        >
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-sm font-semibold text-stone-950">
                              {mission.reference}
                            </h3>
                            <StatusBadge
                              label={mission.status.replace('_', ' ')}
                              tone={missionTone(mission.status)}
                            />
                            {linkedInvoices.length === 0 ? (
                              <StatusBadge label="not invoiced" tone="warning" />
                            ) : null}
                            {margin.isSensitive ? (
                              <StatusBadge label="margin sensitive" tone="danger" />
                            ) : null}
                          </div>

                          <p className="mt-2 text-sm font-medium text-stone-900">
                            {mission.departure_location} to {mission.arrival_location}
                          </p>
                          <p className="mt-1 text-sm text-stone-500">
                            {formatDateTime(mission.departure_datetime)}
                          </p>
                          {mission.notes ? (
                            <p className="mt-2 line-clamp-2 text-xs leading-6 text-stone-500">
                              {mission.notes}
                            </p>
                          ) : null}
                        </button>

                        <div className="text-sm text-stone-500">
                          <p className="text-[11px] uppercase tracking-[0.18em] text-stone-500">
                            Assignment
                          </p>
                          <p className="mt-1 font-medium text-stone-900">
                            {mission.driver_name || 'Driver unassigned'}
                          </p>
                          <p className="mt-1">
                            {mission.vehicle_name || 'Vehicle not set'}
                          </p>
                        </div>

                        <div className="text-sm text-stone-500">
                          <p className="text-[11px] uppercase tracking-[0.18em] text-stone-500">
                            Finance
                          </p>
                          <p className="mt-1 font-medium text-stone-900">
                            {formatCurrencyWithDecimals(mission.revenue_amount)}
                          </p>
                          <p className="mt-1">
                            Margin {formatPercentage(margin.marginRatio * 100, 0)}
                          </p>
                          <p className="mt-1">
                            {margin.sourceLabel} cost{' '}
                            {formatCurrencyWithDecimals(margin.baselineCost)}
                          </p>
                        </div>

                        <div className="flex flex-wrap items-center justify-end gap-2">
                          {linkedInvoices.length > 0 ? (
                            linkedInvoices.map((invoice) => (
                              <button
                                key={invoice.invoice_id}
                                type="button"
                                onClick={() => openInvoice(invoice.invoice_id)}
                                className={inlineButtonClasses}
                              >
                                {invoice.invoice_number}
                              </button>
                            ))
                          ) : (
                            <button
                              type="button"
                              onClick={() => openInvoiceComposer(mission.mission_id)}
                              className={primaryButtonClasses}
                            >
                              Create invoice
                            </button>
                          )}
                        </div>
                      </article>
                    )
                  })}
                </div>
              )}
            </SectionCard>

            <SectionCard className="overflow-hidden p-0">
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-stone-200 px-5 py-4">
                <div>
                  <h2 className="font-heading text-2xl font-semibold tracking-tight text-stone-950">
                    Invoices
                  </h2>
                  <p className="mt-1 text-sm text-stone-500">
                    {metrics.invoiceCount} invoice{metrics.invoiceCount === 1 ? '' : 's'} linked
                    to this client.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    navigate({
                      pathname: appRoutes.invoices,
                      search: createSearchParams({ client: client.client_id }).toString(),
                    })
                  }
                  className={secondaryButtonClasses}
                >
                  Open invoices
                </button>
              </div>

              {clientInvoices.length === 0 ? (
                <div className="px-5 py-8">
                  <p className="text-sm font-medium text-stone-900">
                    No invoices are linked to this client yet.
                  </p>
                  <p className="mt-2 text-sm text-stone-500">
                    Missions can still be prepared first, then billed from the invoice queue.
                  </p>
                  <button
                    type="button"
                    onClick={() =>
                      navigate({
                        pathname: appRoutes.invoices,
                        search: createSearchParams({ client: client.client_id }).toString(),
                      })
                    }
                    className="mt-4 inline-flex items-center rounded-full border border-stone-300 bg-white px-3 py-1.5 text-sm font-medium text-stone-700 transition hover:border-stone-400 hover:bg-stone-100 hover:text-stone-900 active:scale-[0.98]"
                  >
                    Open invoice queue
                  </button>
                </div>
              ) : (
                <div className="divide-y divide-stone-200">
                  {clientInvoices.map((invoice) => {
                    const balance = getInvoiceBalance(invoice)
                    const linkedMissions = invoice.mission_ids
                      .map((missionId) => missionById.get(missionId))
                      .filter(Boolean) as Mission[]

                    return (
                      <article
                        key={invoice.invoice_id}
                        className="grid gap-4 px-5 py-4 md:grid-cols-[minmax(0,1fr)_150px_170px_auto] md:items-center"
                      >
                        <button
                          type="button"
                          onClick={() => openInvoice(invoice.invoice_id)}
                          className="min-w-0 rounded-[1rem] px-1 py-1 text-left transition hover:bg-stone-50"
                        >
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-sm font-semibold text-stone-950">
                              {invoice.invoice_number}
                            </h3>
                            <StatusBadge
                              label={invoiceStatusLabels[invoice.status]}
                              tone={invoiceTone(invoice.status)}
                            />
                            {balance > 0 && invoice.status !== 'overdue' ? (
                              <StatusBadge label="open balance" tone="warning" />
                            ) : null}
                          </div>

                          <p className="mt-2 text-sm text-stone-900">
                            Issued {formatDate(invoice.issue_date)} • Due {formatDate(invoice.due_date)}
                          </p>
                          {invoice.notes ? (
                            <p className="mt-2 line-clamp-2 text-xs leading-6 text-stone-500">
                              {invoice.notes}
                            </p>
                          ) : null}
                        </button>

                        <div className="text-sm text-stone-500">
                          <p className="text-[11px] uppercase tracking-[0.18em] text-stone-500">
                            Amount
                          </p>
                          <p className="mt-1 font-medium text-stone-900">
                            {formatCurrencyWithDecimals(invoice.amount_total)}
                          </p>
                          <p className="mt-1">
                            Paid {formatCurrencyWithDecimals(invoice.amount_paid)}
                          </p>
                        </div>

                        <div className="text-sm text-stone-500">
                          <p className="text-[11px] uppercase tracking-[0.18em] text-stone-500">
                            Outstanding
                          </p>
                          <p
                            className={
                              invoice.status === 'overdue'
                                ? 'mt-1 font-semibold text-rose-700'
                                : balance > 0
                                  ? 'mt-1 font-semibold text-amber-800'
                                  : 'mt-1 font-semibold text-stone-900'
                            }
                          >
                            {formatCurrencyWithDecimals(balance)}
                          </p>
                          <p className="mt-1">Due {formatDate(invoice.due_date)}</p>
                        </div>

                        <div className="flex flex-wrap items-center justify-end gap-2">
                          {linkedMissions.length > 0 ? (
                            linkedMissions.map((mission) => (
                              <button
                                key={mission.mission_id}
                                type="button"
                                onClick={() => openMission(mission.mission_id)}
                                className={inlineButtonClasses}
                              >
                                {mission.reference}
                              </button>
                            ))
                          ) : (
                            <span className="rounded-full border border-stone-200 bg-stone-100 px-3 py-1.5 text-[11px] font-medium text-stone-600">
                              No linked mission
                            </span>
                          )}
                        </div>
                      </article>
                    )
                  })}
                </div>
              )}
            </SectionCard>
          </div>

          <div className="space-y-5 xl:sticky xl:top-24 xl:self-start">
            <SectionCard>
              <h2 className="font-heading text-2xl font-semibold tracking-tight text-stone-950">
                Account details
              </h2>
              <div className="mt-5 space-y-4">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.18em] text-stone-500">Email</p>
                  <p className="mt-1 text-sm text-stone-900">
                    {client.email || 'No email on file'}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] uppercase tracking-[0.18em] text-stone-500">Phone</p>
                  <p className="mt-1 text-sm text-stone-900">
                    {formatPhoneNumber(client.phone)}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] uppercase tracking-[0.18em] text-stone-500">
                    Address
                  </p>
                  <p className="mt-1 text-sm text-stone-900">
                    {client.address || 'No address on file'}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] uppercase tracking-[0.18em] text-stone-500">
                    Location
                  </p>
                  <p className="mt-1 text-sm text-stone-900">
                    {locationLine || 'No location on file'}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] uppercase tracking-[0.18em] text-stone-500">VAT</p>
                  <p className="mt-1 text-sm text-stone-900">
                    {client.vat_number || 'VAT not provided'}
                  </p>
                </div>
              </div>
            </SectionCard>

            <SectionCard>
              <h2 className="font-heading text-2xl font-semibold tracking-tight text-stone-950">
                Portfolio signals
              </h2>
              <div className="mt-5 space-y-3">
                <div className="rounded-[1.05rem] border border-stone-200 bg-stone-50/90 px-4 py-3">
                  <p className="text-[11px] uppercase tracking-[0.18em] text-stone-500">
                    Active missions
                  </p>
                  <p className="mt-1 text-sm font-medium text-stone-900">
                    {metrics.activeMissionCount} in progress or scheduled
                  </p>
                </div>

                <div
                  className={
                    metrics.overdueInvoiceCount > 0
                      ? 'rounded-[1.05rem] border border-rose-200 bg-rose-50/90 px-4 py-3'
                      : 'rounded-[1.05rem] border border-stone-200 bg-stone-50/90 px-4 py-3'
                  }
                >
                  <p className="text-[11px] uppercase tracking-[0.18em] text-stone-500">
                    Overdue invoices
                  </p>
                  <p
                    className={
                      metrics.overdueInvoiceCount > 0
                        ? 'mt-1 text-sm font-medium text-rose-700'
                        : 'mt-1 text-sm font-medium text-stone-900'
                    }
                  >
                    {metrics.overdueInvoiceCount === 0
                      ? 'No overdue balance'
                      : `${metrics.overdueInvoiceCount} invoice${
                          metrics.overdueInvoiceCount === 1 ? '' : 's'
                        } require follow-up`}
                  </p>
                </div>

                <div
                  className={
                    metrics.activeUninvoicedMissionCount > 0
                      ? 'rounded-[1.05rem] border border-amber-200 bg-amber-50/90 px-4 py-3'
                      : 'rounded-[1.05rem] border border-stone-200 bg-stone-50/90 px-4 py-3'
                  }
                >
                  <p className="text-[11px] uppercase tracking-[0.18em] text-stone-500">
                    Uninvoiced workload
                  </p>
                  <p
                    className={
                      metrics.activeUninvoicedMissionCount > 0
                        ? 'mt-1 text-sm font-medium text-amber-800'
                        : 'mt-1 text-sm font-medium text-stone-900'
                    }
                  >
                    {metrics.activeUninvoicedMissionCount === 0
                      ? 'No active missions waiting for invoicing'
                      : `${metrics.activeUninvoicedMissionCount} active mission${
                          metrics.activeUninvoicedMissionCount === 1 ? '' : 's'
                        } still need billing`}
                  </p>
                </div>

                <div className="rounded-[1.05rem] border border-stone-200 bg-stone-50/90 px-4 py-3">
                  <p className="text-[11px] uppercase tracking-[0.18em] text-stone-500">
                    Margin proxy
                  </p>
                  <p className="mt-1 text-sm font-medium text-stone-900">
                    {formatCurrencyWithDecimals(metrics.marginAmount)} •{' '}
                    {formatPercentage(metrics.marginRatio * 100, 0)}
                  </p>
                  <p className="mt-1 text-xs leading-6 text-stone-500">
                    Uses actual mission cost when available, otherwise estimated cost.
                  </p>
                </div>

                <div className="rounded-[1.05rem] border border-stone-200 bg-stone-50/90 px-4 py-3">
                  <p className="text-[11px] uppercase tracking-[0.18em] text-stone-500">
                    Cost coverage
                  </p>
                  <p className="mt-1 text-sm font-medium text-stone-900">
                    {metrics.actualCostCoverageCount} mission
                    {metrics.actualCostCoverageCount === 1 ? '' : 's'} with actual cost logged
                  </p>
                  <p className="mt-1 text-xs leading-6 text-stone-500">
                    {metrics.marginSensitiveCount} mission
                    {metrics.marginSensitiveCount === 1 ? '' : 's'} flagged margin sensitive.
                  </p>
                </div>
              </div>
            </SectionCard>
          </div>
        </div>
      </div>
    </PageContainer>
  )
}
