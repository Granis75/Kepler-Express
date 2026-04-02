import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'
import * as XLSX from 'xlsx'
import { OperationData, ExportOptions } from '../../types/operations'

// ============================================================================
// Date Formatting
// ============================================================================

export function formatDate(isoDate: string): string {
  try {
    const date = new Date(isoDate)
    return date.toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    })
  } catch {
    return 'N/A'
  }
}

export function formatDateTime(isoDate: string): string {
  try {
    const date = new Date(isoDate)
    return date.toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return 'N/A'
  }
}

// ============================================================================
// Currency Formatting
// ============================================================================

export function formatEuro(amount: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

export function formatEuroShort(amount: number): string {
  return `€ ${amount.toFixed(2).replace('.', ',')}`
}

// ============================================================================
// Status Translation
// ============================================================================

function translateMissionStatus(status: string): string {
  const statusMap: Record<string, string> = {
    pending: 'En attente',
    in_progress: 'En cours',
    completed: 'Terminée',
    cancelled: 'Annulée',
  }
  return statusMap[status] || status
}

function translatePaymentStatus(status: string): string {
  const statusMap: Record<string, string> = {
    unpaid: 'Non payée',
    partial: 'Partiellement payée',
    paid: 'Payée',
  }
  return statusMap[status] || status
}

// ============================================================================
// Data Transformation for Export
// ============================================================================

export function normalizeOperationForExport(operation: OperationData): Record<string, string | number> {
  return {
    ID: operation.id,
    Référence: operation.reference,
    Client: operation.clientName,
    'Date Mission': formatDate(operation.missionDate),
    'Lieu Départ': operation.pickupLocation,
    'Lieu Arrivée': operation.deliveryLocation,
    Chauffeur: operation.driverName,
    Véhicule: operation.vehicle,
    Statut: translateMissionStatus(operation.status),
    'Montant HT': operation.amountHT,
    'Montant TTC': operation.amountTTC,
    'Dépenses Total': operation.expenseTotal,
    Marge: operation.margin,
    'Statut Paiement': translatePaymentStatus(operation.paymentStatus),
    'Créé le': formatDate(operation.createdAt),
  }
}

export function transformDataForExcel(operations: OperationData[]): Record<string, string | number>[] {
  return operations.map(normalizeOperationForExport)
}

// ============================================================================
// Excel Export
// ============================================================================

export function exportToExcel(options: ExportOptions): void {
  if (options.data.length === 0) {
    throw new Error('Aucune donnée à exporter')
  }

  const transformedData = transformDataForExcel(options.data)

  const worksheet = XLSX.utils.json_to_sheet(transformedData, {
    header: Object.keys(transformedData[0]),
  })

  // Set column widths for better readability
  const columnWidths: Record<string, number> = {
    A: 12, // ID
    B: 14, // Référence
    C: 18, // Client
    D: 12, // Date Mission
    E: 18, // Lieu Départ
    F: 18, // Lieu Arrivée
    G: 14, // Chauffeur
    H: 12, // Véhicule
    I: 14, // Statut
    J: 12, // Montant HT
    K: 12, // Montant TTC
    L: 15, // Dépenses Total
    M: 10, // Marge
    N: 16, // Statut Paiement
    O: 12, // Créé le
  }

  worksheet['!cols'] = Object.values(columnWidths).map((width) => ({ wch: width }))

  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Opérations')

  const filename = `${options.filename}_${new Date().toISOString().split('T')[0]}.xlsx`
  XLSX.writeFile(workbook, filename)
}

// ============================================================================
// PDF Generation Styles
// ============================================================================

const pdfStyles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#ffffff',
    padding: 40,
    fontFamily: 'Helvetica',
  },
  header: {
    marginBottom: 30,
    borderBottomWidth: 2,
    borderBottomColor: '#e5e7eb',
    paddingBottom: 15,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 11,
    color: '#6b7280',
    marginBottom: 8,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    fontSize: 9,
    color: '#6b7280',
    marginTop: 4,
  },
  table: {
    marginTop: 20,
    marginBottom: 20,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f3f4f6',
    borderBottomWidth: 1.5,
    borderBottomColor: '#d1d5db',
    padding: 8,
    fontWeight: 'bold',
    fontSize: 9,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 0.5,
    borderBottomColor: '#e5e7eb',
    padding: 8,
    fontSize: 8,
    minHeight: 20,
  },
  tableCell: {
    flex: 1,
    paddingRight: 8,
  },
  tableCellRight: {
    flex: 1,
    paddingRight: 8,
    textAlign: 'right',
  },
  footer: {
    marginTop: 40,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    fontSize: 8,
    color: '#6b7280',
    textAlign: 'center',
  },
  summary: {
    marginTop: 20,
    padding: 12,
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    fontSize: 10,
    marginBottom: 6,
    fontWeight: 'bold',
  },
  summaryLabel: {
    color: '#374151',
  },
  summaryValue: {
    color: '#1f2937',
  },
})

// ============================================================================
// PDF Generation Component
// ============================================================================

