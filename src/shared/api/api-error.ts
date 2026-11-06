import axios from 'axios'

type ApiErrorResponse = {
  message?: string
}

export function getApiErrorMessage(error: unknown): string {
  if (axios.isAxiosError<ApiErrorResponse>(error)) {
    const message = error.response?.data?.message
    if (typeof message === 'string' && message.trim()) return message
    if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') return 'Se agotó el tiempo de espera de la solicitud. Consulta su resultado antes de volver a intentarlo.'
    if (error.code === 'ERR_NETWORK') return 'El navegador no pudo comunicarse con el backend. Revisa que el servicio esté disponible.'
    return 'No se pudo completar la solicitud.'
  }

  return error instanceof Error ? error.message : 'Ocurrió un error inesperado.'
}
