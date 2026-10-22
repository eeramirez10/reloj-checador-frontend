import type { DailyAttendance, ScheduleSettings } from '../../organization/types'
import type { Employee } from './employee'

export interface AttendancePeriod { from: string; to: string }
export type EmployeeAttendanceStatus = DailyAttendance['result']['status'] | 'no_records' | 'upcoming'
export interface EmployeeAttendanceDay {
  date: string
  status: EmployeeAttendanceStatus
  branchName: string | null
  timeZone: string
  scheduleName: string | null
  scheduleSettings: ScheduleSettings | null
  entry: string | null
  mealDeparture: string | null
  mealReturn: string | null
  exit: string | null
  mealMinutes: number | null
  workedMinutes: number | null
  arrivalDelayMinutes: number | null
  earlyExitMinutes: number | null
  issues: string[]
  missingMovements: NonNullable<DailyAttendance['result']['missingMovements']>
  punches: DailyAttendance['result']['punches']
  incidents: DailyAttendance['result']['incidents']
}
export interface EmployeeAttendanceSummary {
  recordedDays: number
  completeDays: number
  incompleteDays: number
  daysWithoutRecords: number
  daysOff: number
  arrivalTardies: number
  mealTardies: number
  earlyExits: number
  workedMinutes: number
  calculableDays: number
}
export interface EmployeeAttendanceCard {
  employee: Employee
  period: AttendancePeriod
  days: EmployeeAttendanceDay[]
  summary: EmployeeAttendanceSummary
}
