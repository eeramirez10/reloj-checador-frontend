export interface ClockTimeSnapshot {
  localTime: string
  measuredAt: string
  timeZone: string
  referenceLocalTime: string
  driftSeconds: number
}

export interface ClockAdjustment {
  id: string
  deviceId: string
  timeZone: string
  status: 'running' | 'succeeded' | 'failed'
  mode: 'server' | 'manual'
  requestedLocalTime: string | null
  before: ClockTimeSnapshot | null
  target: { localTime: string; sentAt: string } | null
  after: ClockTimeSnapshot | null
  error: string | null
  startedAt: string
  completedAt: string | null
}

export type ClockAdjustmentRequest = { mode: 'server' } | { mode: 'manual'; localTime: string }
