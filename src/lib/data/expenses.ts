import type { CreateExpenseInput, Expense } from '../../types'
import { Currency, ExpenseType, ReimbursementStatus } from '../../types'
import { normalizeExpenseReimbursementStatus } from '../domain'
import type { Database } from './database'
import { DataLayerError, toDataLayerError } from './errors'
import { getCurrentOrganizationId } from './session'
import { getSupabaseClient } from './supabase'

type ExpenseRow = Database['public']['Tables']['expenses']['Row']
type ExpenseInsert = Database['public']['Tables']['expenses']['Insert']
type ExpensePayload = Omit<ExpenseInsert, 'organization_id'>

function mapExpenseRow(row: ExpenseRow): Expense {
  return {
    expense_id: row.expense_id,
    organization_id: row.organization_id,
    mission_id: row.mission_id ?? undefined,
    driver_id: row.driver_id ?? undefined,
    vehicle_id: row.vehicle_id ?? undefined,
    type: row.type as ExpenseType,
    amount: Number(row.amount),
    currency: row.currency as Currency,
    advanced_by_driver: row.advanced_by_driver,
    reimbursement_status: row.reimbursement_status as ReimbursementStatus,
    receipt_attached: row.receipt_attached,
    description: row.description ?? undefined,
    expense_date: row.expense_date,
    created_at: row.created_at ?? '',
    updated_at: row.updated_at ?? '',
  }
}

function getExpensePayload(input: CreateExpenseInput) {
  const payload: ExpensePayload = {
    mission_id: input.mission_id || null,
    driver_id: input.driver_id || null,
    vehicle_id: input.vehicle_id || null,
    type: input.type as ExpenseInsert['type'],
    amount: Number(input.amount.toFixed(2)),
    currency: (input.currency ?? Currency.EUR) as ExpenseInsert['currency'],
    advanced_by_driver: input.advanced_by_driver,
    reimbursement_status: normalizeExpenseReimbursementStatus(
      input.advanced_by_driver,
      input.reimbursement_status
    ) as ExpenseInsert['reimbursement_status'],
    receipt_attached: input.receipt_attached,
    description: input.description?.trim() || null,
    expense_date: input.expense_date,
  }

  return payload
}

export async function listExpenses() {
  const supabase = getSupabaseClient()
  const { data, error } = await supabase
    .from('expenses')
    .select('*')
    .order('expense_date', { ascending: false })
    .order('created_at', { ascending: false })

  if (error) {
    throw toDataLayerError(error, 'Unable to load expenses.')
  }

  return (data ?? []).map(mapExpenseRow)
}

export async function createExpense(input: CreateExpenseInput) {
  const supabase = getSupabaseClient()
  const organizationId = await getCurrentOrganizationId()

  const { data, error } = await supabase
    .from('expenses')
    .insert({
      organization_id: organizationId,
      ...getExpensePayload(input),
    })
    .select('*')
    .single()

  if (error) {
    throw toDataLayerError(error, 'Unable to create the expense.')
  }

  return mapExpenseRow(data)
}

export async function updateExpense(expenseId: string, input: CreateExpenseInput) {
  const supabase = getSupabaseClient()
  const { data, error } = await supabase
    .from('expenses')
    .update(getExpensePayload(input))
    .eq('expense_id', expenseId)
    .select('*')
    .maybeSingle()

  if (error) {
    throw toDataLayerError(error, 'Unable to update the expense.')
  }

  if (!data) {
    throw new DataLayerError('Expense not found or inaccessible.')
  }

  return mapExpenseRow(data)
}
