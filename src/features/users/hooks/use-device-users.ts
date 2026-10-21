import { useQuery } from '@tanstack/react-query'
import { deviceUserQueryKeys, getDeviceUsers } from '../api/users.api'
import type { DeviceUserFilters } from '../types/device-user'

export function useDeviceUsers(filters: DeviceUserFilters = {}) {
  return useQuery({
    queryKey: deviceUserQueryKeys.list(filters),
    queryFn: ({ signal }) => getDeviceUsers(filters, signal),
  })
}
