import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useEffect, useRef, useState } from 'react'
import { getApiErrorMessage } from '../../../shared/api/api-error'
import { deviceUserQueryKeys } from '../../users/api/users.api'
import { syncDeviceUserPhotos, syncRunQueryKeys } from '../api/synchronization.api'
import type { UserPhotoSyncOutcome, UserPhotoSyncProgress, UserPhotoSyncSummary, UserPhotoSyncTarget } from '../types/user-photo-sync'

interface PhotoSyncInput {
  deviceId: string
  deviceName: string
  targets: UserPhotoSyncTarget[]
}

export function useSyncDeviceUserPhotos() {
  const queryClient = useQueryClient()
  const [progress, setProgress] = useState<UserPhotoSyncProgress | null>(null)
  const controller = useRef<AbortController | null>(null)
  useEffect(() => () => controller.current?.abort(), [])

  const mutation = useMutation({
    retry: false,
    mutationFn: async ({ deviceId, deviceName, targets }: PhotoSyncInput): Promise<UserPhotoSyncSummary> => {
      const outcomes: UserPhotoSyncOutcome[] = []
      const current = new AbortController()
      controller.current = current
      for (const [index, target] of targets.entries()) {
        if (current.signal.aborted) break
        setProgress({ current: index + 1, total: targets.length, target })
        try {
          const result = await syncDeviceUserPhotos(deviceId, [target.userId], current.signal)
          if (result.downloadedCount !== 0 && result.downloadedCount !== 1) {
            throw new Error('El backend devolvió una cantidad de fotos inválida para este empleado.')
          }
          outcomes.push({ ...target, status: result.downloadedCount === 1 ? 'downloaded' : 'missing' })
        } catch (error) {
          if (current.signal.aborted) break
          outcomes.push({ ...target, status: 'error', message: getApiErrorMessage(error) })
        }
      }
      return { deviceName, outcomes }
    },
    onSettled: async () => {
      setProgress(null)
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: deviceUserQueryKeys.all }),
        queryClient.invalidateQueries({ queryKey: ['employees'] }),
        queryClient.invalidateQueries({ queryKey: syncRunQueryKeys.all }),
      ])
    },
  })

  return { ...mutation, progress }
}
