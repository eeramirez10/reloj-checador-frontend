import type { LeaveProfile, LeaveProfileInput } from './types'

export interface EmployeeLeaveValues {
  managerId: string
  whatsappPhone: string
  vacationBalance: string
  adjustmentReason: string
}

export function initialEmployeeLeaveValues(profile?: LeaveProfile): EmployeeLeaveValues {
  return { managerId: profile?.managerId ?? '', whatsappPhone: profile?.whatsappPhone ?? '',
    vacationBalance: String(profile?.vacationBalance ?? 0), adjustmentReason: '' }
}

export function employeeLeaveChanges(value: EmployeeLeaveValues, initial: LeaveProfile): LeaveProfileInput | undefined {
  const managerId = value.managerId || null
  const whatsappPhone = value.whatsappPhone.trim() || null
  const vacationBalance = Number(value.vacationBalance)
  if (managerId === initial.managerId && whatsappPhone === initial.whatsappPhone && vacationBalance === initial.vacationBalance) return undefined
  return { managerId, whatsappPhone, vacationBalance, expectedVersion: initial.version, adjustmentReason: value.adjustmentReason.trim() }
}
