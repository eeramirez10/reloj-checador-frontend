export type DeviceDriver = 'node' | 'sdk-bridge'

export interface Device {
  id: string
  branchId?: string
  timeZone?: string
  name: string
  ipAddress: string
  tcpPort: number
  driver: DeviceDriver
  enabled: boolean
  syncIntervalSeconds: number
  createdAt: string
  updatedAt: string
}

export interface CreateDeviceInput {
  branchId: string
  name: string
  ipAddress: string
  tcpPort?: number
  driver?: DeviceDriver
  enabled?: boolean
  syncIntervalSeconds?: number
}

export type UpdateDeviceInput = Partial<CreateDeviceInput>

export interface DeviceInfo {
  raw: unknown
}
