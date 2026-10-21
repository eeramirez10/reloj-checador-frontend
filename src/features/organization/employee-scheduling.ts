import { useQuery } from '@tanstack/react-query'
import { httpClient } from '../../shared/api/http-client'
import type { WorkSchedule } from './types'

export interface WorkHours { workDays: number[]; entryTime: string; exitTime: string }
export interface MealSettings { enabled: boolean; startTime: string; endTime: string; durationMinutes: number }
export interface EmployeeScheduleInput {
  effectiveFrom: string
  workHours: WorkHours | null
  meal: MealSettings | null
  recognitionMarginMinutes: number
  expectedVersionId?: string | null
}
export interface EmployeeScheduleVersion extends EmployeeScheduleInput {
  id: string; employeeId: string; createdAt: string; source: string
}
export interface EmployeeSchedulingView {
  employeeId: string; date: string; timeZone: string; firstAttendanceDate: string | null
  latestVersionId: string | null; version?: EmployeeScheduleVersion; baseSchedule?: WorkSchedule
  history: EmployeeScheduleVersion[]
  resolved: { settings: WorkSchedule['settings']; source: string; scheduleName: string } | null
}

export function useEmployeeScheduling(employeeId?: string) {
  return useQuery({ queryKey: ['employee-scheduling', employeeId], enabled: Boolean(employeeId),
    queryFn: async ({ signal }) => (await httpClient.get<EmployeeSchedulingView>(`/employees/${employeeId}/scheduling`, { signal })).data })
}

export function getInitialEmployeeScheduling(view: EmployeeSchedulingView | undefined, today: string): EmployeeScheduleInput {
  const legacy = view?.resolved?.settings
  const meal = view?.version ? view.version.meal : legacy && !legacy.mealPending ? {
    enabled: legacy.mealEnabled, startTime: legacy.mealStart, endTime: legacy.mealEnd, durationMinutes: legacy.mealDurationMinutes,
  } : null
  return { effectiveFrom: view?.version?.effectiveFrom ?? view?.firstAttendanceDate ?? today,
    workHours: view?.version?.workHours ?? null, meal,
    recognitionMarginMinutes: view?.version?.recognitionMarginMinutes ?? 30, expectedVersionId: view?.latestVersionId ?? null }
}
