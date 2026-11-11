import { useQuery } from '@tanstack/react-query'
import { httpClient } from '../../../shared/api/http-client'
import type { BranchAttendanceCards, BranchAttendanceExport, BranchAttendanceFilters, BranchAttendanceRequest } from '../types/branch-attendance'
import { companyFilterMatches } from '../../companies/api'

export async function getBranchAttendanceExport(filters: BranchAttendanceFilters, signal: AbortSignal): Promise<BranchAttendanceExport> {
  const { branchId, employeeStatus, from, to,companyId,search } = filters
  const { data } = await httpClient.get<BranchAttendanceExport>('/attendance/cards/export', {
    params: { branchId, employeeStatus, from, to,companyId,search:search?.trim() || undefined }, signal, timeout: 120_000,
  })
  if (!data || data.branch?.id !== branchId || data.employeeStatus !== employeeStatus || data.period?.from !== from || data.period?.to !== to
    || (data.search ?? '')!==(search?.trim() ?? '') || !companyFilterMatches(data.companyFilter,companyId) || !Array.isArray(data.cards) || data.cards.length !== data.totalEmployees || new Set(data.cards.map((card) => card.employee.id)).size !== data.totalEmployees) {
    throw new Error('No se pudo obtener el reporte completo para exportar. Vuelve a consultar.')
  }
  return data
}

export function useBranchAttendanceCards(request: BranchAttendanceRequest | null) {
  return useQuery({
    queryKey: ['branch-attendance-cards', request],
    enabled: request !== null,
    queryFn: async ({ signal }) => {
      if (!request) throw new Error('Completa los filtros y pulsa Consultar.')
      const { branchId, employeeStatus, from, to, page,companyId,search } = request
      const { data } = await httpClient.get<BranchAttendanceCards>('/attendance/cards', {
        params: { branchId, employeeStatus, from, to, page,companyId,search:search?.trim() || undefined, limit: 5 }, signal,
      })
      if (!data || data.branch?.id !== branchId || (data.search ?? '')!==(search?.trim() ?? '') || !companyFilterMatches(data.companyFilter,companyId) || !Array.isArray(data.cards)) throw new Error('La API devolvió un reporte de tarjetas inválido.')
      return data
    },
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchOnMount: false,
    retry: false,
    gcTime: 0,
  })
}
