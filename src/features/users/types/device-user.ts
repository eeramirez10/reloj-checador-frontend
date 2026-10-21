import type { UserPhotoReference } from './user-photo-reference'
import type { EmploymentStatus } from '../../employees/types/employee'

export interface DeviceUser extends UserPhotoReference {
  id: string
  employeeId?: string
  branchId?: string
  branchName?: string
  displayName?: string
  firstName?: string
  lastName?: string
  rfc?: string
  socialSecurityNumber?: string
  uid?: number
  role?: number
  cardNumber?: string
  rawData: Record<string, unknown>
  syncedAt: string
  employeeNumber?: string
  employeeName?: string
  employeePosition?: string
  employeeBranchCode?: string
  employeeStatus?: EmploymentStatus
}

export interface DeviceUserFilters {
  deviceId?: string
  limit?: number
}
