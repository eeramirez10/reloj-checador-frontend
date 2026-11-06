import { useQuery } from '@tanstack/react-query'
import { httpClient } from '../../shared/api/http-client'
import type { LeaveEvent, LeaveFilters, LeaveInput, LeavePreview, LeaveProfile, LeaveProfileInput, LeaveRequest } from './types'

export function useLeaveRequests(filters: LeaveFilters) {
  return useQuery({ queryKey: ['leave-requests', filters], queryFn: async ({ signal }) =>
    (await httpClient.get<{ requests: LeaveRequest[]; total: number; page: number; limit: number }>('/leave-requests', { params: filters, signal })).data })
}
export function useLeaveDetail(id: string) {
  return useQuery({ queryKey: ['leave-request', id], queryFn: async ({ signal }) =>
    (await httpClient.get<{ request: LeaveRequest; events: LeaveEvent[] }>(`/leave-requests/${id}`, { signal })).data })
}
export function useLeaveProfile(id?: string) {
  return useQuery({ queryKey: ['leave-profile', id], enabled: Boolean(id), queryFn: async ({ signal }) =>
    (await httpClient.get<LeaveProfile>(`/employees/${id}/leave-profile`, { signal })).data })
}
export async function saveLeaveProfile(id: string, input: LeaveProfileInput) { return httpClient.put(`/employees/${id}/leave-profile`, input) }
export async function previewLeave(input: LeaveInput) { return (await httpClient.post<LeavePreview>('/leave-requests/preview', input)).data }
export async function createLeave(input: LeaveInput, previewToken: string, sourceKey: string) {
  return (await httpClient.post<LeaveRequest>('/leave-requests', { input, previewToken, sourceKey })).data
}
export async function resolveLeave(id: string, input: { action: 'approve' | 'reject' | 'cancel'; expectedVersion: number; actorEmployeeId: string; comments: string }) {
  return httpClient.post(`/leave-requests/${id}/resolve`, input, { timeout: 120_000 })
}
