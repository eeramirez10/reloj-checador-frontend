export interface DeviceUserRoleSnapshot {
  userId: string; uid: number; role: number; administratorCount: number; totalUsers: number; measuredAt: string
}
export interface DeviceUserRoleChange {
  id: string; employeeId: string; clockRecordId: string; deviceId: string; userId: string; requestedRole: 0 | 14
  status: 'running' | 'succeeded' | 'blocked' | 'failed' | 'unconfirmed'
  before: DeviceUserRoleSnapshot | null; after: DeviceUserRoleSnapshot | null; code: string | null; error: string | null
  startedAt: string; completedAt: string | null
}
