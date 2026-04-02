import { getSupabaseClient } from '../supabase'

export type CreatePaymentInput = {
  invoice_id: string
  amount: number
  payment_method: 'bank_transfer' | 'check' | 'cash' | 'card' | 'other'
  payment_date: string
  reference?: string
  notes?: string
}

export type PaymentRecord = {
  payment_id: string
  organization_id: string
  invoice_id: string
  amount: number
  payment_method: CreatePaymentInput['payment_method']
  payment_date: string
  reference?: string
  notes?: string
  created_at: string
  updated_at: string
}

type PaymentRow = {
  payment_id: string
  organization_id: string
  invoice_id: string
  amount: number | string
  payment_method: PaymentRecord['payment_method']
  payment_date: string
  reference: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

function toSafeNumber(value: number | string | null | undefined) {
  const parsed = typeof value === 'number' ? value : Number(value ?? 0)
  return Number.isFinite(parsed) ? parsed : 0
}

function mapPaymentRow(row: PaymentRow): PaymentRecord {
  return {
    payment_id: row.payment_id,
    organization_id: row.organization_id,
    invoice_id: row.invoice_id,
    amount: toSafeNumber(row.amount),
    payment_method: row.payment_method,
    payment_date: row.payment_date,
    reference: row.reference ?? undefined,
    notes: row.notes ?? undefined,
    created_at: row.created_at,
    updated_at: row.updated_at,
  }
}

export async function getPaymentsByInvoice(invoiceId: string): Promise<PaymentRecord[]> {
  const supabase = getSupabaseClient()
  const { data, error } = await supabase
    .from('payments')
    .select(
      'payment_id, organization_id, invoice_id, amount, payment_method, payment_date, reference, notes, created_at, updated_at'
    )
    .eq('invoice_id', invoiceId)
    .order('payment_date', { ascending: false })
    .order('created_at', { ascending: false })

  if (error) {
    throw new Error(error.message || 'Unable to load payments.')
  }

  return (data ?? []).map((row) =>
    mapPaymentRow({
      payment_id: row.payment_id,
      organization_id: row.organization_id,
      invoice_id: row.invoice_id,
      amount: row.amount,
      payment_method: row.payment_method,
      payment_date: row.payment_date,
      reference: row.reference,
      notes: row.notes,
      created_at: row.created_at,
      updated_at: row.updated_at,
    })
  )
}

export async function createPaymentRecord(
  input: CreatePaymentInput
): Promise<PaymentRecord> {
  const supabase = getSupabaseClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError) {
    throw new Error(authError.message || 'Unable to resolve the current session.')
  }

  if (!user) {
    throw new Error('Sign in required to record a payment.')
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('organization_id')
    .eq('user_id', user.id)
    .maybeSingle()

  if (profileError) {
    throw new Error(profileError.message || 'Unable to resolve the current organization.')
  }

  const organizationId = profile?.organization_id

  if (!organizationId) {
    throw new Error('Workspace profile not found for this account.')
  }

  const payload = {
    organization_id: organizationId,
    invoice_id: input.invoice_id,
    amount: toSafeNumber(input.amount),
    payment_method: input.payment_method,
    payment_date: input.payment_date,
    reference: input.reference?.trim() || null,
    notes: input.notes?.trim() || null,
  }

  const { data, error } = await supabase
    .from('payments')
    .insert(payload)
    .select(
      'payment_id, organization_id, invoice_id, amount, payment_method, payment_date, reference, notes, created_at, updated_at'
    )
    .single()

  if (error) {
    throw new Error(error.message || 'Unable to create the payment.')
  }

  return mapPaymentRow({
    payment_id: data.payment_id,
    organization_id: data.organization_id,
    invoice_id: data.invoice_id,
    amount: data.amount,
    payment_method: data.payment_method,
    payment_date: data.payment_date,
    reference: data.reference,
    notes: data.notes,
    created_at: data.created_at,
    updated_at: data.updated_at,
  })
}
