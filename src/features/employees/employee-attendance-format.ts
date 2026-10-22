import type { AttendancePeriod, EmployeeAttendanceDay, EmployeeAttendanceStatus } from './types/employee-attendance'

export const attendanceStatusLabels: Record<EmployeeAttendanceStatus, string> = {
  complete: 'Completo', incomplete: 'Incompleto', in_progress: 'En curso', ambiguous: 'Por revisar', day_off: 'Descanso',
  unconfigured: 'Revisar horario', no_records: 'Sin registros', upcoming: 'Pendiente',
}

const dateFormatter = new Intl.DateTimeFormat('es-MX', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'UTC' })
const weekdayFormatter = new Intl.DateTimeFormat('es-MX', { weekday: 'short', timeZone: 'UTC' })

export function formatCardDate(date: string) { return dateFormatter.format(new Date(`${date}T12:00:00Z`)) }
export function formatCardWeekday(date: string) { return weekdayFormatter.format(new Date(`${date}T12:00:00Z`)) }

export function formatWorkedTime(minutes: number | null): string {
  return minutes === null ? '—' : `${String(Math.floor(minutes / 60)).padStart(2,'0')}:${String(minutes % 60).padStart(2,'0')}`
}

export function validateAttendancePeriod({ from, to }: AttendancePeriod): string | null {
  const validDate = (date: string) => /^\d{4}-\d{2}-\d{2}$/.test(date) && Number.isFinite(Date.parse(date))
    && new Date(date).toISOString().slice(0,10) === date
  if (!validDate(from) || !validDate(to)) return 'Selecciona las fechas Desde y Hasta.'
  if (from > to) return 'La fecha Desde debe ser anterior o igual a Hasta.'
  if ((Date.parse(to) - Date.parse(from)) / 86_400_000 >= 366) return 'Consulta periodos de hasta 366 días.'
  return null
}

export function attendanceObservations(day: EmployeeAttendanceDay): string[] {
  const observations = [...day.issues]
  if (day.arrivalDelayMinutes) {
    const tardy = day.incidents.some((incident) => incident.kind === 'arrival')
    observations.push(`Llegada ${day.arrivalDelayMinutes} min después del horario${tardy ? ' (retardo)' : ''}.`)
  }
  if (day.earlyExitMinutes) observations.push(`Salida ${day.earlyExitMinutes} min antes del horario.`)
  for (const incident of day.incidents.filter((item) => item.kind !== 'arrival')) {
    observations.push(`${incident.kind === 'meal_departure' ? 'Salida a comer' : 'Regreso de comida'}: retardo de ${incident.minutes} min.`)
  }
  const repeated = day.punches.filter((punch) => punch.movement === 'duplicate').length
  if (repeated) observations.push(`${repeated} lectura${repeated === 1 ? '' : 's'} repetida${repeated === 1 ? '' : 's'}.`)
  return observations
}
