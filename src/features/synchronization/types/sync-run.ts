export type SyncType = 'attendance' | 'users' | 'user_photos'
export type SyncStatus = 'running' | 'succeeded' | 'failed'

export interface SyncRun {
  id: string
  deviceId: string
  syncType: SyncType
  status: SyncStatus
  startedAt: string
  completedAt?: string
  receivedCount: number
  insertedCount: number
  errorMessage?: string
}
