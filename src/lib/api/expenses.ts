import type { Expense } from '../../types/domain'
import { getSupabaseClient } from '../supabase'

export type CreateExpenseInput = {
  mission_id?: string
  driver_name?: string
  vehicle_name?: string
  expense_type: Expense['expense_type']
  amount: number
  advanced_by_driver: boolean
  approval_status: Expense['approval_status']
  receipt_url?: string
  receipt_present: boolean
  expense_date: string
  notes?: string
}

type ExpenseRow = {
  expense_id: string
  organization_id: string
  mission_id: string | null
  driver_name: string | null
  vehicle_name: string | null
  expense_type: Expense['expense_type']
  amount: number | string
  advanced_by_driver: boolean
  approval_status: Expense['approval_status']
  receipt_url: string | null
  receipt_present: boolean
  expense_date: string
  notes: string | null
  created_at: string
  updated_at: string
}

function toSafeNumber(value: number | string | null | undefined) {
  const parsed = typeof value === 'number' ? value : Number(value ?? 0)
  return Number.isFinite(parsed) ? parsed : 0
}

function mapExpenseRow(row: ExpenseRow): Expense {
  return {
    expense_id: row.expense_id,
    organization_id: row.organization_id,
    mission_id: row.mission_id ?? undefined,
    driver_name: row.driver_name ?? undefined,
    vehicle_name: row.vehicle_name ?? undefined,
    expense_type: row.expense_type,
    amount: toSafeNumber(row.amount),
    advanced_by_driver: row.advanced_by_driver,
    approval_status: row.approval_status,
    receipt_url: row.receipt_url ?? undefined,
    receipt_present: row.receipt_present,
    expense_date: row.expense_date,
    notes: row.notes ?? undefined,
    created_at: row.created_at,
    updated_at: row.updated_at,
  }
}

function getExpensePayload(input: CreateExpenseInput) {
  return {
    mission_id: input.mission_id ?? null,
    driver_name: input.driver_name?.trim() || null,
    vehicle_name: input.vehicle_name?.trim() || null,
    expense_type: input.expense_type,
    amount: toSafeNumber(input.amount),
    advanced_by_driver: input.advanced_by_driver,
    approval_status: input.approval_status,
    receipt_url: input.receipt_url?.trim() || null,
    receipt_present: input.receipt_present,
    expense_date: input.expense_date,
    notes: input.notes?.trim() || null,
  }
}

export async function getExpenses(): Promise<Expense[]> {
  const supabase = getSupabaseClient()
  const { data, error } = await supabase
    .from('expenses')
    .select(
      'expense_id, organization_id, mission_id, driver_name, vehicle_name, expense_type, amount, advanced_by_driver, approval_status, receipt_url, receipt_present, expense_date, notes, created_at, updated_at'
    )
    .order('expense_date', { ascending: false })
    .order('created_at', { ascending: false })

  if (error) {
    throw new Error(error.message || 'Unable to load expenses.')
  }

  return (data ?? []).map((row) =>
    mapExpenseRow({
      expense_id: row.expense_id,
      organization_id: row.organization_id,
      mission_id: row.mission_id,
      driver_name: row.driver_name,
      vehicle_name: row.vehicle_name,
      expense_type: row.expense_type,
      amount: row.amount,
      advanced_by_driver: row.advanced_by_driver,
      approval_status: row.approval_status,
      receipt_url: row.receipt_url,
      receipt_present: row.receipt_present,
      expense_date: row.expense_date,
      notes: row.notes,
      created_at: row.created_at,
      updated_at: row.updated_at,
    })
  )
}

export async function createExpenseRecord(
  input: CreateExpenseInput
): Promise<Expense> {
  const supabase = getSupabaseClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError) {
    throw new Error(authError.message || 'Unable to resolve the current session.')
  }

  if (!user) {
    throw new Error('Sign in required to create an expense.')
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

  const { data, error } = await supabase
    .from('expenses')
    .insert({
      organization_id: organizationId,
      ...getExpensePayload(input),
    })
    .select(
      'expense_id, organization_id, mission_id, driver_name, vehicle_name, expense_type, amount, advanced_by_driver, approval_status, receipt_url, receipt_present, expense_date, notes, created_at, updated_at'
    )
    .single()

  if (error) {
    throw new Error(error.message || 'Unable to create the expense.')
  }

  return mapExpenseRow({
    expense_id: data.expense_id,
    organization_id: data.organization_id,
    mission_id: data.mission_id,
    driver_name: data.driver_name,
    vehicle_name: data.vehicle_name,
    expense_type: data.expense_type,
    amount: data.amount,
    advanced_by_driver: data.advanced_by_driver,
    approval_status: data.approval_status,
    receipt_url: data.receipt_url,
    receipt_present: data.receipt_present,
    expense_date: data.expense_date,
    notes: data.notes,
    created_at: data.created_at,
    updated_at: data.updated_at,
  })
}

export async function updateExpenseRecord(
  expenseId: string,
  input: CreateExpenseInput
): Promise<Expense> {
  const supabase = getSupabaseClient()
  const { data, error } = await supabase
    .from('expenses')
    .update(getExpensePayload(input))
    .eq('expense_id', expenseId)
    .select(
      'expense_id, organization_id, mission_id, driver_name, vehicle_name, expense_type, amount, advanced_by_driver, approval_status, receipt_url, receipt_present, expense_date, notes, created_at, updated_at'
    )
    .maybeSingle()

  if (error) {
    throw new Error(error.message || 'Unable to update the expense.')
  }

  if (!data) {
    throw new Error('Expense not found or inaccessible.')
  }

  return mapExpenseRow({
    expense_id: data.expense_id,
    organization_id: data.organization_id,
    mission_id: data.mission_id,
    driver_name: data.driver_name,
    vehicle_name: data.vehicle_name,
    expense_type: data.expense_type,
    amount: data.amount,
    advanced_by_driver: data.advanced_by_driver,
    approval_status: data.approval_status,
    receipt_url: data.receipt_url,
    receipt_present: data.receipt_present,
    expense_date: data.expense_date,
    notes: data.notes,
    created_at: data.created_at,
    updated_at: data.updated_at,
  })
}
