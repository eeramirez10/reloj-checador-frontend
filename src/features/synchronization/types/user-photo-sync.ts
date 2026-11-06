export interface UserPhotoSyncTarget {
  employeeId: string
  name: string
  userId: string
}

export interface UserPhotoSyncOutcome extends UserPhotoSyncTarget {
  status: 'downloaded' | 'missing' | 'error'
  message?: string
}

export interface UserPhotoSyncSummary {
  deviceName: string
  outcomes: UserPhotoSyncOutcome[]
}

export interface UserPhotoSyncProgress {
  current: number
  total: number
  target: UserPhotoSyncTarget
}
