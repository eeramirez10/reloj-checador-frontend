import axios from 'axios'
import { httpClient, setCsrfToken } from '../../shared/api/http-client'
import type { AuthAccount, AuthSession } from './types'

export const sessionKey = ['auth-session'] as const
export async function getSession(signal?: AbortSignal): Promise<AuthSession | null> {
  try {
    const { data } = await httpClient.get<AuthSession>('/auth/me', { signal })
    setCsrfToken(data.csrfToken)
    return data
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 401) { setCsrfToken(null); return null }
    throw error
  }
}
export async function getAccounts(signal?: AbortSignal) {
  return (await httpClient.get<AuthAccount[]>('/auth/accounts', { signal })).data
}
export interface AccountInput {
  username: string
  name: string
  role: AuthAccount['role']
  branchIds: string[]
  isActive: boolean
  password?: string
  expectedVersion?: number
}
export async function saveAccount(input: AccountInput, id?: string) {
  return id ? (await httpClient.patch<AuthAccount>(`/auth/accounts/${id}`, input)).data : (await httpClient.post<AuthAccount>('/auth/accounts', input)).data
}
