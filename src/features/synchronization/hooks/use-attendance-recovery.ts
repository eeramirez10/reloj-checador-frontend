import axios from 'axios'
import { useEffect, useRef, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../../auth/auth-context'
import { getApiErrorMessage } from '../../../shared/api/api-error'
import { syncDeviceAttendance } from '../api/synchronization.api'
import type { SyncRun } from '../types/sync-run'
import { invalidateAttendance } from './invalidate-attendance'

export interface RecoveryResult {
  deviceId: string
  status: 'queued' | 'running' | 'succeeded' | 'failed' | 'skipped'
  run?: SyncRun
  error?: string
}

export function useAttendanceRecovery() {
  const client = useQueryClient()
  const { account } = useAuth()
  const controller = useRef<AbortController | null>(null)
  const [busy, setBusy] = useState(false)
  const [results, setResults] = useState<RecoveryResult[]>([])

  useEffect(() => () => controller.current?.abort(), [account?.id, account?.version])

  function update(result: RecoveryResult) {
    setResults(current => current.map(item => item.deviceId === result.deviceId ? result : item))
  }

  async function recover(deviceIds: string[], date: string) {
    if (controller.current || !deviceIds.length || !date) return
    const operation = new AbortController()
    controller.current = operation
    setBusy(true)
    setResults(current => [...current.filter(item => !deviceIds.includes(item.deviceId)), ...deviceIds.map(deviceId => ({ deviceId, status: 'queued' as const }))])
    try {
      for (const [index, deviceId] of deviceIds.entries()) {
        if (operation.signal.aborted) break
        update({ deviceId, status: 'running' })
        try {
          const run = await syncDeviceAttendance(deviceId, operation.signal, date)
          if (!operation.signal.aborted) update({ deviceId, status: 'succeeded', run })
        } catch (error) {
          if (operation.signal.aborted) break
          update({ deviceId, status: 'failed', error: getApiErrorMessage(error) })
          if (axios.isAxiosError(error) && [401, 403].includes(error.response?.status ?? 0)) {
            for (const remaining of deviceIds.slice(index + 1)) update({ deviceId: remaining, status: 'skipped', error: 'Revisa tu sesión y permisos antes de continuar.' })
            break
          }
        }
      }
    } finally {
      try {
        if (!operation.signal.aborted) await invalidateAttendance(client)
      } finally {
        controller.current = null
        setBusy(false)
      }
    }
  }

  return { busy, results, recover, reset: () => setResults([]) }
}
