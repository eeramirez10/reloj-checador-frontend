import { useQuery } from '@tanstack/react-query'
import { httpClient } from '../../../shared/api/http-client'
import type { AttendanceFileInput, AttendanceFilePreview, AttendanceFileResult, AttendanceFileHistoryEntry } from '../types/attendance-file'

export async function previewAttendanceFile(input: AttendanceFileInput, signal: AbortSignal) {
  return (await httpClient.post<AttendanceFilePreview>('/attendance/imports/preview', input, { signal, timeout: 120_000 })).data
}
export async function importAttendanceFile(input: AttendanceFileInput, expectedToken: string) {
  return (await httpClient.post<AttendanceFileResult>('/attendance/imports', { ...input, expectedToken }, { timeout: 120_000 })).data
}
export function useAttendanceFileHistory(deviceId: string, enabled: boolean) {
  return useQuery({ queryKey: ['attendance-file-history', deviceId], enabled: Boolean(deviceId) && enabled,
    queryFn: async ({ signal }) => (await httpClient.get<AttendanceFileHistoryEntry[]>('/attendance/imports', { params: { deviceId }, signal })).data })
}
