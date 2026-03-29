import type {
  CreateInvoiceInput,
  CreatePaymentInput,
  Invoice,
  Payment,
} from '../../types'
import { Currency, InvoiceStatus, PaymentMethod } from '../../types'
import { calculateTotalPayments } from '../calculations'
import { getInvoiceStatusFromPayment } from '../domain'
import type { Database } from './database'
import { toDataLayerError } from './errors'
import { getCurrentOrganizationId } from './session'
import { getSupabaseClient } from './supabase'

type InvoiceRow = Database['public']['Tables']['invoices']['Row']
type PaymentRow = Database['public']['Tables']['payments']['Row']
type InvoiceInsert = Database['public']['Tables']['invoices']['Insert']
type InvoiceUpdate = Database['public']['Tables']['invoices']['Update']
type PaymentInsert = Database['public']['Tables']['payments']['Insert']
type InvoicePayload = Omit<InvoiceInsert, 'organization_id'>

function mapPaymentRow(row: PaymentRow): Payment {
  return {
    payment_id: row.payment_id,
    invoice_id: row.invoice_id,
    amount: Number(row.amount),
    currency: row.currency as Currency,
    payment_method: row.payment_method as PaymentMethod,
    payment_date: row.payment_date,
    reference: row.reference ?? undefined,
    notes: row.notes ?? undefined,
    created_at: row.created_at ?? '',
  }
}

function mapInvoiceRow(row: InvoiceRow): Invoice {
  return {
    invoice_id: row.invoice_id,
    organization_id: row.organization_id,
    client_id: row.client_id,
    invoice_number: row.invoice_number,
    status: row.status as InvoiceStatus,
    mission_ids: Array.isArray(row.mission_ids) ? row.mission_ids : [],
    amount_total: Number(row.amount_total),
    amount_paid: Number(row.amount_paid),
    currency: row.currency as Currency,
    issued_date: row.issued_date,
    due_date: row.due_date,
    sent_date: row.sent_date ?? undefined,
    paid_date: row.paid_date ?? undefined,
    notes: row.notes ?? undefined,
    created_at: row.created_at ?? '',
    updated_at: row.updated_at ?? '',
  }
}

function hydrateInvoice(row: InvoiceRow, payments: Payment[]) {
  const amountPaid = Number(calculateTotalPayments(payments).toFixed(2))
  const latestPaymentDate =
    payments.length > 0
      ? [...payments]
          .sort(
            (left, right) =>
              new Date(right.payment_date).getTime() - new Date(left.payment_date).getTime()
          )[0]?.payment_date
      : undefined

  const workflowStatus =
    row.status === InvoiceStatus.Draft
      ? InvoiceStatus.Draft
      : row.status === InvoiceStatus.Cancelled
        ? InvoiceStatus.Cancelled
        : InvoiceStatus.Sent

  return {
    ...mapInvoiceRow(row),
    amount_paid: amountPaid,
    paid_date: amountPaid >= Number(row.amount_total) ? latestPaymentDate : undefined,
    status: getInvoiceStatusFromPayment(
      workflowStatus,
      Number(row.amount_total),
      amountPaid,
      row.due_date
    ),
  }
}

function getInvoicePayload(input: CreateInvoiceInput, existingInvoice?: Invoice) {
  const workflowStatus =
    input.status === InvoiceStatus.Draft ? InvoiceStatus.Draft : InvoiceStatus.Sent

  const payload: InvoicePayload = {
    invoice_number: input.invoice_number.trim(),
    client_id: input.client_id,
    mission_ids: input.mission_ids,
    amount_total: Number(input.amount_total.toFixed(2)),
    amount_paid: existingInvoice?.amount_paid ?? 0,
    currency: (input.currency ?? existingInvoice?.currency ?? Currency.EUR) as InvoiceInsert['currency'],
    issued_date: input.issued_date,
    due_date: input.due_date,
    status: workflowStatus as InvoiceInsert['status'],
    sent_date:
      workflowStatus === InvoiceStatus.Sent
        ? existingInvoice?.sent_date ?? new Date(input.issued_date).toISOString()
        : null,
    paid_date: existingInvoice?.paid_date ?? null,
    notes: input.notes?.trim() || null,
  }

  return payload
}

