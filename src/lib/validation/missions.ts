import { z } from 'zod'
import { MissionStatus } from '../../types/enums'

export const missionValidationSchema = z.object({
  reference: z
    .string()
    .min(1, 'Mission reference is required')
    .max(50, 'Reference must be less than 50 characters'),
  client_id: z.string().min(1, 'Client is required'),
  driver_id: z.string().optional(),
  vehicle_id: z.string().optional(),
  departure_location: z
    .string()
    .min(1, 'Pickup location is required')
    .max(100, 'Location must be less than 100 characters'),
  arrival_location: z
    .string()
    .min(1, 'Delivery location is required')
    .max(100, 'Location must be less than 100 characters'),
  departure_datetime: z
    .string()
    .min(1, 'Departure date and time is required')
    .refine((val) => !Number.isNaN(new Date(val).getTime()), {
      message: 'Invalid date/time format',
    }),
  revenue_amount: z
    .number()
    .min(0, 'Revenue must be 0 or greater')
    .max(999999, 'Revenue is too large'),
  estimated_cost_amount: z
    .number()
    .min(0, 'Estimated cost must be 0 or greater')
    .max(999999, 'Estimated cost is too large'),
  status: z.nativeEnum(MissionStatus),
  notes: z.string().optional(),
})

export type MissionValidationInput = z.infer<typeof missionValidationSchema>
