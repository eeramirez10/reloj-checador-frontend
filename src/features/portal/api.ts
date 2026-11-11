import { useQuery } from '@tanstack/react-query'
import { httpClient } from '../../shared/api/http-client'
export interface EmployeeContact {
  employeeId: string; email: string | null; whatsappPhone: string | null; alternatePhone: string | null; bloodType: string | null; version: number
}
export interface ContactValues { email: string; whatsappPhone: string; alternatePhone: string; bloodType: string }
export interface PortalProfile {
  companyId?: string | null; companyName?: string | null
  employeeId: string; name: string; employeeNumber: string | null; branchName: string | null; managerName: string | null
  vacationBalance: number; timeZone: string; hasReports: boolean; contact: EmployeeContact
}
export function contactValues(contact?: EmployeeContact): ContactValues {
  return { email: contact?.email ?? '',whatsappPhone: contact?.whatsappPhone ?? '',alternatePhone: contact?.alternatePhone ?? '',bloodType: contact?.bloodType ?? '' }
}
export function contactInput(value: ContactValues, version: number, includeEmail = true) {
  return { ...(includeEmail ? { email: value.email.trim() || null } : {}),whatsappPhone: value.whatsappPhone.trim() || null,
    alternatePhone: value.alternatePhone.trim() || null,bloodType: value.bloodType || null,expectedVersion: version }
}
export function useMyProfile(enabled = true) {
  return useQuery({ queryKey: ['my-profile'],enabled,queryFn: async ({ signal }) => (await httpClient.get<PortalProfile>('/me/profile',{ signal })).data })
}
export function useEmployeeContact(id?: string) {
  return useQuery({ queryKey: ['employee-contact',id],enabled: Boolean(id),queryFn: async ({ signal }) => (await httpClient.get<EmployeeContact>(`/employees/${id}/contact`,{ signal })).data })
}
export function useBloodTypes() {
  return useQuery({ queryKey: ['blood-types'],staleTime: Infinity,queryFn: async ({ signal }) => (await httpClient.get<string[]>('/blood-types',{ signal })).data })
}
export function useManagerOptions() {
  return useQuery({ queryKey: ['manager-options'],queryFn: async ({ signal }) => (await httpClient.get<{ id: string; name: string; branchName: string | null }[]>('/manager-options',{ signal })).data })
}
