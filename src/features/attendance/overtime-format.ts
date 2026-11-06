import type { OvertimeDay } from './types/overtime'

export function formatOvertime(seconds: number | null): string {
  if (seconds === null) return '—'
  const minutes = Math.floor(seconds / 60)
  return `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`
}

export function formatExactOvertime(seconds: number | null): string {
  return seconds === null ? 'Pendiente de cálculo' : `${formatOvertime(seconds)}:${String(seconds % 60).padStart(2, '0')}`
}

export function formatRouteDate(value: string | null, timeZone: string): string {
  return value ? new Intl.DateTimeFormat('es-MX', { timeZone, dateStyle: 'short', timeStyle: 'medium', hour12: false }).format(new Date(value)) : 'Pendiente de regreso'
}

export function formatOvertimeMargins(overtime: OvertimeDay): string | null {
  const entry = overtime.entryMarginMinutes ?? 0
  const exit = overtime.exitMarginMinutes ?? 0
  return entry || exit ? `Márgenes extras entrada / salida: ${entry} / ${exit} min, ya descontados en Antes y Después.` : null
}
