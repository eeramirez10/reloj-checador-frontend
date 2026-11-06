import { useQuery } from '@tanstack/react-query'
import { httpClient } from '../../../shared/api/http-client'
import type { DeviceUserRoleChange, DeviceUserRoleSnapshot } from '../types/device-user-role'

export async function readDeviceUserRole(employeeId: string, clockRecordId: string) {
  return (await httpClient.get<{ clockRecordId: string; snapshot: DeviceUserRoleSnapshot }>(`/employees/${employeeId}/clock-role`, { params: { clockRecordId },timeout: 150_000 })).data
}
export async function changeDeviceUserRole(employeeId: string, input: { clockRecordId: string; uid: number; expectedRole: number; role: 0 | 14 }) {
  return (await httpClient.post<DeviceUserRoleChange>(`/employees/${employeeId}/clock-role`,input,{ timeout: 150_000 })).data
}
export function useDeviceUserRoleHistory(employeeId: string, enabled: boolean) {
  return useQuery({ queryKey: ['device-user-role-history',employeeId],enabled,
    queryFn: async ({ signal }) => (await httpClient.get<DeviceUserRoleChange[]>(`/employees/${employeeId}/clock-role/history`,{ signal })).data })
}
