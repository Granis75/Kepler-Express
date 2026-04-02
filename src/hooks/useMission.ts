import { useQuery } from '@tanstack/react-query'
import { getMissionById } from '../lib/api/missions'

export function useMission(missionId: string | undefined, enabled = true) {
  return useQuery({
    queryKey: ['missions', missionId],
    queryFn: async () => {
      if (!missionId) {
        throw new Error('Mission ID is required.')
      }

      return getMissionById(missionId)
    },
    enabled: enabled && Boolean(missionId),
  })
}