export async function listPaymentsByInvoiceId(invoiceId: string) {
  const supabase = getSupabaseClient()
  const { data, error } = await supabase
    .from('payments')
    .select('*')
    .eq('invoice_id', invoiceId)
    .order('payment_date', { ascending: false })
    .order('created_at', { ascending: false })

  if (error) {
    throw toDataLayerError(error, 'Unable to load payments.')
  }

  return (data ?? []).map(mapPaymentRow)
}

export async function listInvoices() {
  const supabase = getSupabaseClient()
  const [{ data: invoiceRows, error: invoiceError }, { data: paymentRows, error: paymentError }] =
    await Promise.all([
      supabase.from('invoices').select('*').order('invoice_number', { ascending: false }),
      supabase.from('payments').select('*'),
    ])

  if (invoiceError) {
    throw toDataLayerError(invoiceError, 'Unable to load invoices.')
  }

  if (paymentError) {
    throw toDataLayerError(paymentError, 'Unable to load payments.')
  }

  const payments = (paymentRows ?? []).map(mapPaymentRow)

  return (invoiceRows ?? []).map((row) =>
    hydrateInvoice(
      row,
      payments.filter((payment) => payment.invoice_id === row.invoice_id)
    )
  )
}

export async function getInvoiceById(invoiceId: string) {
  const supabase = getSupabaseClient()
  const [{ data: invoiceRow, error: invoiceError }, payments] = await Promise.all([
    supabase.from('invoices').select('*').eq('invoice_id', invoiceId).single(),
    listPaymentsByInvoiceId(invoiceId),
  ])

  if (invoiceError) {
    throw toDataLayerError(invoiceError, 'Unable to load the invoice.')
  }

  return hydrateInvoice(invoiceRow, payments)
}

export async function createInvoice(input: CreateInvoiceInput) {
  const supabase = getSupabaseClient()
  const organizationId = await getCurrentOrganizationId()
  const { data, error } = await supabase
    .from('invoices')
    .insert({
      organization_id: organizationId,
      ...getInvoicePayload(input),
    })
    .select('*')
    .single()

  if (error) {
    throw toDataLayerError(error, 'Unable to create the invoice.')
  }

  return hydrateInvoice(data, [])
}

export async function updateInvoice(
  invoiceId: string,
  input: CreateInvoiceInput,
  existingInvoice?: Invoice,
) {
  const supabase = getSupabaseClient()
  const { data, error } = await supabase
    .from('invoices')
    .update(getInvoicePayload(input, existingInvoice))
    .eq('invoice_id', invoiceId)
    .select('*')
    .single()

  if (error) {
    throw toDataLayerError(error, 'Unable to update the invoice.')
  }

  const payments = await listPaymentsByInvoiceId(invoiceId)
  return hydrateInvoice(data, payments)
}

async function syncInvoicePaymentState(invoiceId: string) {
  const supabase = getSupabaseClient()
  const invoice = await getInvoiceById(invoiceId)

  const payload: InvoiceUpdate = {
    amount_paid: invoice.amount_paid,
    status: invoice.status as InvoiceUpdate['status'],
    paid_date: invoice.paid_date ?? null,
  }

  const { data, error } = await supabase
    .from('invoices')
    .update(payload)
    .eq('invoice_id', invoiceId)
    .select('*')
    .single()

  if (error) {
    throw toDataLayerError(error, 'Unable to synchronize invoice payment status.')
  }

  const payments = await listPaymentsByInvoiceId(invoiceId)
  return hydrateInvoice(data, payments)
}

export async function createPayment(input: CreatePaymentInput) {
  const supabase = getSupabaseClient()
  const organizationId = await getCurrentOrganizationId()
  const payload: PaymentInsert = {
    organization_id: organizationId,
    invoice_id: input.invoice_id,
    amount: Number(input.amount.toFixed(2)),
    currency: (input.currency ?? Currency.EUR) as PaymentInsert['currency'],
    payment_method: input.payment_method as PaymentInsert['payment_method'],
    payment_date: input.payment_date,
    reference: input.reference?.trim() || null,
    notes: input.notes?.trim() || null,
  }

  const { data, error } = await supabase
    .from('payments')
    .insert(payload)
    .select('*')
    .single()

  if (error) {
    throw toDataLayerError(error, 'Unable to create the payment.')
  }

  await syncInvoicePaymentState(input.invoice_id)

  return mapPaymentRow(data)
}
