import type {
  CreateVehicleInput,
  MaintenanceRecord,
  Vehicle,
} from '../../types'
import {
  Currency,
  MaintenanceType,
  VehicleStatus,
  VehicleType,
} from '../../types'
import type { Database } from './database'
import { DataLayerError, toDataLayerError } from './errors'
import { getCurrentOrganizationId } from './session'
import { getSupabaseClient } from './supabase'

type VehicleRow = Database['public']['Tables']['vehicles']['Row']
type MaintenanceRow = Database['public']['Tables']['maintenance_records']['Row']
type VehicleInsert = Database['public']['Tables']['vehicles']['Insert']
type VehiclePayload = Omit<VehicleInsert, 'organization_id'>

function mapVehicleRow(row: VehicleRow): Vehicle {
  return {
    vehicle_id: row.vehicle_id,
    organization_id: row.organization_id,
    name: row.name,
    license_plate: row.license_plate,
    registration_number: row.registration_number,
    vehicle_type: row.vehicle_type as VehicleType,
    status: row.status as VehicleStatus,
    mileage_current: row.mileage_current,
    mileage_last_service: row.mileage_last_service,
    next_service_mileage: row.next_service_mileage,
    capacity_kg: row.capacity_kg ?? undefined,
    capacity_m3: row.capacity_m3 ?? undefined,
    last_service_date: row.last_service_date ?? undefined,
    created_at: row.created_at ?? '',
    updated_at: row.updated_at ?? '',
  }
}

function mapMaintenanceRow(row: MaintenanceRow): MaintenanceRecord {
  return {
    maintenance_id: row.maintenance_id,
    vehicle_id: row.vehicle_id,
    type: row.type as MaintenanceType,
    notes: row.description,
    cost_amount: Number(row.cost_amount),
    currency: row.currency as Currency,
    mileage_at_service: row.mileage_at_service,
    next_service_mileage: row.next_service_mileage,
    service_date: row.service_date,
    completed_at: row.completed_at ?? undefined,
    created_at: row.created_at ?? '',
  }
}

function getVehiclePayload(input: CreateVehicleInput, existingVehicle?: Vehicle) {
  if (!input.registration_number?.trim()) {
    throw new DataLayerError(
      'Registration number is required by the connected vehicles table.'
    )
  }

  const payload: VehiclePayload = {
    name: input.name.trim(),
    license_plate: input.license_plate.trim(),
    registration_number: input.registration_number.trim(),
    vehicle_type: input.vehicle_type as VehicleInsert['vehicle_type'],
    status: input.status as VehicleInsert['status'],
    mileage_current: input.mileage_current,
    mileage_last_service: existingVehicle?.mileage_last_service ?? input.mileage_current,
    next_service_mileage: input.next_service_mileage,
    capacity_kg: existingVehicle?.capacity_kg ?? null,
    capacity_m3: existingVehicle?.capacity_m3 ?? null,
    last_service_date: existingVehicle?.last_service_date ?? null,
  }

  return payload
}

export async function listVehicles() {
  const supabase = getSupabaseClient()
  const { data, error } = await supabase
    .from('vehicles')
    .select('*')
    .order('name', { ascending: true })

  if (error) {
    throw toDataLayerError(error, 'Unable to load vehicles.')
  }

  return (data ?? []).map(mapVehicleRow)
}

export async function getVehicleById(vehicleId: string) {
  const supabase = getSupabaseClient()
  const { data, error } = await supabase
    .from('vehicles')
    .select('*')
    .eq('vehicle_id', vehicleId)
    .maybeSingle()

  if (error) {
    throw toDataLayerError(error, 'Unable to load the vehicle.')
  }

  if (!data) {
    throw new DataLayerError('Vehicle not found or inaccessible.')
  }

  return mapVehicleRow(data)
}

export async function createVehicle(input: CreateVehicleInput) {
  const supabase = getSupabaseClient()
  const organizationId = await getCurrentOrganizationId()
  const { data, error } = await supabase
    .from('vehicles')
    .insert({
      organization_id: organizationId,
      ...getVehiclePayload(input),
    })
    .select('*')
    .single()

  if (error) {
    throw toDataLayerError(error, 'Unable to create the vehicle.')
  }

  return mapVehicleRow(data)
}

export async function updateVehicle(
  vehicleId: string,
  input: CreateVehicleInput,
  existingVehicle?: Vehicle,
) {
  const supabase = getSupabaseClient()
  const { data, error } = await supabase
    .from('vehicles')
    .update(getVehiclePayload(input, existingVehicle))
    .eq('vehicle_id', vehicleId)
    .select('*')
    .maybeSingle()

  if (error) {
    throw toDataLayerError(error, 'Unable to update the vehicle.')
  }

  if (!data) {
    throw new DataLayerError('Vehicle not found or inaccessible.')
  }

  return mapVehicleRow(data)
}

export async function listMaintenanceRecordsByVehicleId(vehicleId: string) {
  const supabase = getSupabaseClient()
  const { data, error } = await supabase
    .from('maintenance_records')
    .select('*')
    .eq('vehicle_id', vehicleId)
    .order('service_date', { ascending: false })

  if (error) {
    throw toDataLayerError(error, 'Unable to load maintenance records.')
  }

  return (data ?? []).map(mapMaintenanceRow)
}
