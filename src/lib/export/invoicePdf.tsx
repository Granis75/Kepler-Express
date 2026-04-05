import { Document, Page, StyleSheet, Text, View } from '@react-pdf/renderer'
import { getPaymentMethodLabel } from '../domain'
import { formatCurrencyWithDecimals, formatDate, formatDateTime, formatPhoneNumber } from '../utils'
import type { PaymentRecord } from '../api/payments'
import type { Client, Invoice, Mission } from '../../types/domain'
import { PaymentMethod } from '../../types/enums'

interface InvoicePdfPayload {
  invoice: Invoice
  client: Client | null
  linkedMissions: Mission[]
  payments: PaymentRecord[]
  outstanding: number
  organizationName?: string | null
  paymentSummaryNote?: string | null
}

const invoiceStatusLabels: Record<Invoice['status'], string> = {
  draft: 'Draft',
  sent: 'Sent',
  partial: 'Partial',
  paid: 'Paid',
  overdue: 'Overdue',
  cancelled: 'Cancelled',
}

const missionStatusLabels: Record<Mission['status'], string> = {
  planned: 'Planned',
  assigned: 'Assigned',
  in_progress: 'In progress',
  delivered: 'Delivered',
  issue: 'Issue',
  cancelled: 'Cancelled',
}

const styles = StyleSheet.create({
  page: {
    backgroundColor: '#ffffff',
    paddingTop: 34,
    paddingBottom: 34,
    paddingHorizontal: 34,
    fontFamily: 'Helvetica',
    color: '#1c1917',
    fontSize: 10,
    lineHeight: 1.45,
  },
  header: {
    marginBottom: 20,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#d6d3d1',
  },
  brand: {
    fontSize: 11,
    letterSpacing: 1.1,
    textTransform: 'uppercase',
    color: '#78716c',
    marginBottom: 6,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
  },
  titleBlock: {
    flexGrow: 1,
    flexShrink: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1c1917',
  },
  subtitle: {
    marginTop: 4,
    fontSize: 11,
    color: '#57534e',
  },
  statusPill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#d6d3d1',
    backgroundColor: '#fafaf9',
  },
  statusText: {
    fontSize: 9,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    color: '#44403c',
  },
  metaRow: {
    marginTop: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    fontSize: 9,
    color: '#78716c',
  },
  grid: {
    flexDirection: 'row',
    gap: 14,
    marginBottom: 18,
  },
  card: {
    flexGrow: 1,
    flexBasis: 0,
    borderWidth: 1,
    borderColor: '#e7e5e4',
    backgroundColor: '#fafaf9',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  cardLabel: {
    fontSize: 9,
    textTransform: 'uppercase',
    letterSpacing: 0.9,
    color: '#78716c',
    marginBottom: 6,
  },
  cardValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1c1917',
  },
  cardDetail: {
    marginTop: 4,
    fontSize: 9,
    color: '#57534e',
  },
  twoColumn: {
    flexDirection: 'row',
    gap: 18,
    alignItems: 'flex-start',
  },
  mainColumn: {
    flexGrow: 1.5,
    flexBasis: 0,
  },
  sideColumn: {
    flexGrow: 1,
    flexBasis: 0,
  },
  section: {
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e7e5e4',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#1c1917',
    marginBottom: 8,
  },
  sectionCopy: {
    fontSize: 10,
    color: '#57534e',
  },
  fieldList: {
    marginTop: 2,
  },
  fieldRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 6,
  },
  fieldLabel: {
    fontSize: 9,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    color: '#78716c',
    flexShrink: 0,
  },
  fieldValue: {
    fontSize: 10,
    color: '#1c1917',
    textAlign: 'right',
    flexGrow: 1,
  },
  listItem: {
    paddingTop: 8,
    paddingBottom: 8,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  listItemFirst: {
    borderTopWidth: 0,
    paddingTop: 0,
  },
  rowHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
    alignItems: 'flex-start',
  },
  rowTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#1c1917',
  },
  rowMeta: {
    marginTop: 3,
    fontSize: 9,
    color: '#57534e',
  },
  rowSubtle: {
    marginTop: 2,
    fontSize: 8.5,
    color: '#78716c',
  },
  note: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#e7e5e4',
    fontSize: 9,
    color: '#57534e',
  },
  footer: {
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#e7e5e4',
    fontSize: 8,
    textAlign: 'center',
    color: '#78716c',
  },
})

