import { httpClient } from '../../../shared/api/http-client'

export interface ServiceHealth {
  status: 'ok'
}

export const serviceHealthQueryKey = ['system', 'health'] as const

export async function getServiceHealth(signal?: AbortSignal): Promise<ServiceHealth> {
  const response = await httpClient.get<ServiceHealth>('/health', { signal })
  if (response.data?.status !== 'ok') {
    throw new Error('El servicio devolvió una respuesta de estado inválida.')
  }
  return response.data
}
