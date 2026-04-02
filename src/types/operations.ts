export type MissionStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled'
export type PaymentStatus = 'unpaid' | 'partial' | 'paid'

export interface OperationData {
  id: string
  reference: string
  clientName: string
  missionDate: string // ISO 8601
  pickupLocation: string
  deliveryLocation: string
  driverName: string
  vehicle: string
  status: MissionStatus
  amountHT: number // Montant HT en euros
  amountTTC: number // Montant TTC en euros
  expenseTotal: number // Total des dépenses en euros
  margin: number // Marge nette en euros (amountHT - expenseTotal)
  paymentStatus: PaymentStatus
  createdAt: string // ISO 8601
}

export interface ExportOptions {
  filename: string
  data: OperationData[]
  startDate?: string
  endDate?: string
}
