import { useQuery } from '@tanstack/react-query'
import { attendanceQueryKeys, getAttendance } from '../api/attendance.api'
import type { AttendanceFilters } from '../types/attendance-log'

export function useAttendance(filters: AttendanceFilters = {}) {
  return useQuery({
    queryKey: attendanceQueryKeys.list(filters),
    queryFn: ({ signal }) => getAttendance(filters, signal),
    refetchOnMount: 'always',
  })
}
