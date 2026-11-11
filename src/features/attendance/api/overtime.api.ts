import { useQuery } from '@tanstack/react-query'
import { httpClient } from '../../../shared/api/http-client'
import type { BranchAttendanceFilters, BranchAttendanceRequest } from '../types/branch-attendance'
import type { OvertimeReport, OvertimeReportExport } from '../types/overtime'
import { companyFilterMatches } from '../../companies/api'

export async function getOvertimeReportExport(filters: BranchAttendanceFilters, signal?: AbortSignal): Promise<OvertimeReportExport> {
  const { branchId, employeeStatus, from, to,companyId } = filters
  const { data } = await httpClient.get<OvertimeReportExport>('/attendance/overtime/export', {
    params: { branchId, employeeStatus, from, to,companyId }, signal, timeout: 60_000,
  })
  if (!data || data.branch?.id !== branchId || data.period?.from !== from || data.period?.to !== to
    || !companyFilterMatches(data.companyFilter,companyId) || data.employeeStatus !== employeeStatus || !Array.isArray(data.employees) || data.employees.length !== data.totalEmployees
    || !Number.isFinite(Date.parse(data.generatedAt))) throw new Error('La API devolvió una exportación de horas extras inválida.')
  return data
}

export function useOvertimeReport(request: BranchAttendanceRequest | null) {
  return useQuery({
    queryKey: ['overtime-report', request], enabled: request !== null,
    queryFn: async ({ signal }) => {
      if (!request) throw new Error('Completa los filtros y pulsa Consultar.')
      const { branchId, employeeStatus, from, to, page,companyId } = request
      const { data } = await httpClient.get<OvertimeReport>('/attendance/overtime', {
        params: { branchId, employeeStatus, from, to, page,companyId, limit: 5 }, signal,
      })
      if (!data || data.branch?.id !== branchId || data.period?.from !== from || data.period?.to !== to
        || !companyFilterMatches(data.companyFilter,companyId) || data.employeeStatus !== employeeStatus || !Array.isArray(data.employees)) throw new Error('La API devolvió un reporte de horas extras inválido.')
      return data
    },
    refetchOnWindowFocus: false, refetchOnReconnect: false, refetchOnMount: false, retry: false, gcTime: 0,
  })
}
