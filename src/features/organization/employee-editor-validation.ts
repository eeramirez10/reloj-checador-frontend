import { isAxiosError } from 'axios'
import { getApiErrorMessage } from '../../shared/api/api-error'
import type { EmployeeScheduleInput } from './employee-scheduling'
import type { WorkSchedule } from './types'

export const employeeEditorTabs = [
  { value: 'general', label: 'Datos generales' },
  { value: 'contact', label: 'Contacto' },
  { value: 'access', label: 'Acceso al sistema' },
  { value: 'schedule', label: 'Jornada' },
  { value: 'meal', label: 'Comida' },
  { value: 'overtime', label: 'Horas extras' },
  { value: 'leave', label: 'Permisos y vacaciones' },
  { value: 'clock', label: 'Reloj' },
] as const
export type EmployeeEditorTab = typeof employeeEditorTabs[number]['value']
export interface EmployeeEditorIssue { tab: EmployeeEditorTab; message: string }

export function employeeScheduleIssue(value: EmployeeScheduleInput, base?: WorkSchedule): EmployeeEditorIssue | undefined {
  if (value.workHours && (!value.workHours.workDays.length || value.workHours.entryTime >= value.workHours.exitTime)) {
    return { tab: 'schedule', message: 'Selecciona días laborables y una salida posterior a la entrada.' }
  }
  const route = value.overtime?.enabled && value.overtime.workMode === 'route'
  const hours = value.workHours ?? base?.settings
  if (value.meal?.enabled && !route) {
    const meal = value.meal
    const minutes = (time: string) => Number(time.slice(0,2)) * 60 + Number(time.slice(3))
    if (!hours || meal.startTime <= hours.entryTime || meal.endTime < meal.startTime
      || minutes(meal.endTime) + meal.durationMinutes > minutes(hours.exitTime)) {
      return { tab: 'meal', message: 'La comida debe estar dentro de la jornada y permitir regresar antes de finalizarla.' }
    }
  }
  const overtime = value.overtime
  if (overtime?.enabled && overtime.restEnabled && (!overtime.dailyRest && !overtime.additionalRestMinutes
    || overtime.dailyRest?.startTime === overtime.dailyRest?.endTime && Boolean(overtime.dailyRest))) {
    return { tab: 'overtime', message: 'Configura un descanso válido: el inicio y fin deben ser distintos, o indica un descanso adicional.' }
  }
}

export function employeeEditorErrorTab(error: unknown): EmployeeEditorTab | undefined {
  if (isAxiosError<{ issues?: Array<{ path: Array<string | number> }> }>(error)) {
    const path = error.response?.data.issues?.[0]?.path ?? []
    if (path[0] === 'leaveProfile') return 'leave'
    if (path[0] === 'contact') return 'contact'
    if (path.includes('meal') || path.includes('mealMode')) return 'meal'
    if (path.includes('overtime')) return 'overtime'
    if (path[0] === 'scheduling') return 'schedule'
    if (path.length) return 'general'
  }
  const message = getApiErrorMessage(error).toLocaleLowerCase('es-MX')
  if (/saldo|vacaciones|jefe|jerarquía|whatsapp/.test(message)) return 'leave'
  if (/comida/.test(message)) return 'meal'
  if (/descanso|extras/.test(message)) return 'overtime'
  if (/horario|jornada/.test(message)) return 'schedule'
}
