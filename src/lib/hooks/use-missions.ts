import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '../query-keys'
import * as missionsService from '../data/missions'
import { toast } from 'react-hot-toast'

// Queries
export function useMissions(enabled = true) {
  return useQuery({
    queryKey: queryKeys.missions.list(),
    queryFn: () => missionsService.listMissions(),
    enabled,
  })
}

export function useMission(id: string) {
  return useQuery({
    queryKey: queryKeys.missions.detail(id),
    queryFn: () => missionsService.getMissionById(id),
    enabled: !!id,
  })
}

// Mutations
export function useCreateMission() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: missionsService.MissionWriteInput) =>
      missionsService.createMission(input),
    onSuccess: (newMission) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.missions.all() })
      toast.success('Mission created')
      return newMission
    },
    onError: (error) => {
      const message = error instanceof Error ? error.message : 'Failed to create mission'
      toast.error(message)
    },
  })
}

export function useUpdateMission() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      id,
      input,
    }: {
      id: string
      input: missionsService.MissionWriteInput
    }) => missionsService.updateMission(id, input),
    onSuccess: (updatedMission) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.missions.all() })
      toast.success('Mission updated')
      return updatedMission
    },
    onError: (error) => {
      const message = error instanceof Error ? error.message : 'Failed to update mission'
      toast.error(message)
    },
  })
}