function getCollectionLabel(invoice: Invoice, outstanding: number) {
  if (invoice.status === 'overdue' && outstanding > 0) {
    return 'Overdue'
  }

  if (invoice.status === 'partial' && outstanding > 0) {
    return 'Partial collection'
  }

  if (invoice.status === 'paid' || outstanding === 0) {
    return 'Paid in full'
  }

  if (invoice.status === 'draft') {
    return 'Draft'
  }

  if (outstanding > 0) {
    return 'Open balance'
  }

  return invoiceStatusLabels[invoice.status]
}

function InvoicePdfDocument({
  invoice,
  client,
  linkedMissions,
  payments,
  outstanding,
  organizationName,
  paymentSummaryNote,
}: InvoicePdfPayload) {
  const latestPayment = payments[0] ?? null
  const collectionLabel = getCollectionLabel(invoice, outstanding)

  return (
    <Document
      title={`${invoice.invoice_number} invoice`}
      author="Kepler Express Ops"
      subject="Invoice export"
    >
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.brand}>{organizationName || 'Kepler Express Ops'}</Text>
          <View style={styles.titleRow}>
            <View style={styles.titleBlock}>
              <Text style={styles.title}>{invoice.invoice_number}</Text>
              <Text style={styles.subtitle}>
                {collectionLabel} • {formatCurrencyWithDecimals(outstanding)} outstanding
              </Text>
            </View>
            <View style={styles.statusPill}>
              <Text style={styles.statusText}>{invoiceStatusLabels[invoice.status]}</Text>
            </View>
          </View>
          <View style={styles.metaRow}>
            <Text>Generated {formatDateTime(new Date().toISOString())}</Text>
            <Text>{linkedMissions.length} linked mission{linkedMissions.length === 1 ? '' : 's'}</Text>
          </View>
        </View>

        <View style={styles.grid}>
          <View style={styles.card}>
            <Text style={styles.cardLabel}>Total amount</Text>
            <Text style={styles.cardValue}>{formatCurrencyWithDecimals(invoice.amount_total)}</Text>
            <Text style={styles.cardDetail}>Invoice total issued</Text>
          </View>
          <View style={styles.card}>
            <Text style={styles.cardLabel}>Paid</Text>
            <Text style={styles.cardValue}>{formatCurrencyWithDecimals(invoice.amount_paid)}</Text>
            <Text style={styles.cardDetail}>
              {payments.length} payment{payments.length === 1 ? '' : 's'} recorded
            </Text>
          </View>
          <View style={styles.card}>
            <Text style={styles.cardLabel}>Outstanding</Text>
            <Text style={styles.cardValue}>{formatCurrencyWithDecimals(outstanding)}</Text>
            <Text style={styles.cardDetail}>{collectionLabel}</Text>
          </View>
        </View>

        <View style={styles.twoColumn}>
          <View style={styles.mainColumn}>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Invoice summary</Text>
              <View style={styles.fieldList}>
                <View style={styles.fieldRow}>
                  <Text style={styles.fieldLabel}>Issue date</Text>
                  <Text style={styles.fieldValue}>{formatDate(invoice.issue_date)}</Text>
                </View>
                <View style={styles.fieldRow}>
                  <Text style={styles.fieldLabel}>Due date</Text>
                  <Text style={styles.fieldValue}>{formatDate(invoice.due_date)}</Text>
                </View>
                <View style={styles.fieldRow}>
                  <Text style={styles.fieldLabel}>Collection state</Text>
                  <Text style={styles.fieldValue}>{collectionLabel}</Text>
                </View>
                <View style={styles.fieldRow}>
                  <Text style={styles.fieldLabel}>Latest payment</Text>
                  <Text style={styles.fieldValue}>
                    {latestPayment ? formatDate(latestPayment.payment_date) : 'No payment recorded'}
                  </Text>
                </View>
              </View>
              {invoice.notes ? (
                <Text style={styles.note}>{invoice.notes}</Text>
              ) : null}
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Linked missions</Text>
              {linkedMissions.length === 0 ? (
                <Text style={styles.sectionCopy}>No missions are currently linked to this invoice.</Text>
              ) : (
                linkedMissions.map((mission, index) => (
                  <View
                    key={mission.mission_id}
                    style={index === 0 ? [styles.listItem, styles.listItemFirst] : styles.listItem}
                  >
                    <View style={styles.rowHead}>
                      <Text style={styles.rowTitle}>{mission.reference}</Text>
                      <Text style={styles.rowTitle}>
                        {formatCurrencyWithDecimals(mission.revenue_amount)}
                      </Text>
                    </View>
                    <Text style={styles.rowMeta}>
                      {mission.departure_location} → {mission.arrival_location}
                    </Text>
                    <Text style={styles.rowSubtle}>
                      {missionStatusLabels[mission.status]} • {formatDateTime(mission.departure_datetime)}
                    </Text>
                  </View>
                ))
              )}
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Payment summary</Text>
              {payments.length === 0 ? (
                <Text style={styles.sectionCopy}>
                  {paymentSummaryNote || 'No payments have been recorded for this invoice.'}
                </Text>
              ) : (
                payments.map((payment, index) => (
                  <View
                    key={payment.payment_id}
                    style={index === 0 ? [styles.listItem, styles.listItemFirst] : styles.listItem}
                  >
                    <View style={styles.rowHead}>
                      <Text style={styles.rowTitle}>{formatDate(payment.payment_date)}</Text>
                      <Text style={styles.rowTitle}>
                        {formatCurrencyWithDecimals(payment.amount)}
                      </Text>
                    </View>
                    <Text style={styles.rowMeta}>
                      {getPaymentMethodLabel(payment.payment_method as PaymentMethod)}
                      {payment.reference ? ` • Ref ${payment.reference}` : ''}
                    </Text>
                    {payment.notes ? (
                      <Text style={styles.rowSubtle}>{payment.notes}</Text>
                    ) : null}
                  </View>
                ))
              )}
            </View>
          </View>

          <View style={styles.sideColumn}>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Client</Text>
              <View style={styles.fieldList}>
                <View style={styles.fieldRow}>
                  <Text style={styles.fieldLabel}>Name</Text>
                  <Text style={styles.fieldValue}>{client?.name || 'Unknown client'}</Text>
                </View>
                <View style={styles.fieldRow}>
                  <Text style={styles.fieldLabel}>Email</Text>
                  <Text style={styles.fieldValue}>{client?.email || 'No email on file'}</Text>
                </View>
                <View style={styles.fieldRow}>
                  <Text style={styles.fieldLabel}>Phone</Text>
                  <Text style={styles.fieldValue}>
                    {formatPhoneNumber(client?.phone)}
                  </Text>
                </View>
                <View style={styles.fieldRow}>
                  <Text style={styles.fieldLabel}>Location</Text>
                  <Text style={styles.fieldValue}>
                    {client
                      ? [client.address, client.city, client.country].filter(Boolean).join(', ') ||
                        'No location on file'
                      : 'No location on file'}
                  </Text>
                </View>
                {client?.vat_number ? (
                  <View style={styles.fieldRow}>
                    <Text style={styles.fieldLabel}>VAT</Text>
                    <Text style={styles.fieldValue}>{client.vat_number}</Text>
                  </View>
                ) : null}
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Billing totals</Text>
              <View style={styles.fieldList}>
                <View style={styles.fieldRow}>
                  <Text style={styles.fieldLabel}>Invoice total</Text>
                  <Text style={styles.fieldValue}>{formatCurrencyWithDecimals(invoice.amount_total)}</Text>
                </View>
                <View style={styles.fieldRow}>
                  <Text style={styles.fieldLabel}>Amount paid</Text>
                  <Text style={styles.fieldValue}>{formatCurrencyWithDecimals(invoice.amount_paid)}</Text>
                </View>
                <View style={styles.fieldRow}>
                  <Text style={styles.fieldLabel}>Outstanding</Text>
                  <Text style={styles.fieldValue}>{formatCurrencyWithDecimals(outstanding)}</Text>
                </View>
                <View style={styles.fieldRow}>
                  <Text style={styles.fieldLabel}>Linked missions</Text>
                  <Text style={styles.fieldValue}>{String(linkedMissions.length)}</Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        <Text style={styles.footer}>
          Kepler Express Ops • Invoice export • {formatDate(new Date().toISOString())}
        </Text>
      </Page>
    </Document>
  )
}

export async function downloadInvoicePdf(payload: InvoicePdfPayload): Promise<void> {
  const { pdf } = await import('@react-pdf/renderer')

  const pdfDocument = <InvoicePdfDocument {...payload} />
  const blob = await pdf(pdfDocument).toBlob()
  const url = URL.createObjectURL(blob)
  const link = window.document.createElement('a')
  link.href = url
  link.download = `${payload.invoice.invoice_number}.pdf`
  window.document.body.appendChild(link)
  link.click()
  window.document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
