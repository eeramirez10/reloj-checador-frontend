import { useQuery } from '@tanstack/react-query'
import { getSyncRuns, syncRunQueryKeys } from '../api/synchronization.api'

export function useSyncRuns(deviceId?: string) {
  return useQuery({
    queryKey: syncRunQueryKeys.list(deviceId),
    queryFn: ({ signal }) => getSyncRuns(deviceId, signal),
  })
}