export function OperationsPdfDocument({
  operations,
  startDate,
  endDate,
}: {
  operations: OperationData[]
  startDate?: string
  endDate?: string
}) {
  // Calculate totals
  const totalAmountHT = operations.reduce((sum, op) => sum + op.amountHT, 0)
  const totalAmountTTC = operations.reduce((sum, op) => sum + op.amountTTC, 0)
  const totalExpenses = operations.reduce((sum, op) => sum + op.expenseTotal, 0)
  const totalMargin = operations.reduce((sum, op) => sum + op.margin, 0)

  const dateRange = startDate && endDate ? ` (${formatDate(startDate)} - ${formatDate(endDate)})` : ''

  return (
    <Document>
      <Page size="A4" style={pdfStyles.page}>
        {/* Header */}
        <View style={pdfStyles.header}>
          <Text style={pdfStyles.title}>Kepler Express Ops</Text>
          <Text style={pdfStyles.subtitle}>Rapport d'opérations logistiques</Text>
          <View style={pdfStyles.metaRow}>
            <Text>Généré le {formatDateTime(new Date().toISOString())}</Text>
            <Text>Nombre d'opérations: {operations.length}</Text>
          </View>
          {dateRange && <Text style={pdfStyles.subtitle}>{dateRange}</Text>}
        </View>

        {/* Summary */}
        <View style={pdfStyles.summary}>
          <View style={pdfStyles.summaryRow}>
            <Text style={pdfStyles.summaryLabel}>Montant Total HT:</Text>
            <Text style={pdfStyles.summaryValue}>{formatEuroShort(totalAmountHT)}</Text>
          </View>
          <View style={pdfStyles.summaryRow}>
            <Text style={pdfStyles.summaryLabel}>Montant Total TTC:</Text>
            <Text style={pdfStyles.summaryValue}>{formatEuroShort(totalAmountTTC)}</Text>
          </View>
          <View style={pdfStyles.summaryRow}>
            <Text style={pdfStyles.summaryLabel}>Dépenses Totales:</Text>
            <Text style={pdfStyles.summaryValue}>{formatEuroShort(totalExpenses)}</Text>
          </View>
          <View style={pdfStyles.summaryRow}>
            <Text style={pdfStyles.summaryLabel}>Marge Totale:</Text>
            <Text style={pdfStyles.summaryValue}>{formatEuroShort(totalMargin)}</Text>
          </View>
        </View>

        {/* Table Header */}
        <View style={pdfStyles.table}>
          <View style={pdfStyles.tableHeader}>
            <Text style={{ ...pdfStyles.tableCell, flex: 0.8 }}>Réf.</Text>
            <Text style={{ ...pdfStyles.tableCell, flex: 1.2 }}>Client</Text>
            <Text style={{ ...pdfStyles.tableCell, flex: 1.2 }}>Chauffeur</Text>
            <Text style={{ ...pdfStyles.tableCell, flex: 1 }}>Statut</Text>
            <Text style={{ ...pdfStyles.tableCellRight, flex: 0.9 }}>Montant HT</Text>
            <Text style={{ ...pdfStyles.tableCellRight, flex: 0.9 }}>Dépenses</Text>
            <Text style={{ ...pdfStyles.tableCellRight, flex: 0.8 }}>Marge</Text>
          </View>

          {/* Table Rows */}
          {operations.map((op) => (
            <View key={op.id} style={pdfStyles.tableRow}>
              <Text style={{ ...pdfStyles.tableCell, flex: 0.8 }}>{op.reference}</Text>
              <Text style={{ ...pdfStyles.tableCell, flex: 1.2 }}>{op.clientName}</Text>
              <Text style={{ ...pdfStyles.tableCell, flex: 1.2 }}>{op.driverName}</Text>
              <Text style={{ ...pdfStyles.tableCell, flex: 1 }}>{translateMissionStatus(op.status)}</Text>
              <Text style={{ ...pdfStyles.tableCellRight, flex: 0.9 }}>{formatEuroShort(op.amountHT)}</Text>
              <Text style={{ ...pdfStyles.tableCellRight, flex: 0.9 }}>{formatEuroShort(op.expenseTotal)}</Text>
              <Text
                style={{
                  ...pdfStyles.tableCellRight,
                  flex: 0.8,
                  color: op.margin >= 0 ? '#059669' : '#dc2626',
                }}
              >
                {formatEuroShort(op.margin)}
              </Text>
            </View>
          ))}
        </View>

        {/* Footer */}
        <View style={pdfStyles.footer}>
          <Text>
            Kepler Express • Rapport confidentiel • 
            {formatDate(new Date().toISOString())}
          </Text>
        </View>
      </Page>
    </Document>
  )
}

// ============================================================================
// PDF Export
// ============================================================================

export async function exportToPdf(options: ExportOptions): Promise<void> {
  if (options.data.length === 0) {
    throw new Error('Aucune donnée à exporter')
  }

  // Dynamic import of pdf renderer to keep bundle smaller
  const { pdf } = await import('@react-pdf/renderer')

  const doc = (
    <OperationsPdfDocument
      operations={options.data}
      startDate={options.startDate}
      endDate={options.endDate}
    />
  )

  const blob = await pdf(doc).toBlob()
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `${options.filename}_${new Date().toISOString().split('T')[0]}.pdf`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
