import { useQuery } from '@tanstack/react-query'
import { deviceQueryKeys, getDevices } from '../api/devices.api'

export function useDevices() {
  return useQuery({
    queryKey: deviceQueryKeys.lists(),
    queryFn: ({ signal }) => getDevices(signal),
  })
}
