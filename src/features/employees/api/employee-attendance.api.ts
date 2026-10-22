import { useQuery } from '@tanstack/react-query'
import { httpClient } from '../../../shared/api/http-client'
import type { AttendancePeriod, EmployeeAttendanceCard } from '../types/employee-attendance'
import { validateAttendancePeriod } from '../employee-attendance-format'

export function useEmployeeAttendance(employeeId: string, period: AttendancePeriod) {
  return useQuery({
    queryKey: ['employees', 'attendance', employeeId, period],
    queryFn: async ({ signal }) => {
      const { data } = await httpClient.get<EmployeeAttendanceCard>(`/employees/${employeeId}/attendance`, { params: period, signal })
      if (data.employee?.id !== employeeId || !Array.isArray(data.days)) throw new Error('La API devolvió una tarjeta de asistencia inválida.')
      return data
    },
    enabled: Boolean(employeeId) && !validateAttendancePeriod(period),
    refetchOnMount: 'always',
  })
}
