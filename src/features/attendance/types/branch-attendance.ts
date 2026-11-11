import type { EmployeeAttendanceCard } from '../../employees/types/employee-attendance'
import type { CompanySelection } from '../../companies/api'

export interface BranchAttendanceFilters {
  search?: string
  companyId?: string
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
  search?: string
  companyFilter?: CompanySelection
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
