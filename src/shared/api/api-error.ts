import axios from 'axios'

type ApiErrorResponse = {
  message?: string
}

export function getApiErrorMessage(error: unknown): string {
  if (axios.isAxiosError<ApiErrorResponse>(error)) {
    return error.response?.data?.message ?? 'No se pudo completar la solicitud.'
  }

  return error instanceof Error ? error.message : 'Ocurrió un error inesperado.'
}
