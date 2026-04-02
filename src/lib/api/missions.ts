import type { Mission } from '../../types/domain'
import { getSupabaseClient } from '../supabase'
import { toUserFacingError } from '../supabase-error'

export type CreateMissionRecordInput = {
  client_id: string
  reference: string
  status: Mission['status']
  driver_name?: string
  vehicle_name?: string
  revenue_amount: number
  estimated_cost_amount: number
  departure_location: string
  arrival_location: string
  departure_datetime: string
  arrival_datetime?: string
  notes?: string
}

type MissionRow = {
  mission_id: string
  organization_id: string
  client_id: string
  reference: string
  status: Mission['status']
  driver_name: string | null
  vehicle_name: string | null
  revenue_amount: number | string
  estimated_cost_amount: number | string
  actual_cost_amount: number | string | null
  departure_location: string
  arrival_location: string
  departure_datetime: string
  arrival_datetime: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

function mapMissionRow(row: MissionRow): Mission {
  return {
    mission_id: row.mission_id,
    organization_id: row.organization_id,
    client_id: row.client_id,
    reference: row.reference,
    status: row.status,
    driver_name: row.driver_name ?? undefined,
    vehicle_name: row.vehicle_name ?? undefined,
    revenue_amount: Number(row.revenue_amount),
    estimated_cost_amount: Number(row.estimated_cost_amount),
    actual_cost_amount: Number(row.actual_cost_amount ?? 0),
    departure_location: row.departure_location,
    arrival_location: row.arrival_location,
    departure_datetime: row.departure_datetime,
    arrival_datetime: row.arrival_datetime ?? undefined,
    notes: row.notes ?? undefined,
    created_at: row.created_at,
    updated_at: row.updated_at,
  }
}

function getMissionPayload(input: CreateMissionRecordInput) {
  return {
    client_id: input.client_id,
    reference: input.reference.trim(),
    status: input.status,
    driver_name: input.driver_name?.trim() || null,
    vehicle_name: input.vehicle_name?.trim() || null,
    revenue_amount: Number(input.revenue_amount),
    estimated_cost_amount: Number(input.estimated_cost_amount),
    departure_location: input.departure_location.trim(),
    arrival_location: input.arrival_location.trim(),
    departure_datetime: new Date(input.departure_datetime).toISOString(),
    arrival_datetime: input.arrival_datetime
      ? new Date(input.arrival_datetime).toISOString()
      : null,
    notes: input.notes?.trim() || null,
  }
}

export async function getMissions(): Promise<Mission[]> {
  const supabase = getSupabaseClient()
  const { data, error } = await supabase
    .from('missions')
    .select(
      'mission_id, organization_id, client_id, reference, status, driver_name, vehicle_name, revenue_amount, estimated_cost_amount, actual_cost_amount, departure_location, arrival_location, departure_datetime, arrival_datetime, notes, created_at, updated_at'
    )
    .order('departure_datetime', { ascending: false })

  if (error) {
    throw toUserFacingError(error, 'Unable to load missions.')
  }

  return (data ?? []).map((row) =>
    mapMissionRow({
      mission_id: row.mission_id,
      organization_id: row.organization_id,
      client_id: row.client_id,
      reference: row.reference,
      status: row.status,
      driver_name: row.driver_name,
      vehicle_name: row.vehicle_name,
      revenue_amount: row.revenue_amount,
      estimated_cost_amount: row.estimated_cost_amount,
      actual_cost_amount: row.actual_cost_amount,
      departure_location: row.departure_location,
      arrival_location: row.arrival_location,
      departure_datetime: row.departure_datetime,
      arrival_datetime: row.arrival_datetime,
      notes: row.notes,
      created_at: row.created_at,
      updated_at: row.updated_at,
    })
  )
}

export async function getMissionById(missionId: string): Promise<Mission> {
  const supabase = getSupabaseClient()
  const { data, error } = await supabase
    .from('missions')
    .select(
      'mission_id, organization_id, client_id, reference, status, driver_name, vehicle_name, revenue_amount, estimated_cost_amount, actual_cost_amount, departure_location, arrival_location, departure_datetime, arrival_datetime, notes, created_at, updated_at'
    )
    .eq('mission_id', missionId)
    .maybeSingle()

  if (error) {
    throw toUserFacingError(error, 'Unable to load the mission.')
  }

  if (!data) {
    throw new Error('Mission not found or inaccessible.')
  }

  return mapMissionRow({
    mission_id: data.mission_id,
    organization_id: data.organization_id,
    client_id: data.client_id,
    reference: data.reference,
    status: data.status,
    driver_name: data.driver_name,
    vehicle_name: data.vehicle_name,
    revenue_amount: data.revenue_amount,
    estimated_cost_amount: data.estimated_cost_amount,
    actual_cost_amount: data.actual_cost_amount,
    departure_location: data.departure_location,
    arrival_location: data.arrival_location,
    departure_datetime: data.departure_datetime,
    arrival_datetime: data.arrival_datetime,
    notes: data.notes,
    created_at: data.created_at,
    updated_at: data.updated_at,
  })
}

export async function createMissionRecord(
  organizationId: string,
  input: CreateMissionRecordInput
): Promise<Mission> {
  const supabase = getSupabaseClient()
  const { data, error } = await supabase
    .from('missions')
    .insert({
      organization_id: organizationId,
      ...getMissionPayload(input),
    })
    .select(
      'mission_id, organization_id, client_id, reference, status, driver_name, vehicle_name, revenue_amount, estimated_cost_amount, actual_cost_amount, departure_location, arrival_location, departure_datetime, arrival_datetime, notes, created_at, updated_at'
    )
    .single()

  if (error) {
    throw toUserFacingError(error, 'Unable to create the mission.')
  }

  return mapMissionRow({
    mission_id: data.mission_id,
    organization_id: data.organization_id,
    client_id: data.client_id,
    reference: data.reference,
    status: data.status,
    driver_name: data.driver_name,
    vehicle_name: data.vehicle_name,
    revenue_amount: data.revenue_amount,
    estimated_cost_amount: data.estimated_cost_amount,
    actual_cost_amount: data.actual_cost_amount,
    departure_location: data.departure_location,
    arrival_location: data.arrival_location,
    departure_datetime: data.departure_datetime,
    arrival_datetime: data.arrival_datetime,
    notes: data.notes,
    created_at: data.created_at,
    updated_at: data.updated_at,
  })
}

export async function updateMissionRecord(
  missionId: string,
  input: CreateMissionRecordInput
): Promise<Mission> {
  const supabase = getSupabaseClient()
  const { data, error } = await supabase
    .from('missions')
    .update(getMissionPayload(input))
    .eq('mission_id', missionId)
    .select(
      'mission_id, organization_id, client_id, reference, status, driver_name, vehicle_name, revenue_amount, estimated_cost_amount, actual_cost_amount, departure_location, arrival_location, departure_datetime, arrival_datetime, notes, created_at, updated_at'
    )
    .maybeSingle()

  if (error) {
    throw toUserFacingError(error, 'Unable to update the mission.')
  }

  if (!data) {
    throw new Error('Mission not found or inaccessible.')
  }

  return mapMissionRow({
    mission_id: data.mission_id,
    organization_id: data.organization_id,
    client_id: data.client_id,
    reference: data.reference,
    status: data.status,
    driver_name: data.driver_name,
    vehicle_name: data.vehicle_name,
    revenue_amount: data.revenue_amount,
    estimated_cost_amount: data.estimated_cost_amount,
    actual_cost_amount: data.actual_cost_amount,
    departure_location: data.departure_location,
    arrival_location: data.arrival_location,
    departure_datetime: data.departure_datetime,
    arrival_datetime: data.arrival_datetime,
    notes: data.notes,
    created_at: data.created_at,
    updated_at: data.updated_at,
  })
}
