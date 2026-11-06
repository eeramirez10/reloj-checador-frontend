import type { EmployeeAttendanceDay, EmployeeAttendanceCard } from '../../employees/types/employee-attendance'

export interface OvertimeSettings {
  enabled: boolean
  workMode: 'daily' | 'route'
  restEnabled: boolean
  dailyRest: { startTime: string; endTime: string } | null
  additionalRestMinutes: number
}
export const defaultOvertimeSettings: OvertimeSettings = {
  enabled: false, workMode: 'daily', restEnabled: false, dailyRest: null, additionalRestMinutes: 0,
}
export interface OvertimeDay {
  enabled: true
  status: 'calculated' | 'pending' | 'no_records'
  beforeSeconds: number | null
  afterSeconds: number | null
  dayOffSeconds: number | null
  grossSeconds: number | null
  dailyRestSeconds: number | null
  additionalRestSeconds: number | null
  netSeconds: number | null
  referenceEntryTime: string | null
  referenceExitTime: string | null
  entryMarginMinutes?: number | null
  exitMarginMinutes?: number | null
  issue?: string
}
export interface RouteDaySegment {
  id: string
  entryLogId: string
  exitLogId: string | null
  enteredAt: string
  exitedAt: string | null
  segmentStart: string
  segmentEnd: string | null
  timeZone: string
  workedSeconds?: number
}
export interface OvertimeTotals {
  grossSeconds: number
  dailyRestSeconds: number
  additionalRestSeconds: number
  netSeconds: number
  calculatedDays: number
  pendingDays: number
  noRecordDays: number
}
export interface EmployeeOvertimeReport {
  employee: EmployeeAttendanceCard['employee']
  days: Array<EmployeeAttendanceDay & { overtime: OvertimeDay }>
  totals: OvertimeTotals
}
export interface OvertimeReport {
  branch: { id: string; name: string; timeZone: string }
  period: { from: string; to: string }
  employeeStatus: 'active' | 'inactive'
  employees: EmployeeOvertimeReport[]
  totals: OvertimeTotals
  totalEmployees: number
  page: number
  pageSize: number
  totalPages: number
}

export interface OvertimeReportExport extends Omit<OvertimeReport, 'page' | 'pageSize' | 'totalPages'> {
  generatedAt: string
}
