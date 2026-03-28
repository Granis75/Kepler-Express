import type { Mission } from '../../types'
import { Currency, MissionStatus } from '../../types'
import type { Database } from './database'
import { toDataLayerError } from './errors'
import { getCurrentOrganizationId } from './session'
import { getSupabaseClient } from './supabase'

type MissionRow = Database['public']['Tables']['missions']['Row']
type MissionInsert = Database['public']['Tables']['missions']['Insert']
type MissionPayload = Omit<MissionInsert, 'organization_id'>

export interface MissionWriteInput {
  reference: string
  client_id: string
  driver_id?: string
  vehicle_id?: string
  departure_location: string
  arrival_location: string
  departure_datetime: string
  revenue_amount: number
  estimated_cost_amount: number
  status: MissionStatus
  notes?: string
}

function mapMissionRow(row: MissionRow): Mission {
  return {
    mission_id: row.mission_id,
    organization_id: row.organization_id,
    client_id: row.client_id,
    driver_id: row.driver_id ?? undefined,
    vehicle_id: row.vehicle_id ?? undefined,
    reference: row.reference,
    status: row.status as MissionStatus,
    revenue_amount: Number(row.revenue_amount),
    estimated_cost_amount: Number(row.estimated_cost_amount),
    actual_cost_amount:
      row.actual_cost_amount !== null ? Number(row.actual_cost_amount) : undefined,
    departure_location: row.departure_location,
    arrival_location: row.arrival_location,
    departure_datetime: row.departure_datetime,
    arrival_datetime: row.arrival_datetime ?? undefined,
    notes: row.notes ?? undefined,
    created_at: row.created_at ?? '',
    updated_at: row.updated_at ?? '',
  }
}

function getMissionPayload(input: MissionWriteInput) {
  const payload: MissionPayload = {
    reference: input.reference.trim(),
    client_id: input.client_id,
    driver_id: input.driver_id || null,
    vehicle_id: input.vehicle_id || null,
    departure_location: input.departure_location.trim(),
    arrival_location: input.arrival_location.trim(),
    departure_datetime: new Date(input.departure_datetime).toISOString(),
    revenue_amount: Number(input.revenue_amount.toFixed(2)),
    estimated_cost_amount: Number(input.estimated_cost_amount.toFixed(2)),
    status: input.status as MissionInsert['status'],
    currency: Currency.EUR as MissionInsert['currency'],
    notes: input.notes?.trim() || null,
  }

  return payload
}

export async function listMissions() {
  const supabase = getSupabaseClient()
  const { data, error } = await supabase
    .from('missions')
    .select('*')
    .order('departure_datetime', { ascending: false })

  if (error) {
    throw toDataLayerError(error, 'Unable to load missions.')
  }

  return (data ?? []).map(mapMissionRow)
}

export async function getMissionById(missionId: string) {
  const supabase = getSupabaseClient()
  const { data, error } = await supabase
    .from('missions')
    .select('*')
    .eq('mission_id', missionId)
    .single()

  if (error) {
    throw toDataLayerError(error, 'Unable to load the mission.')
  }

  return mapMissionRow(data)
}

export async function createMission(input: MissionWriteInput) {
  const supabase = getSupabaseClient()
  const organizationId = await getCurrentOrganizationId()

  const { data, error } = await supabase
    .from('missions')
    .insert({
      organization_id: organizationId,
      ...getMissionPayload(input),
    })
    .select('*')
    .single()

  if (error) {
    throw toDataLayerError(error, 'Unable to create the mission.')
  }

  return mapMissionRow(data)
}

export async function updateMission(missionId: string, input: MissionWriteInput) {
  const supabase = getSupabaseClient()
  const { data, error } = await supabase
    .from('missions')
    .update(getMissionPayload(input))
    .eq('mission_id', missionId)
    .select('*')
    .single()

  if (error) {
    throw toDataLayerError(error, 'Unable to update the mission.')
  }

  return mapMissionRow(data)
}
