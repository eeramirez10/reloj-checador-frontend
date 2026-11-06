import { httpClient } from '../../../shared/api/http-client'
import type { SyncRun } from '../types/sync-run'

export const syncRunQueryKeys = {
  all: ['sync-runs'] as const,
  lists: () => [...syncRunQueryKeys.all, 'list'] as const,
  list: (deviceId?: string) => [...syncRunQueryKeys.lists(), { deviceId }] as const,
}

export interface UserPhotoSyncResult {
  requestedCount: number
  downloadedCount: number
  missingCount: number
}

function isSyncRun(value: unknown): value is SyncRun {
  if (typeof value !== 'object' || value === null) return false

  const run = value as Record<string, unknown>
  const validStatus = ['running', 'succeeded', 'failed'].includes(String(run.status))
  const validStartDate = typeof run.startedAt === 'string' && !Number.isNaN(Date.parse(run.startedAt))

  return typeof run.id === 'string'
    && typeof run.deviceId === 'string'
    && validStatus
    && validStartDate
    && typeof run.receivedCount === 'number'
    && typeof run.insertedCount === 'number'
}

export async function getSyncRuns(deviceId?: string, signal?: AbortSignal): Promise<SyncRun[]> {
  const response = await httpClient.get<SyncRun[]>('/sync-runs', {
    params: { deviceId },
    signal,
  })
  if (!Array.isArray(response.data) || !response.data.every(isSyncRun)) {
    throw new Error('La API devolvió un historial de sincronización con formato inválido.')
  }

  return response.data
}

export async function syncDeviceAttendance(deviceId: string): Promise<SyncRun> {
  const response = await httpClient.post<SyncRun>(`/devices/${deviceId}/sync-attendance`)
  return response.data
}

export async function syncDeviceUsers(deviceId: string): Promise<SyncRun> {
  const response = await httpClient.post<SyncRun>(`/devices/${deviceId}/sync-users`)
  return response.data
}

export async function syncDeviceUserPhotos(deviceId: string, userIds: string[], signal?: AbortSignal): Promise<UserPhotoSyncResult> {
  const response = await httpClient.post<UserPhotoSyncResult>(
    `/devices/${deviceId}/sync-user-photos`,
    { userIds },
    { timeout: 135_000, signal },
  )
  return response.data
}
