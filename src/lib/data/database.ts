export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          profile_id: string
          user_id: string
          organization_id: string
          role: 'admin' | 'manager' | 'accountant' | 'driver'
          status: 'active' | 'inactive' | 'invited'
          name: string
          email: string
          phone: string | null
          avatar_url: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          profile_id?: string
          user_id: string
          organization_id: string
          role?: 'admin' | 'manager' | 'accountant' | 'driver'
          status?: 'active' | 'inactive' | 'invited'
          name: string
          email: string
          phone?: string | null
          avatar_url?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: Partial<Database['public']['Tables']['profiles']['Insert']>
        Relationships: []
      }
      clients: {
        Row: {
          client_id: string
          organization_id: string
          name: string
          email: string
          phone: string
          address: string
          city: string
          postal_code: string
          country: string
          vat_number: string | null
          status: 'active' | 'inactive' | 'archived'
          notes: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          client_id?: string
          organization_id: string
          name: string
          email: string
          phone: string
          address: string
          city: string
          postal_code: string
          country?: string
          vat_number?: string | null
          status?: 'active' | 'inactive' | 'archived'
          notes?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: Partial<Database['public']['Tables']['clients']['Insert']>
        Relationships: []
      }
      drivers: {
        Row: {
          driver_id: string
          organization_id: string
          name: string
          email: string | null
          phone: string
          license_number: string
          license_expiry: string
          status: 'active' | 'inactive' | 'on_leave' | 'suspended'
          date_of_birth: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          driver_id?: string
          organization_id: string
          name: string
          email?: string | null
          phone: string
          license_number: string
          license_expiry: string
          status?: 'active' | 'inactive' | 'on_leave' | 'suspended'
          date_of_birth?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: Partial<Database['public']['Tables']['drivers']['Insert']>
        Relationships: []
      }
      vehicles: {
        Row: {
          vehicle_id: string
          organization_id: string
          name: string
          license_plate: string
          registration_number: string
          vehicle_type: 'van' | 'truck' | 'car' | 'trailer'
          status: 'active' | 'watch' | 'service_due' | 'out_of_service' | 'retired'
          mileage_current: number
          mileage_last_service: number
          next_service_mileage: number
          capacity_kg: number | null
          capacity_m3: number | null
          last_service_date: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          vehicle_id?: string
          organization_id: string
          name: string
          license_plate: string
          registration_number: string
          vehicle_type: 'van' | 'truck' | 'car' | 'trailer'
          status?: 'active' | 'watch' | 'service_due' | 'out_of_service' | 'retired'
          mileage_current: number
          mileage_last_service?: number
          next_service_mileage: number
          capacity_kg?: number | null
          capacity_m3?: number | null
          last_service_date?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: Partial<Database['public']['Tables']['vehicles']['Insert']>
        Relationships: []
      }
      missions: {
        Row: {
          mission_id: string
          organization_id: string
          client_id: string
          driver_id: string | null
          vehicle_id: string | null
          reference: string
          status: 'planned' | 'assigned' | 'in_progress' | 'delivered' | 'issue' | 'cancelled'
          revenue_amount: number
          estimated_cost_amount: number
          actual_cost_amount: number | null
          currency: 'EUR' | 'USD' | 'GBP'
          departure_location: string
          arrival_location: string
          departure_datetime: string
          arrival_datetime: string | null
          notes: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          mission_id?: string
          organization_id: string
          client_id: string
          driver_id?: string | null
          vehicle_id?: string | null
          reference: string
          status?: 'planned' | 'assigned' | 'in_progress' | 'delivered' | 'issue' | 'cancelled'
          revenue_amount: number
          estimated_cost_amount: number
          actual_cost_amount?: number | null
          currency?: 'EUR' | 'USD' | 'GBP'
          departure_location: string
          arrival_location: string
          departure_datetime: string
          arrival_datetime?: string | null
          notes?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: Partial<Database['public']['Tables']['missions']['Insert']>
        Relationships: []
      }
      expenses: {
        Row: {
          expense_id: string
          organization_id: string
          mission_id: string | null
          driver_id: string | null
          vehicle_id: string | null
          type:
            | 'fuel'
            | 'tolls'
            | 'maintenance'
            | 'mission_expense'
            | 'parking'
            | 'meal'
            | 'other'
          amount: number
          currency: 'EUR' | 'USD' | 'GBP'
          advanced_by_driver: boolean
          reimbursement_status: 'pending' | 'approved' | 'paid' | 'rejected'
          receipt_attached: boolean
          description: string | null
          expense_date: string
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          expense_id?: string
          organization_id: string
          mission_id?: string | null
          driver_id?: string | null
          vehicle_id?: string | null
          type:
            | 'fuel'
            | 'tolls'
            | 'maintenance'
            | 'mission_expense'
            | 'parking'
            | 'meal'
            | 'other'
          amount: number
          currency?: 'EUR' | 'USD' | 'GBP'
          advanced_by_driver?: boolean
          reimbursement_status?: 'pending' | 'approved' | 'paid' | 'rejected'
          receipt_attached?: boolean
          description?: string | null
          expense_date: string
          created_at?: string | null
          updated_at?: string | null
        }
        Update: Partial<Database['public']['Tables']['expenses']['Insert']>
        Relationships: []
      }
      maintenance_records: {
        Row: {
          maintenance_id: string
          vehicle_id: string
          organization_id: string
          type: 'scheduled' | 'unscheduled' | 'repair' | 'inspection'
          description: string
          cost_amount: number
          currency: 'EUR' | 'USD' | 'GBP'
          mileage_at_service: number
          next_service_mileage: number
          service_date: string
          completed_at: string | null
          created_at: string | null
        }
        Insert: {
          maintenance_id?: string
          vehicle_id: string
          organization_id: string
          type: 'scheduled' | 'unscheduled' | 'repair' | 'inspection'
          description: string
          cost_amount: number
          currency?: 'EUR' | 'USD' | 'GBP'
          mileage_at_service: number
          next_service_mileage: number
          service_date: string
          completed_at?: string | null
          created_at?: string | null
        }
        Update: Partial<Database['public']['Tables']['maintenance_records']['Insert']>
        Relationships: []
      }
      invoices: {
        Row: {
          invoice_id: string
          organization_id: string
          client_id: string
          invoice_number: string
          status: 'draft' | 'sent' | 'partial' | 'paid' | 'overdue' | 'cancelled'
          mission_ids: string[]
          amount_total: number
          amount_paid: number
          currency: 'EUR' | 'USD' | 'GBP'
          issued_date: string
          due_date: string
          sent_date: string | null
          paid_date: string | null
          notes: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          invoice_id?: string
          organization_id: string
          client_id: string
          invoice_number: string
          status?: 'draft' | 'sent' | 'partial' | 'paid' | 'overdue' | 'cancelled'
          mission_ids: string[]
          amount_total: number
          amount_paid?: number
          currency?: 'EUR' | 'USD' | 'GBP'
          issued_date: string
          due_date: string
          sent_date?: string | null
          paid_date?: string | null
          notes?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: Partial<Database['public']['Tables']['invoices']['Insert']>
        Relationships: []
      }
      payments: {
        Row: {
          payment_id: string
          invoice_id: string
          organization_id: string
          amount: number
          currency: 'EUR' | 'USD' | 'GBP'
          payment_method: 'bank_transfer' | 'check' | 'cash' | 'card' | 'other'
          payment_date: string
          reference: string | null
          notes: string | null
          created_at: string | null
        }
        Insert: {
          payment_id?: string
          invoice_id: string
          organization_id: string
          amount: number
          currency?: 'EUR' | 'USD' | 'GBP'
          payment_method: 'bank_transfer' | 'check' | 'cash' | 'card' | 'other'
          payment_date: string
          reference?: string | null
          notes?: string | null
          created_at?: string | null
        }
        Update: Partial<Database['public']['Tables']['payments']['Insert']>
        Relationships: []
      }
    }
    Views: {
      invoice_status_detail: {
        Row: {
          invoice_id: string | null
          organization_id: string | null
          status: string | null
          amount_total: number | null
          total_paid: number | null
          remaining_balance: number | null
          payment_percentage: number | null
          calculated_status: string | null
          due_date: string | null
        }
        Relationships: []
      }
    }
    Functions: Record<string, never>
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}
