import { useMutation, useQueryClient } from '@tanstack/react-query'
import { deviceUserQueryKeys } from '../../users/api/users.api'
import { syncDeviceUsers, syncRunQueryKeys } from '../api/synchronization.api'

export function useSyncDeviceUsers() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: syncDeviceUsers,
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: deviceUserQueryKeys.all }),
        queryClient.invalidateQueries({ queryKey: ['employees'] }),
        queryClient.invalidateQueries({ queryKey: syncRunQueryKeys.all }),
        queryClient.invalidateQueries({ queryKey: ['daily-attendance'] }),
        queryClient.invalidateQueries({ queryKey: ['deductions'] }),
        queryClient.invalidateQueries({ queryKey: ['overtime-report'] }),
        queryClient.invalidateQueries({ queryKey: ['branch-attendance-cards'] }),
      ])
    },
  })
}
