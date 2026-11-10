import axios from 'axios'

export const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL || '/api').replace(/\/+$/, '')
export const apiDocsUrl = `${apiBaseUrl}/docs`

export const httpClient = axios.create({
  withCredentials: true,
  baseURL: apiBaseUrl,
  timeout: 15_000,
  headers: {
    Accept: 'application/json',
  },
})

let csrfToken: string | null = null
export function setCsrfToken(value: string | null) { csrfToken = value }
httpClient.interceptors.request.use(config => {
  if (csrfToken && !['get', 'head', 'options'].includes(config.method ?? 'get')) config.headers.set('x-csrf-token', csrfToken)
  return config
})
httpClient.interceptors.response.use(response => response, error => {
  if (axios.isAxiosError(error) && error.response?.status === 401 && !['/auth/login', '/auth/me'].includes(error.config?.url ?? '')) {
    window.dispatchEvent(new Event('auth-expired'))
  }
  return Promise.reject(error)
})
