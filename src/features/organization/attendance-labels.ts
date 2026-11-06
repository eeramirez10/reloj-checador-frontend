import type { DailyAttendance, Movement } from './types'

export const movementLabels: Record<Movement, string> = {
  entry: 'Entrada', meal_departure: 'Salida a comer', meal_return: 'Regreso de comida',
  exit: 'Salida del trabajo', duplicate: 'Lectura repetida', unclassified: 'Sin clasificar',
  outside_schedule: 'Fuera de horario',
}
export const dailyStatusLabels: Record<DailyAttendance['result']['status'], string> = {
  complete: 'Completo', incomplete: 'Incompleto', in_progress: 'En curso', ambiguous: 'Por identificar',
  day_off: 'Día no laboral', unconfigured: 'Sin configuración', authorized_absence: 'Ausencia autorizada',
}
export function formatAttendanceTime(value: string | undefined, timeZone: string): string {
  if (!value) return '—'
  return new Intl.DateTimeFormat('es-MX', { timeZone, hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(new Date(value))
}
