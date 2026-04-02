import type { Invoice } from '../../types/domain'
import { getSupabaseClient } from '../supabase'

type InvoiceRow = {
  invoice_id: string
  organization_id: string
  client_id: string
  invoice_number: string
  mission_ids: string[] | null
  amount_total: number | string
  amount_paid: number | string
  status: Invoice['status']
  issue_date: string
  due_date: string
  notes: string | null
  created_at: string
  updated_at: string
}

function toSafeNumber(value: number | string | null | undefined) {
  const parsed = typeof value === 'number' ? value : Number(value ?? 0)
  return Number.isFinite(parsed) ? parsed : 0
}

function mapInvoiceRow(row: InvoiceRow): Invoice {
  return {
    invoice_id: row.invoice_id,
    organization_id: row.organization_id,
    client_id: row.client_id,
    invoice_number: row.invoice_number,
    mission_ids: Array.isArray(row.mission_ids) ? row.mission_ids : [],
    amount_total: toSafeNumber(row.amount_total),
    amount_paid: toSafeNumber(row.amount_paid),
    status: row.status,
    issue_date: row.issue_date,
    due_date: row.due_date,
    notes: row.notes ?? undefined,
    created_at: row.created_at,
    updated_at: row.updated_at,
  }
}

export async function getInvoices(): Promise<Invoice[]> {
  const supabase = getSupabaseClient()
  const { data, error } = await supabase
    .from('invoices')
    .select(
      'invoice_id, organization_id, client_id, invoice_number, mission_ids, amount_total, amount_paid, status, issue_date, due_date, notes, created_at, updated_at'
    )
    .order('invoice_number', { ascending: false })

  if (error) {
    throw new Error(error.message || 'Unable to load invoices.')
  }

  return (data ?? []).map((row) =>
    mapInvoiceRow({
      invoice_id: row.invoice_id,
      organization_id: row.organization_id,
      client_id: row.client_id,
      invoice_number: row.invoice_number,
      mission_ids: row.mission_ids,
      amount_total: row.amount_total,
      amount_paid: row.amount_paid,
      status: row.status,
      issue_date: row.issue_date,
      due_date: row.due_date,
      notes: row.notes,
      created_at: row.created_at,
      updated_at: row.updated_at,
    })
  )
}

export async function getInvoiceById(invoiceId: string): Promise<Invoice> {
  const supabase = getSupabaseClient()
  const { data, error } = await supabase
    .from('invoices')
    .select(
      'invoice_id, organization_id, client_id, invoice_number, mission_ids, amount_total, amount_paid, status, issue_date, due_date, notes, created_at, updated_at'
    )
    .eq('invoice_id', invoiceId)
    .maybeSingle()

  if (error) {
    throw new Error(error.message || 'Unable to load the invoice.')
  }

  if (!data) {
    throw new Error('Invoice not found or inaccessible.')
  }

  return mapInvoiceRow({
    invoice_id: data.invoice_id,
    organization_id: data.organization_id,
    client_id: data.client_id,
    invoice_number: data.invoice_number,
    mission_ids: data.mission_ids,
    amount_total: data.amount_total,
    amount_paid: data.amount_paid,
    status: data.status,
    issue_date: data.issue_date,
    due_date: data.due_date,
    notes: data.notes,
    created_at: data.created_at,
    updated_at: data.updated_at,
  })
}
