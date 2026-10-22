import type { EmployeeAttendanceCard } from '../../employees/types/employee-attendance'

export interface BranchAttendanceFilters {
  branchId: string
  employeeStatus: 'active' | 'inactive'
  from: string
  to: string
}
export interface BranchAttendanceRequest extends BranchAttendanceFilters {
  page: number
  sequence: number
}
export interface BranchAttendanceCards {
  branch: { id: string; name: string; timeZone: string }
  period: { from: string; to: string }
  employeeStatus: 'active' | 'inactive'
  page: number
  pageSize: number
  totalEmployees: number
  totalPages: number
  cards: EmployeeAttendanceCard[]
}
export interface BranchAttendanceExport extends Omit<BranchAttendanceCards, 'page' | 'pageSize' | 'totalPages'> {
  generatedAt: string
}
