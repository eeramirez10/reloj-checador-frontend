import { httpClient } from '../../../shared/api/http-client'
import type { CreateDeviceInput, Device, DeviceInfo, UpdateDeviceInput } from '../types/device'

export const deviceQueryKeys = {
  all: ['devices'] as const,
  lists: () => [...deviceQueryKeys.all, 'list'] as const,
  detail: (deviceId: string) => [...deviceQueryKeys.all, 'detail', deviceId] as const,
}

export async function getDevices(signal?: AbortSignal): Promise<Device[]> {
  const response = await httpClient.get<Device[]>('/devices', { signal })
  if (!Array.isArray(response.data)) {
    throw new Error('La API devolvió una lista de dispositivos con formato inválido.')
  }
  return response.data
}

export async function getDevice(deviceId: string, signal?: AbortSignal): Promise<Device> {
  const response = await httpClient.get<Device>(`/devices/${deviceId}`, { signal })
  return response.data
}

export async function createDevice(input: CreateDeviceInput): Promise<Device> {
  const response = await httpClient.post<Device>('/devices', input)
  return response.data
}

export async function updateDevice(deviceId: string, input: UpdateDeviceInput): Promise<Device> {
  const response = await httpClient.patch<Device>(`/devices/${deviceId}`, input)
  return response.data
}

export async function deleteDevice(deviceId: string): Promise<void> {
  await httpClient.delete(`/devices/${deviceId}`)
}

export async function testDeviceConnection(deviceId: string): Promise<DeviceInfo> {
  const response = await httpClient.post<DeviceInfo>(`/devices/${deviceId}/test-connection`)
  return response.data
}
