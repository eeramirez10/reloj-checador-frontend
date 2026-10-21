import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createDevice, deviceQueryKeys, testDeviceConnection, updateDevice } from '../api/devices.api'
import type { UpdateDeviceInput } from '../types/device'

export function useCreateDevice() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createDevice,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: deviceQueryKeys.lists() })
    },
  })
}

export function useTestDeviceConnection() {
  return useMutation({
    mutationFn: testDeviceConnection,
  })
}

export function useUpdateDevice() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateDeviceInput }) => updateDevice(id, input),
    onSuccess: async () => { await queryClient.invalidateQueries({ queryKey: deviceQueryKeys.all }) },
  })
}
