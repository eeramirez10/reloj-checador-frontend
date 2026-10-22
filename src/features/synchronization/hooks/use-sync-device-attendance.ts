import { useMutation, useQueryClient } from '@tanstack/react-query'
import { attendanceQueryKeys } from '../../attendance/api/attendance.api'
import { syncDeviceAttendance, syncRunQueryKeys } from '../api/synchronization.api'

export function useSyncDeviceAttendance() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: syncDeviceAttendance,
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: attendanceQueryKeys.all }),
        queryClient.invalidateQueries({ queryKey: syncRunQueryKeys.all }),
        queryClient.invalidateQueries({ queryKey: ['daily-attendance'] }),
        queryClient.invalidateQueries({ queryKey: ['employees', 'attendance'] }),
        queryClient.invalidateQueries({ queryKey: ['deductions'] }),
      ])
    },
  })
}
