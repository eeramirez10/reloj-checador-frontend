export type EmploymentStatus = 'active' | 'inactive' | 'pending'

export interface EmployeeClockRecord {
  uid?: number
  roleObservedAt?: string | null
  id: string
  deviceId: string
  userId: string
  name?: string
  deviceName: string
  branchId?: string
  bindingStatus: 'active' | 'historical'
  hasPhoto: boolean
  syncedAt: string
  cardNumber?: string
  role?: number
  originalProfile: Record<string, unknown>
}

export interface Employee {
  hasAttendance?: boolean
  companyId?: string | null
  companyName?: string | null
  id: string
  branchId?: string
  branchName?: string
  employeeNumber?: string
  normalizedEmployeeNumber?: string
  name: string
  firstName?: string
  lastName?: string
  position?: string
  rfc?: string
  imss?: string
  managementCode?: string
  sectionCode?: string
  companyCode?: string
  branchCode?: string
  scheduleTypeCode?: string
  hireDate?: string
  terminationDate?: string
  employmentStatus: EmploymentStatus
  createdAt: string
  updatedAt: string
  identificationStatus: 'confirmed' | 'pending' | 'merged'
  mergedIntoId?: string
  clockRecords: EmployeeClockRecord[]
  isActive: boolean
  originalName?: string
  nameSplitMethod?: string
  scheduling?: Omit<EmployeeScheduleInput, 'expectedVersionId'> & { versionId: string }
}

export interface EmployeeFilters {
  sortBy?:'name'|'branch'|'company'
  sortOrder?:'asc'|'desc'
  branchId?: string
  companyId?: string
  search?: string
  branchCode?: string
  employmentStatus?: EmploymentStatus
  limit?: number
  identificationStatus?: 'confirmed' | 'pending'
}
import type { EmployeeScheduleInput } from '../../organization/employee-scheduling'
