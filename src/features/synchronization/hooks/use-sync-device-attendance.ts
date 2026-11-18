import { useMutation, useQueryClient } from '@tanstack/react-query'
import { syncDeviceAttendance } from '../api/synchronization.api'
import { invalidateAttendance } from './invalidate-attendance'

export function useSyncDeviceAttendance() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (deviceId: string) => syncDeviceAttendance(deviceId),
    retry: false,
    onSettled: () => invalidateAttendance(queryClient),
  })
}
