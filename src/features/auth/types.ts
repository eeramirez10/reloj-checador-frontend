export type AccountRole = 'admin' | 'hr' | 'manager'
export interface AuthAccount {
  id: string
  username: string
  name: string
  role: AccountRole
  branchIds: string[]
  isActive: boolean
  mustChangePassword: boolean
  version: number
}
export interface AuthSession extends AuthAccount { csrfToken: string }
export const roleLabels: Record<AccountRole, string> = { admin: 'Administrador', hr: 'Recursos humanos', manager: 'Encargado' }

export function canOpenPage(role: AccountRole, path: string): boolean {
  if (['/accounts', '/branches', '/devices'].includes(path)) return role === 'admin'
  if (['/assignments', '/schedules', '/synchronization'].includes(path)) return role !== 'manager'
  return true
}
