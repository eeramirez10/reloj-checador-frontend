import { apiBaseUrl, httpClient } from '../../../shared/api/http-client'
import type { DeviceUser, DeviceUserFilters } from '../types/device-user'

export const deviceUserQueryKeys = {
  all: ['device-users'] as const,
  lists: () => [...deviceUserQueryKeys.all, 'list'] as const,
  list: (filters: DeviceUserFilters) => [...deviceUserQueryKeys.lists(), filters] as const,
}

export function getDeviceUserPhotoUrl(deviceId: string, userId: string): string {
  return `${apiBaseUrl}/devices/${encodeURIComponent(deviceId)}/users/${encodeURIComponent(userId)}/photo`
}

export async function getDeviceUsers(
  filters: DeviceUserFilters = {},
  signal?: AbortSignal,
): Promise<DeviceUser[]> {
  const response = await httpClient.get<DeviceUser[]>('/users', {
    params: filters,
    signal,
  })
  if (!Array.isArray(response.data)) {
    throw new Error('La API devolvió una lista de usuarios con formato inválido.')
  }
  return response.data
}
