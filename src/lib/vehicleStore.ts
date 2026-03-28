import type {
  CreateVehicleInput,
  MaintenanceRecord,
  Vehicle,
} from '../types'
import { seedMaintenanceRecords, seedVehicles } from './vehicleSeeds'

const VEHICLES_STORAGE_KEY = 'kepler_ops_vehicles'
const MAINTENANCE_STORAGE_KEY = 'kepler_ops_maintenance'

function canUseStorage() {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined'
}

function readStorage<T>(key: string, fallback: T): T {
  if (!canUseStorage()) {
    return fallback
  }

  try {
    const storedValue = window.localStorage.getItem(key)
    return storedValue ? (JSON.parse(storedValue) as T) : fallback
  } catch {
    return fallback
  }
}

function writeStorage<T>(key: string, value: T) {
  if (!canUseStorage()) {
    return
  }

  window.localStorage.setItem(key, JSON.stringify(value))
}

function getNextVehicleId(vehicles: Vehicle[]) {
  const highestId = vehicles.reduce((max, vehicle) => {
    const numericId = Number.parseInt(vehicle.vehicle_id.replace('vehicle-', ''), 10)
    return Number.isNaN(numericId) ? max : Math.max(max, numericId)
  }, 0)

  return `vehicle-${highestId + 1}`
}

export function getStoredVehicles(): Vehicle[] {
  return readStorage(VEHICLES_STORAGE_KEY, seedVehicles)
}

export function getStoredMaintenanceRecords(): MaintenanceRecord[] {
  return readStorage(MAINTENANCE_STORAGE_KEY, seedMaintenanceRecords)
}

export function getStoredVehicleById(vehicleId: string) {
  return getStoredVehicles().find((vehicle) => vehicle.vehicle_id === vehicleId)
}

export function saveStoredVehicles(vehicles: Vehicle[]) {
  writeStorage(VEHICLES_STORAGE_KEY, vehicles)
}

export function saveStoredMaintenanceRecords(records: MaintenanceRecord[]) {
  writeStorage(MAINTENANCE_STORAGE_KEY, records)
}

export function upsertStoredVehicle(
  input: CreateVehicleInput,
  existingVehicle?: Vehicle,
): Vehicle {
  const vehicles = getStoredVehicles()
  const now = new Date().toISOString()

  const nextVehicle: Vehicle = {
    vehicle_id: existingVehicle?.vehicle_id ?? getNextVehicleId(vehicles),
    organization_id: existingVehicle?.organization_id ?? 'org-1',
    created_at: existingVehicle?.created_at ?? now,
    updated_at: now,
    name: input.name,
    license_plate: input.license_plate,
    registration_number: input.registration_number || existingVehicle?.registration_number,
    vehicle_type: input.vehicle_type,
    status: input.status,
    mileage_current: input.mileage_current,
    mileage_last_service: existingVehicle?.mileage_last_service,
    next_service_mileage: input.next_service_mileage,
    capacity_kg: existingVehicle?.capacity_kg,
    capacity_m3: existingVehicle?.capacity_m3,
    last_service_date: existingVehicle?.last_service_date,
    notes: input.notes,
  }

  const updatedVehicles = existingVehicle
    ? vehicles.map((vehicle) =>
        vehicle.vehicle_id === existingVehicle.vehicle_id ? nextVehicle : vehicle
      )
    : [nextVehicle, ...vehicles]

  saveStoredVehicles(updatedVehicles)

  return nextVehicle
}
