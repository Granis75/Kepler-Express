import type {
  CreateInvoiceInput,
  CreatePaymentInput,
  Invoice,
  Payment,
} from '../types'
import { Currency, InvoiceStatus } from '../types'
import {
  calculateTotalPayments,
} from './calculations'
import { seedInvoices, seedPayments } from './financialSeeds'
import { getInvoiceStatusFromPayment } from './domain'
import { readStorage, writeStorage } from './storage'

const INVOICES_STORAGE_KEY = 'kepler_ops_invoices'
const PAYMENTS_STORAGE_KEY = 'kepler_ops_payments'

function readRawInvoices() {
  return readStorage(INVOICES_STORAGE_KEY, seedInvoices)
}

function readRawPayments() {
  return readStorage(PAYMENTS_STORAGE_KEY, seedPayments)
}

function getNextEntityId(items: { id: string }[], prefix: string) {
  const highestId = items.reduce((max, item) => {
    const numericId = Number.parseInt(item.id.replace(`${prefix}-`, ''), 10)
    return Number.isNaN(numericId) ? max : Math.max(max, numericId)
  }, 0)

  return `${prefix}-${String(highestId + 1).padStart(3, '0')}`
}

function getInvoiceLatestPaymentDate(payments: Payment[]) {
  if (payments.length === 0) {
    return undefined
  }

  return [...payments]
    .sort(
      (left, right) =>
        new Date(right.payment_date).getTime() - new Date(left.payment_date).getTime()
    )[0]?.payment_date
}

function hydrateInvoice(invoice: Invoice, payments: Payment[]): Invoice {
  const invoicePayments = payments.filter((payment) => payment.invoice_id === invoice.invoice_id)
  const amountPaid = Number(calculateTotalPayments(invoicePayments).toFixed(2))
  const paidDate =
    amountPaid >= invoice.amount_total
      ? getInvoiceLatestPaymentDate(invoicePayments)
      : undefined

  return {
    ...invoice,
    amount_paid: amountPaid,
    paid_date: paidDate,
    status: getInvoiceStatusFromPayment(
      invoice.status,
      invoice.amount_total,
      amountPaid,
      invoice.due_date
    ),
  }
}

export function getStoredPayments(): Payment[] {
  return [...readRawPayments()].sort(
    (left, right) =>
      new Date(right.payment_date).getTime() - new Date(left.payment_date).getTime()
  )
}

export function getStoredPaymentsByInvoiceId(invoiceId: string): Payment[] {
  return getStoredPayments().filter((payment) => payment.invoice_id === invoiceId)
}

export function getStoredInvoices(): Invoice[] {
  const payments = getStoredPayments()

  return readRawInvoices()
    .map((invoice) => hydrateInvoice(invoice, payments))
    .sort((left, right) => right.invoice_number.localeCompare(left.invoice_number))
}

export function getStoredInvoiceById(invoiceId: string) {
  return getStoredInvoices().find((invoice) => invoice.invoice_id === invoiceId)
}

export function saveStoredInvoices(invoices: Invoice[]) {
  writeStorage(INVOICES_STORAGE_KEY, invoices)
}

export function saveStoredPayments(payments: Payment[]) {
  writeStorage(PAYMENTS_STORAGE_KEY, payments)
}

export function upsertStoredInvoice(
  input: CreateInvoiceInput,
  existingInvoice?: Invoice,
): Invoice {
  const invoices = readRawInvoices()
  const now = new Date().toISOString()
  const rawStatus =
    input.status === InvoiceStatus.Draft ? InvoiceStatus.Draft : InvoiceStatus.Sent

  const nextInvoice: Invoice = {
    invoice_id:
      existingInvoice?.invoice_id ??
      getNextEntityId(
        invoices.map((invoice) => ({ id: invoice.invoice_id })),
        'INV'
      ),
    organization_id: existingInvoice?.organization_id ?? 'org-1',
    created_at: existingInvoice?.created_at ?? now,
    updated_at: now,
    invoice_number: input.invoice_number,
    client_id: input.client_id,
    mission_ids: input.mission_ids,
    amount_total: input.amount_total,
    amount_paid: existingInvoice?.amount_paid ?? 0,
    currency: input.currency ?? existingInvoice?.currency ?? Currency.EUR,
    issued_date: input.issued_date,
    due_date: input.due_date,
    status: rawStatus,
    sent_date:
      rawStatus === InvoiceStatus.Sent
        ? existingInvoice?.sent_date ?? input.issued_date
        : undefined,
    paid_date: existingInvoice?.paid_date,
    notes: input.notes?.trim() || undefined,
  }

  const updatedInvoices = existingInvoice
    ? invoices.map((invoice) =>
        invoice.invoice_id === existingInvoice.invoice_id ? nextInvoice : invoice
      )
    : [nextInvoice, ...invoices]

  saveStoredInvoices(updatedInvoices)

  return hydrateInvoice(nextInvoice, getStoredPayments())
}

export function addStoredPayment(input: CreatePaymentInput): Payment {
  const payments = readRawPayments()
  const invoices = readRawInvoices()
  const now = new Date().toISOString()

  const nextPayment: Payment = {
    payment_id: getNextEntityId(
      payments.map((payment) => ({ id: payment.payment_id })),
      'PAY'
    ),
    invoice_id: input.invoice_id,
    amount: Number(input.amount.toFixed(2)),
    currency: input.currency ?? Currency.EUR,
    payment_method: input.payment_method,
    payment_date: input.payment_date,
    reference: input.reference?.trim() || undefined,
    notes: input.notes?.trim() || undefined,
    created_at: now,
    updated_at: now,
  }

  const updatedPayments = [nextPayment, ...payments]
  saveStoredPayments(updatedPayments)

  const updatedInvoices = invoices.map((invoice) =>
    invoice.invoice_id === input.invoice_id
      ? {
          ...invoice,
          updated_at: now,
        }
      : invoice
  )

  saveStoredInvoices(updatedInvoices)

  return nextPayment
}
