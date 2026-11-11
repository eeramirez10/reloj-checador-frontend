import type { LeaveAuthorization, LeaveKind, LeaveStatus } from './types'

export const leaveKindLabels: Record<LeaveKind, string> = { absence: 'Faltar', late_arrival: 'Llegar tarde', early_exit: 'Salir temprano',home_office:'Home office',client_visit:'Visita a cliente' }
export const leaveStatusLabels: Record<LeaveStatus, string> = { pending: 'Pendiente', approved: 'Aprobado', rejected: 'Rechazado', cancelled: 'Cancelado' }
export const leaveStatusColors = { pending: 'warning', approved: 'success', rejected: 'error', cancelled: 'default' } as const
export function leaveAuthorizationText(leave: LeaveAuthorization): string {
  const labels:Record<LeaveKind,string>={absence:'Ausencia autorizada',late_arrival:leave.authorizedTime?`Llegada autorizada hasta las ${leave.authorizedTime}`:'Llegada tarde autorizada, sin hora definida',
    early_exit:leave.authorizedTime?`Salida autorizada desde las ${leave.authorizedTime}`:'Salida temprana autorizada, sin hora definida',home_office:'Home office autorizado, día completo',
    client_visit:`Visita a cliente autorizada, ${leave.fullDay===false?'visita abierta, sin horario fijo':'día completo'}${leave.clientName?` · Cliente: ${leave.clientName}`:''}`}
  const type=labels[leave.kind]
  return `${type}, ${leave.paid ? 'con' : 'sin'} goce de sueldo${leave.useVacation ? ', a cuenta de vacaciones' : ''}. Motivo: ${leave.reason}`
}
export function formatLeaveTimestamp(value: string) { return new Intl.DateTimeFormat('es-MX', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(value)) }
