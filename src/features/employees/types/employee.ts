export type EmploymentStatus = 'active' | 'inactive' | 'pending'

export interface EmployeeClockRecord {
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
}

export interface EmployeeFilters {
  search?: string
  branchCode?: string
  employmentStatus?: EmploymentStatus
  limit?: number
  identificationStatus?: 'confirmed' | 'pending'
}
