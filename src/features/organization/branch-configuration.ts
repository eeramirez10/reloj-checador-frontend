import { useQuery } from '@tanstack/react-query'
import { httpClient } from '../../shared/api/http-client'
import { getToday } from './api'
import type { Branch, BranchMealSettings, BranchPolicy, PolicySettings, WorkSchedule } from './types'
import type { WorkHours } from './employee-scheduling'

export interface BranchConfigurationInput {
  effectiveFrom: string
  workHours: WorkHours
  meal: BranchMealSettings
  recognitionMarginMinutes: number
  policy: PolicySettings
  expectedVersionId?: string | null
}
export interface BranchConfigurationVersion {
  id: string
  kind: 'configuration' | 'schedule' | 'policy'
  effectiveFrom: string
  createdAt: string
  deletedAt: string | null
  schedule?: WorkSchedule
  policy?: BranchPolicy
}
export interface BranchConfigurationView {
  branch: Pick<Branch, 'id' | 'name' | 'timeZone'>
  date: string
  firstAttendanceDate: string | null
  schedule: WorkSchedule | null
  policy: BranchPolicy | null
  latestVersionId: string | null
  history: BranchConfigurationVersion[]
}

export function useBranchConfigurations() {
  return useQuery({ queryKey: ['branch-configurations'], queryFn: async ({ signal }) =>
    (await httpClient.get<BranchConfigurationView[]>('/branch-configurations', { signal })).data })
}
export function useBranchConfiguration(branchId: string) {
  return useQuery({ queryKey: ['branch-configuration', branchId], queryFn: async ({ signal }) =>
    (await httpClient.get<BranchConfigurationView>(`/branches/${branchId}/configuration`, { signal })).data })
}
export function saveBranchConfiguration({ branchId, settings }: { branchId: string; settings: BranchConfigurationInput }) {
  return httpClient.post(`/branches/${branchId}/configuration`, settings, { timeout: 120_000 })
}
export function deleteBranchConfiguration({ branchId, versionId, expectedVersionId }: { branchId: string; versionId: string; expectedVersionId: string | null }) {
  return httpClient.delete(`/branches/${branchId}/configuration/versions/${versionId}`, { data: { expectedVersionId }, timeout: 120_000 })
}
export function initialBranchConfiguration(view: BranchConfigurationView): BranchConfigurationInput {
  const schedule = view.schedule?.settings
  return {
    effectiveFrom: view.schedule ? getToday(view.branch.timeZone) : view.firstAttendanceDate ?? getToday(view.branch.timeZone),
    workHours: { workDays: schedule?.workDays ?? [1,2,3,4,5], entryTime: schedule?.entryTime ?? '08:30', exitTime: schedule?.exitTime ?? '17:30' },
    meal: schedule?.branchMeal ?? { mode: 'automatic', startTime: '00:00', endTime: '00:00', durationMinutes: 60 },
    recognitionMarginMinutes: schedule?.recognitionMarginMinutes ?? 30,
    policy: { entryToleranceMinutes: 0, mealToleranceMinutes: 0, entryAllowedTardies: 3, mealAllowedTardies: 3,
      accumulationMode: 'first_lateness', accumulationDays: 30, ...view.policy?.settings,
      entryRepeatWindowMinutes: view.policy?.settings.entryRepeatWindowMinutes ?? 20 },
    expectedVersionId: view.latestVersionId,
  }
}
export function branchMealLabel(meal?: BranchMealSettings): string {
  if (!meal || meal.mode === 'automatic') return 'Automática'
  if (meal.mode === 'disabled') return 'Sin movimientos'
  return `${meal.startTime}${meal.endTime !== meal.startTime ? `–${meal.endTime}` : ''} · ${meal.durationMinutes} min`
}
