import { createContext, useContext } from 'react'
import type { AuthSession } from './types'

interface AuthContextValue {
  account: AuthSession | null | undefined
  isPending: boolean
  error: Error | null
  refresh: () => Promise<unknown>
  login: (username: string, password: string) => Promise<AuthSession>
  logout: () => Promise<void>
  clear: () => Promise<void>
}
export const AuthContext = createContext<AuthContextValue | null>(null)
export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('Falta el proveedor de autenticación.')
  return context
}
export function usePermissions() {
  const { account } = useAuth()
  return { isAdmin: account?.role === 'admin', canManagePersonnel: Boolean(account && account.role !== 'manager') }
}
