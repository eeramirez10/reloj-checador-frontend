export interface AttendanceLog {
  id: string
  branchId?: string
  branchName?: string
  deviceId: string
  deviceLogId?: string
  userId: string
  userName?: string
  userHasPhoto: boolean
  employeeNumber?: string
  employeePosition?: string
  employeeBranchCode?: string
  verificationType?: number
  punchState?: number
  occurredAt: string
  occurredAtLocal: string
  rawData: unknown
  receivedAt: string
}

export interface AttendanceFilters {
  branchId?: string
  deviceId?: string
  userId?: string
  from?: string
  to?: string
  timeZone?: string
  limit?: number
}
