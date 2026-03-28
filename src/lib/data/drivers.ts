import { DriverStatus, type Driver } from '../../types'
import type { Database } from './database'
import { toDataLayerError } from './errors'
import { getSupabaseClient } from './supabase'

type DriverRow = Database['public']['Tables']['drivers']['Row']

function mapDriverRow(row: DriverRow): Driver {
  return {
    driver_id: row.driver_id,
    organization_id: row.organization_id,
    name: row.name,
    email: row.email ?? undefined,
    phone: row.phone,
    license_number: row.license_number,
    license_expiry: row.license_expiry,
    status: row.status as DriverStatus,
    date_of_birth: row.date_of_birth ?? undefined,
    created_at: row.created_at ?? '',
    updated_at: row.updated_at ?? '',
  }
}

export async function listDrivers() {
  const supabase = getSupabaseClient()
  const { data, error } = await supabase
    .from('drivers')
    .select('*')
    .order('name', { ascending: true })

  if (error) {
    throw toDataLayerError(error, 'Unable to load drivers.')
  }

  return (data ?? []).map(mapDriverRow)
}
