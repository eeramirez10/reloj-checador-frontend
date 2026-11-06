import { httpClient } from '../../../shared/api/http-client'
import type { ClockAdjustment, ClockTimeSnapshot } from '../types/device-clock'

export const clockQueryKeys = {
  time: (id: string) => ['devices', id, 'clock-time'] as const,
  history: (id: string) => ['devices', id, 'clock-history'] as const,
}

export async function getClockTime(id: string, signal?: AbortSignal): Promise<ClockTimeSnapshot> {
  return (await httpClient.get<ClockTimeSnapshot>(`/devices/${id}/clock-time`, { signal, timeout: 150_000 })).data
}

export async function synchronizeClockTime(id: string): Promise<ClockAdjustment> {
  return (await httpClient.post<ClockAdjustment>(`/devices/${id}/clock-time/synchronize`, {}, { timeout: 420_000 })).data
}

export async function setManualClockTime(id: string, localTime: string): Promise<ClockAdjustment> {
  return (await httpClient.post<ClockAdjustment>(`/devices/${id}/clock-time/manual`, { localTime }, { timeout: 420_000 })).data
}

export async function getClockHistory(id: string, signal?: AbortSignal): Promise<ClockAdjustment[]> {
  return (await httpClient.get<ClockAdjustment[]>(`/devices/${id}/clock-time/history`, { signal })).data
}
