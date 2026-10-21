import { httpClient } from '../../../shared/api/http-client'
import type { AttendanceFilters, AttendanceLog } from '../types/attendance-log'

export const attendanceQueryKeys = {
  all: ['attendance', 'with-user-photos'] as const,
  lists: () => [...attendanceQueryKeys.all, 'list'] as const,
  list: (filters: AttendanceFilters) => [...attendanceQueryKeys.lists(), filters] as const,
}

export async function getAttendance(
  filters: AttendanceFilters = {},
  signal?: AbortSignal,
): Promise<AttendanceLog[]> {
  const response = await httpClient.get<AttendanceLog[]>('/attendance', {
    params: filters,
    signal,
  })
  if (!Array.isArray(response.data)) {
    throw new Error('La API devolvió una lista de checadas con formato inválido.')
  }
  return response.data
}
