import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useCallback, useEffect, type PropsWithChildren } from 'react'
import { httpClient, setCsrfToken } from '../../shared/api/http-client'
import { getSession, sessionKey } from './api'
import type { AuthSession } from './types'
import { AuthContext } from './auth-context'

export function AuthProvider({ children }: PropsWithChildren) {
  const client = useQueryClient()
  const clearPrivateQueries = useCallback(async () => {
    const filter = { predicate: (query: { queryKey: readonly unknown[] }) => query.queryKey[0] !== sessionKey[0] }
    await client.cancelQueries(filter)
    client.removeQueries(filter)
    client.getMutationCache().clear()
  }, [client])
  const session = useQuery({
    queryKey: sessionKey,
    queryFn: async ({ signal }) => {
      const result = await getSession(signal)
      const previous = client.getQueryData<AuthSession | null>(sessionKey)
      if (previous && (previous.id !== result?.id || previous.version !== result?.version)) await clearPrivateQueries()
      return result
    },
    retry: false,
    staleTime: 0,
    refetchOnWindowFocus: true,
    refetchInterval: 60_000,
  })
  const clear = useCallback(async () => {
    await client.cancelQueries({ queryKey: sessionKey })
    setCsrfToken(null)
    client.setQueryData(sessionKey, null)
    await clearPrivateQueries()
  }, [client, clearPrivateQueries])
  useEffect(() => {
    const expired = () => { void clear() }
    window.addEventListener('auth-expired', expired)
    return () => window.removeEventListener('auth-expired', expired)
  }, [clear])

  async function login(username: string, password: string) {
    await client.cancelQueries({ queryKey: sessionKey })
    await clearPrivateQueries()
    await httpClient.post('/auth/login', { username, password })
    const account = await getSession()
    if (!account) throw new Error('No se pudo iniciar la sesión. Revisa la configuración de cookies del servicio.')
    client.setQueryData(sessionKey, account)
    return account
  }
  async function logout() { await httpClient.post('/auth/logout', {}); await clear() }

  return <AuthContext.Provider value={{ account: session.data, isPending: session.isPending, error: session.error, refresh: session.refetch, login, logout, clear }}>{children}</AuthContext.Provider>
}
