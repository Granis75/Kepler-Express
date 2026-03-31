import { ClientStatus, type Client, type CreateClientInput } from '../../types'
import type { Database } from './database'
import { DataLayerError, toDataLayerError } from './errors'
import { getCurrentOrganizationId } from './session'
import { getSupabaseClient } from './supabase'

type ClientRow = Database['public']['Tables']['clients']['Row']
type ClientInsert = Database['public']['Tables']['clients']['Insert']

function mapClientRow(row: ClientRow): Client {
  return {
    client_id: row.client_id,
    organization_id: row.organization_id,
    name: row.name,
    email: row.email,
    phone: row.phone,
    address: row.address,
    city: row.city,
    postal_code: row.postal_code,
    country: row.country,
    vat_number: row.vat_number ?? undefined,
    status: row.status as ClientStatus,
    notes: row.notes ?? undefined,
    created_at: row.created_at ?? '',
    updated_at: row.updated_at ?? '',
  }
}

export async function listClients() {
  const supabase = getSupabaseClient()
  const { data, error } = await supabase
    .from('clients')
    .select('*')
    .order('name', { ascending: true })

  if (error) {
    throw toDataLayerError(error, 'Unable to load clients.')
  }

  return (data ?? []).map(mapClientRow)
}

export async function createClient(input: CreateClientInput) {
  const supabase = getSupabaseClient()
  const organizationId = await getCurrentOrganizationId()
  const payload: ClientInsert = {
    organization_id: organizationId,
    name: input.name.trim(),
    email: input.email.trim(),
    phone: input.phone.trim(),
    address: input.address.trim(),
    city: input.city.trim(),
    postal_code: input.postal_code.trim(),
    country: input.country.trim(),
    vat_number: input.vat_number?.trim() || null,
    status: (input.status ?? ClientStatus.Active) as ClientInsert['status'],
    notes: input.notes?.trim() || null,
  }

  const { data, error } = await supabase
    .from('clients')
    .insert(payload)
    .select('*')
    .single()

  if (error) {
    throw toDataLayerError(error, 'Unable to create the client.')
  }

  return mapClientRow(data)
}

export async function updateClient(clientId: string, input: CreateClientInput) {
  const supabase = getSupabaseClient()
  const payload: Database['public']['Tables']['clients']['Update'] = {
    name: input.name.trim(),
    email: input.email.trim(),
    phone: input.phone.trim(),
    address: input.address.trim(),
    city: input.city.trim(),
    postal_code: input.postal_code.trim(),
    country: input.country.trim(),
    vat_number: input.vat_number?.trim() || null,
    status: (input.status ?? ClientStatus.Active) as ClientInsert['status'],
    notes: input.notes?.trim() || null,
  }

  const { data, error } = await supabase
    .from('clients')
    .update(payload)
    .eq('client_id', clientId)
    .select('*')
    .maybeSingle()

  if (error) {
    throw toDataLayerError(error, 'Unable to update the client.')
  }

  if (!data) {
    throw new DataLayerError('Client not found or inaccessible.')
  }

  return mapClientRow(data)
}
