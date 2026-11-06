import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import MenuItem from '@mui/material/MenuItem'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import type { EmployeeScheduleInput, MealSettings } from './employee-scheduling'
import type { WorkSchedule } from './types'
import { branchMealLabel } from './branch-configuration'

export default function EmployeeMealFields({ value, base, onChange }: {
  value: EmployeeScheduleInput; base?: WorkSchedule; onChange: (value: EmployeeScheduleInput) => void
}) {
  const mode = value.mealMode === 'inherit' ? 'inherit' : value.mealMode === 'automatic' ? 'automatic'
    : value.meal ? value.meal.enabled ? 'configured' : 'disabled' : 'automatic'
  const hours = value.workHours ?? base?.settings
  const route = value.overtime?.enabled && value.overtime.workMode === 'route'
  const update = (changes: Partial<MealSettings>) => { if (value.meal) onChange({ ...value, meal: { ...value.meal, ...changes } }) }
  return <>
    <TextField select disabled={route} label="Configuración de comida" value={mode} helperText={route
      ? 'En ruta no se requieren movimientos de comida. Esta configuración se conserva para las jornadas diarias.'
      : 'La comida es independiente de usar la jornada general o una especial.'}
      onChange={(event) => onChange({ ...value, mealMode: event.target.value === 'inherit' ? 'inherit' : event.target.value === 'automatic' ? 'automatic' : 'individual',
        meal: event.target.value === 'automatic' || event.target.value === 'inherit' ? null : {
          enabled: event.target.value === 'configured', startTime: value.meal?.startTime || (event.target.value === 'disabled' ? '14:00' : ''),
          endTime: value.meal?.endTime || (event.target.value === 'disabled' ? '14:00' : ''), durationMinutes: value.meal?.durationMinutes ?? 60,
        } })}>
      <MenuItem value="inherit">Usar comida de la sucursal</MenuItem><MenuItem value="automatic">Detección automática (sin horario fijo)</MenuItem>
      <MenuItem value="configured">Configurar salida y regreso de comida</MenuItem><MenuItem value="disabled">Sin movimientos de comida</MenuItem>
    </TextField>
    {value.meal?.enabled && !route && <>
      <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' } }}>
        <TextField required type="time" label="Salida a comer desde" value={value.meal.startTime} slotProps={{ inputLabel: { shrink: true } }}
          onChange={(event) => update({ startTime: event.target.value, ...(!value.meal!.endTime || value.meal!.endTime === value.meal!.startTime ? { endTime: event.target.value } : {}) })} />
        <TextField required type="time" label="Salida a comer hasta" value={value.meal.endTime} slotProps={{ inputLabel: { shrink: true } }}
          onChange={(event) => update({ endTime: event.target.value })} helperText="Usa la misma hora si tiene una salida fija." />
        <TextField required type="number" label="Duración de comida (minutos)" value={value.meal.durationMinutes}
          onChange={(event) => update({ durationMinutes: Number(event.target.value) })} slotProps={{ htmlInput: { min: 1, max: 240, step: 1 } }} />
      </Box>
      <Typography variant="body2" color="text.secondary">El regreso esperado se calcula desde la salida real más la duración. Debe permitir volver antes de las {hours?.exitTime ?? 'horas de salida configuradas'}.</Typography>
    </>}
    {mode === 'inherit' && <Typography variant="body2" color="text.secondary">Comida de sucursal: {branchMealLabel(base?.settings.branchMeal)}. Los cambios futuros de la sucursal se heredarán.</Typography>}
    {mode === 'automatic' && !route && <Alert severity="info">Con cuatro checadas efectivas se identifican entrada, salida a comer, regreso y salida laboral. Se muestra la duración real de comida, sin horario fijo ni retardos de comida.</Alert>}
  </>
}
