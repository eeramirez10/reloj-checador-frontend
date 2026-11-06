import { useQuery } from '@tanstack/react-query'
import { httpClient } from '../../../shared/api/http-client'
import type { BranchAttendanceFilters, BranchAttendanceRequest } from '../types/branch-attendance'
import type { OvertimeReport, OvertimeReportExport } from '../types/overtime'

export async function getOvertimeReportExport(filters: BranchAttendanceFilters, signal?: AbortSignal): Promise<OvertimeReportExport> {
  const { branchId, employeeStatus, from, to } = filters
  const { data } = await httpClient.get<OvertimeReportExport>('/attendance/overtime/export', {
    params: { branchId, employeeStatus, from, to }, signal, timeout: 60_000,
  })
  if (!data || data.branch?.id !== branchId || data.period?.from !== from || data.period?.to !== to
    || data.employeeStatus !== employeeStatus || !Array.isArray(data.employees) || data.employees.length !== data.totalEmployees
    || !Number.isFinite(Date.parse(data.generatedAt))) throw new Error('La API devolvió una exportación de horas extras inválida.')
  return data
}

export function useOvertimeReport(request: BranchAttendanceRequest | null) {
  return useQuery({
    queryKey: ['overtime-report', request], enabled: request !== null,
    queryFn: async ({ signal }) => {
      if (!request) throw new Error('Completa los filtros y pulsa Consultar.')
      const { branchId, employeeStatus, from, to, page } = request
      const { data } = await httpClient.get<OvertimeReport>('/attendance/overtime', {
        params: { branchId, employeeStatus, from, to, page, limit: 5 }, signal,
      })
      if (!data || data.branch?.id !== branchId || data.period?.from !== from || data.period?.to !== to
        || data.employeeStatus !== employeeStatus || !Array.isArray(data.employees)) throw new Error('La API devolvió un reporte de horas extras inválido.')
      return data
    },
    refetchOnWindowFocus: false, refetchOnReconnect: false, refetchOnMount: false, retry: false, gcTime: 0,
  })
}
