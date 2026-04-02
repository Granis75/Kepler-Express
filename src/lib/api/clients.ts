import type { Client } from '../../types/domain'
import { getSupabaseClient } from '../supabase'
import { toUserFacingError } from '../supabase-error'

type ClientRow = {
  client_id: string
  organization_id: string
  name: string
  email: string
  phone: string
  address: string | null
  city: string | null
  postal_code: string | null
  country: string
  vat_number: string | null
  status: Client['status']
  notes: string | null
  created_at: string
  updated_at: string
}

function mapClientRow(row: ClientRow): Client {
  return {
    client_id: row.client_id,
    organization_id: row.organization_id,
    name: row.name,
    email: row.email,
    phone: row.phone,
    address: row.address ?? '',
    city: row.city ?? '',
    postal_code: row.postal_code ?? '',
    country: row.country,
    vat_number: row.vat_number ?? undefined,
    status: row.status,
    notes: row.notes ?? undefined,
    created_at: row.created_at,
    updated_at: row.updated_at,
  }
}

export async function getClients(): Promise<Client[]> {
  const supabase = getSupabaseClient()
  const { data, error } = await supabase
    .from('clients')
    .select(
      'client_id, organization_id, name, email, phone, address, city, postal_code, country, vat_number, status, notes, created_at, updated_at'
    )
    .order('name', { ascending: true })

  if (error) {
    throw toUserFacingError(error, 'Unable to load clients.')
  }

  return (data ?? []).map((row) =>
    mapClientRow({
      client_id: row.client_id,
      organization_id: row.organization_id,
      name: row.name,
      email: row.email,
      phone: row.phone,
      address: row.address,
      city: row.city,
      postal_code: row.postal_code,
      country: row.country,
      vat_number: row.vat_number,
      status: row.status,
      notes: row.notes,
      created_at: row.created_at,
      updated_at: row.updated_at,
    })
  )
}
