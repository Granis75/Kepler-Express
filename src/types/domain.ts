import type {
  ClientStatus,
  InvoiceStatus,
  MissionStatus,
  PaymentMethod,
} from './enums'

export type ExpenseType = 'fuel' | 'tolls' | 'mission' | 'maintenance' | 'other'
export type ExpenseApprovalStatus = 'pending' | 'approved' | 'paid' | 'rejected'

export interface Client {
  client_id: string
  organization_id: string
  name: string
  email: string
  phone: string
  address: string
  city: string
  postal_code: string
  country: string
  vat_number?: string
  status: ClientStatus
  notes?: string
  created_at: string
  updated_at: string
}

export interface Mission {
  mission_id: string
  organization_id: string
  client_id: string
  reference: string
  status: MissionStatus
  driver_name?: string
  vehicle_name?: string
  revenue_amount: number
  estimated_cost_amount: number
  actual_cost_amount: number
  departure_location: string
  arrival_location: string
  departure_datetime: string
  arrival_datetime?: string
  notes?: string
  created_at: string
  updated_at: string
}

export interface Expense {
  expense_id: string
  organization_id: string
  mission_id?: string
  driver_name?: string
  vehicle_name?: string
  expense_type: ExpenseType
  amount: number
  advanced_by_driver: boolean
  approval_status: ExpenseApprovalStatus
  receipt_url?: string
  receipt_present: boolean
  expense_date: string
  notes?: string
  created_at: string
  updated_at: string
}

export interface Invoice {
  invoice_id: string
  organization_id: string
  client_id: string
  invoice_number: string
  mission_ids: string[]
  amount_total: number
  amount_paid: number
  status: InvoiceStatus
  issue_date: string
  due_date: string
  notes?: string
  created_at: string
  updated_at: string
}

export interface Payment {
  payment_id: string
  organization_id: string
  invoice_id: string
  amount: number
  payment_method: PaymentMethod
  payment_date: string
  reference?: string
  notes?: string
  created_at: string
  updated_at: string
}
