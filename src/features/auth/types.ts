export type AccountRole = 'admin' | 'hr' | 'manager' | 'employee'
export interface AuthAccount {
  id: string
  username: string
  name: string
  role: AccountRole
  branchIds: string[]
  isActive: boolean
  mustChangePassword: boolean
  version: number
  employeeId?: string | null
}
export interface AuthSession extends AuthAccount { csrfToken: string }
export const roleLabels: Record<AccountRole, string> = { admin: 'Administrador', hr: 'Recursos humanos', manager: 'Encargado', employee: 'Empleado' }

export function canOpenPage(role: AccountRole, path: string): boolean {
  if (role === 'employee') return path === '/' || path.startsWith('/my/')
  if(path==='/companies')return ['admin','hr'].includes(role)
  if (['/accounts', '/branches', '/devices'].includes(path)) return role === 'admin'
  if (['/assignments', '/schedules', '/synchronization'].includes(path)) return role !== 'manager'
  return true
}
