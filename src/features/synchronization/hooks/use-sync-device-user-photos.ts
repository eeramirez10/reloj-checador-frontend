import { useMutation, useQueryClient } from '@tanstack/react-query'
import { deviceUserQueryKeys } from '../../users/api/users.api'
import { syncDeviceUserPhotos, syncRunQueryKeys } from '../api/synchronization.api'

export function useSyncDeviceUserPhotos() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ deviceId, userIds }: { deviceId: string; userIds: string[] }) =>
      syncDeviceUserPhotos(deviceId, userIds),
    onSettled: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: deviceUserQueryKeys.all }),
        queryClient.invalidateQueries({ queryKey: ['employees'] }),
        queryClient.invalidateQueries({ queryKey: syncRunQueryKeys.all }),
      ])
    },
  })
}
