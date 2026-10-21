import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { httpClient } from '../../shared/api/http-client'
import type { AssignmentTargets, Branch, BranchPolicy, DailyAttendance, Deduction, ReportFilters, ScheduleAssignment, WorkSchedule } from './types'

async function getList<T>(path: string, signal?: AbortSignal, params?: object): Promise<T[]> {
  const { data } = await httpClient.get<T[]>(path, { signal, params })
  if (!Array.isArray(data)) throw new Error('La API devolvió una lista con formato inválido.')
  return data
}
export function useBranches() { return useQuery({ queryKey: ['branches'], queryFn: ({ signal }) => getList<Branch>('/branches', signal) }) }
export function usePolicies() { return useQuery({ queryKey: ['branch-policies'], queryFn: ({ signal }) => getList<BranchPolicy>('/branch-policies', signal) }) }
export function useSchedules() { return useQuery({ queryKey: ['work-schedules'], queryFn: ({ signal }) => getList<WorkSchedule>('/work-schedules', signal) }) }
export function useScheduleAssignments() { return useQuery({ queryKey: ['schedule-assignments'], queryFn: ({ signal }) => getList<ScheduleAssignment>('/schedule-assignments', signal) }) }
export function useDailyAttendance(filters: ReportFilters) { return useQuery({ queryKey: ['daily-attendance', filters], queryFn: ({ signal }) => getList<DailyAttendance>('/attendance/daily', signal, filters), refetchOnMount: 'always', refetchInterval: 60_000 }) }
export function useDeductions(filters: ReportFilters) { return useQuery({ queryKey: ['deductions', filters], queryFn: ({ signal }) => getList<Deduction>('/attendance/deductions', signal, filters), refetchOnMount: 'always', refetchInterval: 60_000 }) }

export function useOrganizationMutation<T>(mutationFn: (input: T) => Promise<unknown>) {
  const client = useQueryClient()
  return useMutation({ mutationFn, onSuccess: async () => {
    await Promise.all(['branches', 'branch-policies', 'work-schedules', 'schedule-assignments', 'employees', 'employee-history', 'device-users', 'devices', 'attendance', 'daily-attendance', 'deductions']
      .map((key) => client.invalidateQueries({ queryKey: [key] })))
  } })
}
export async function saveBranch(input: { id?: string; values: Omit<Branch, 'id'> }) {
  return input.id ? httpClient.put(`/branches/${input.id}`, input.values) : httpClient.post('/branches', input.values)
}
export async function savePolicy(input: Omit<BranchPolicy, 'id'>) {
  return httpClient.post(`/branches/${input.branchId}/policies`, { effectiveFrom: input.effectiveFrom, settings: input.settings })
}
export async function saveSchedule(input: Omit<WorkSchedule, 'id'>) { return httpClient.post('/work-schedules', input) }
export async function saveAssignments(input: AssignmentTargets & { branchId?: string; scheduleId?: string | null; effectiveFrom: string }) {
  return httpClient.post('/organization/assignments', input, { timeout: 120_000 })
}
export async function recalculateAttendance() { return httpClient.post('/attendance/recalculate', {}, { timeout: 120_000 }) }
export function getToday(timeZone = 'America/Mexico_City'): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date())
}
