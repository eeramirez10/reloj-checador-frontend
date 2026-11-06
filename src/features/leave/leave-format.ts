import type { LeaveAuthorization, LeaveKind, LeaveStatus } from './types'

export const leaveKindLabels: Record<LeaveKind, string> = { absence: 'Faltar', late_arrival: 'Llegar tarde', early_exit: 'Salir temprano' }
export const leaveStatusLabels: Record<LeaveStatus, string> = { pending: 'Pendiente', approved: 'Aprobado', rejected: 'Rechazado', cancelled: 'Cancelado' }
export const leaveStatusColors = { pending: 'warning', approved: 'success', rejected: 'error', cancelled: 'default' } as const
export function leaveAuthorizationText(leave: LeaveAuthorization): string {
  const type = leave.kind === 'absence' ? 'Ausencia autorizada' : leave.kind === 'late_arrival' ? `Llegada autorizada hasta las ${leave.authorizedTime}` : `Salida autorizada desde las ${leave.authorizedTime}`
  return `${type}, ${leave.paid ? 'con' : 'sin'} goce de sueldo${leave.useVacation ? ', a cuenta de vacaciones' : ''}. Motivo: ${leave.reason}`
}
export function formatLeaveTimestamp(value: string) { return new Intl.DateTimeFormat('es-MX', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(value)) }
