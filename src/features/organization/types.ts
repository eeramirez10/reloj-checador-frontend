import type { UserPhotoReference } from '../users/types/user-photo-reference'
import type { OvertimeDay, RouteDaySegment } from '../attendance/types/overtime'
import type { LeaveAuthorization } from '../leave/types'

export interface Branch {
  id: string
  name: string
  street: string
  exteriorNumber: string
  interiorNumber: string
  neighborhood: string
  postalCode: string
  city: string
  state: string
  country: string
  phone: string
  email: string
  managerName: string
  timeZone: string
  active: boolean
  notes: string
}
export interface PolicySettings {
  overtimeEntryMarginMinutes?: number
  overtimeExitMarginMinutes?: number
  entryRepeatWindowMinutes?: number
  entryToleranceMinutes: number
  mealToleranceMinutes: number
  entryAllowedTardies: number
  mealAllowedTardies: number
  accumulationMode: 'first_lateness' | 'calendar_month'
  accumulationDays: number
}
export interface BranchPolicy {
  id: string
  branchId: string
  effectiveFrom: string
  settings: PolicySettings
  createdAt?: string
  configurationId?: string | null
  supersededFrom?: string | null
  deletedAt?: string | null
}
export interface BranchMealSettings {
  mode: 'automatic' | 'configured' | 'disabled'
  startTime: string
  endTime: string
  durationMinutes: number
}
export interface ScheduleSettings {
  workDays: number[]
  entryTime: string
  exitTime: string
  mealEnabled: boolean
  mealStart: string
  mealEnd: string
  mealDurationMinutes: number
  mealMode?: 'schedule' | 'individual'
  mealPending?: boolean
  recognitionMarginMinutes?: number
  mealDetection?: 'automatic' | 'configured' | 'disabled' | 'invalid'
  branchMeal?: BranchMealSettings
  mealSource?: 'branch' | 'individual' | 'automatic'
}
export interface WorkSchedule {
  id: string
  branchId: string
  name: string
  effectiveFrom: string
  isDefault: boolean
  settings: ScheduleSettings
  supersededFrom?: string | null
  createdAt?: string
  configurationId?: string | null
  deletedAt?: string | null
}
export interface AssignmentTargets {
  employeeIds?: string[]
  deviceUserIds?: string[]
  deviceIds?: string[]
}
export interface ScheduleAssignment {
  id: string
  employeeId?: string
  deviceUserId?: string
  scheduleId: string | null
  effectiveFrom: string
}
export type Movement = 'entry' | 'meal_departure' | 'meal_return' | 'exit' | 'unclassified' | 'duplicate' | 'outside_schedule'
export interface DailyAttendance {
  companyId?: string | null
  companyName?: string | null
  id: string
  subjectId: string
  employeeId?: string
  deviceUserId?: string
  date: string
  branchId?: string
  photo?: UserPhotoReference | null
  result: {
    name: string
    employeeNumber?: string
    userIds: string[]
    branchName?: string
    scheduleName?: string
    timeZone: string
    status: 'complete' | 'incomplete' | 'in_progress' | 'ambiguous' | 'day_off' | 'unconfigured' | 'authorized_absence'
    leaveAuthorizations?: LeaveAuthorization[]
    entry?: string
    mealDeparture?: string
    mealReturn?: string
    expectedMealReturn?: string
    exit?: string
    mealMinutes?: number
    workedMinutes?: number
    issues: string[]
    punches: Array<{ id: string; occurredAt: string; localTime: string; movement: Movement }>
    incidents: Array<{ kind: string; minutes: number }>
    counters: { arrival: number; meal: number }
    deductionDays: number
    policy?: PolicySettings
    missingMovements?: Array<'entry' | 'meal_departure' | 'meal_return' | 'exit'>
    mealConfigured?: boolean
    mealDetection?: 'automatic' | 'configured' | 'disabled' | 'invalid'
    policyConfigured?: boolean
    scheduleSource?: 'branch' | 'individual' | 'legacy'
    scheduleSettings?: ScheduleSettings
    overtime?: OvertimeDay
    routes?: RouteDaySegment[]
  }
}
export interface Deduction {
  companyId?: string | null
  companyName?: string | null
  id: string
  subjectId: string
  name: string
  branchName: string
  timeZone: string
  category: 'arrival' | 'meal'
  salaryDays: number
  windowStart: string
  windowEnd: string
  incidentIds: string[]
  occurredAt: string
  voidedAt?: string
}
export interface ReportFilters { from: string; to: string; branchId?: string; subjectId?: string; companyId?: string }
