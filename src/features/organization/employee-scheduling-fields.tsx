import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Checkbox from '@mui/material/Checkbox'
import Chip from '@mui/material/Chip'
import Divider from '@mui/material/Divider'
import FormControlLabel from '@mui/material/FormControlLabel'
import MenuItem from '@mui/material/MenuItem'
import Stack from '@mui/material/Stack'
import Switch from '@mui/material/Switch'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import type { EmployeeScheduleInput, MealSettings } from './employee-scheduling'
import type { WorkSchedule } from './types'
import { branchMealLabel } from './branch-configuration'

const dayLabels = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']
const fieldGrid = { display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' } }

export default function EmployeeSchedulingFields({ value, base, firstAttendanceDate, onChange }: {
  value: EmployeeScheduleInput; base?: WorkSchedule; firstAttendanceDate?: string | null
  onChange: (value: EmployeeScheduleInput) => void
}) {
  const mealMode = value.mealMode === 'inherit' ? 'inherit' : value.mealMode === 'automatic' ? 'automatic'
    : value.meal ? value.meal.enabled ? 'configured' : 'disabled' : 'automatic'
  const hours = value.workHours ?? base?.settings
  const updateMeal = (changes: Partial<MealSettings>) => {
    if (value.meal) onChange({ ...value, meal: { ...value.meal, ...changes } })
  }
  return <>
    <Divider />
    <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
      <Typography variant="h3" component="h3">Horario y comida</Typography>
      <Chip size="small" variant="outlined" label={value.workHours ? 'Horario especial' : 'Jornada de sucursal'} />
    </Stack>
    <TextField required type="date" label="Aplicar desde" value={value.effectiveFrom}
      onChange={(event) => onChange({ ...value, effectiveFrom: event.target.value })}
      slotProps={{ inputLabel: { shrink: true } }} helperText={firstAttendanceDate
        ? `Primera checada: ${firstAttendanceDate}. Puedes recalcular desde esa fecha; las versiones anteriores se conservan.`
        : 'La configuración se guarda con fecha de vigencia y conserva sus versiones anteriores.'} />
    <FormControlLabel label="Usar horario especial de este empleado" control={<Switch checked={Boolean(value.workHours)}
      onChange={(event) => onChange({ ...value, workHours: event.target.checked
        ? { workDays: [...(base?.settings.workDays ?? [1, 2, 3, 4, 5])], entryTime: base?.settings.entryTime ?? '09:00', exitTime: base?.settings.exitTime ?? '18:00' } : null })} />} />
    {!value.workHours && <Typography variant="body2" color="text.secondary">{base
      ? `${base.name}: ${base.settings.entryTime}–${base.settings.exitTime}. Los cambios de la sucursal se heredarán automáticamente.`
      : 'La sucursal todavía no tiene un horario base vigente. Configúralo o activa un horario especial.'}</Typography>}
    {value.workHours && <>
      <Box sx={fieldGrid}>
        <TextField required type="time" label="Entrada individual" value={value.workHours.entryTime} slotProps={{ inputLabel: { shrink: true } }}
          onChange={(event) => onChange({ ...value, workHours: { ...value.workHours!, entryTime: event.target.value } })} />
        <TextField required type="time" label="Salida individual" value={value.workHours.exitTime} slotProps={{ inputLabel: { shrink: true } }}
          onChange={(event) => onChange({ ...value, workHours: { ...value.workHours!, exitTime: event.target.value } })} />
      </Box>
      <Stack direction="row" sx={{ flexWrap: 'wrap' }}>{dayLabels.map((label, index) => <FormControlLabel key={label} label={label}
        control={<Checkbox checked={value.workHours!.workDays.includes(index + 1)} onChange={(event) => {
          const workDays = value.workHours!.workDays
          onChange({ ...value, workHours: { ...value.workHours!, workDays: event.target.checked
            ? [...workDays, index + 1].sort((left, right) => left - right) : workDays.filter((day) => day !== index + 1) } })
        }} />} />)}</Stack>
    </>}
    <Divider />
    <Typography variant="h3" component="h3">Comida</Typography>
    <TextField select label="Configuración de comida" value={mealMode} helperText="La comida es independiente de usar la jornada general o una especial."
      onChange={(event) => onChange({ ...value, mealMode: event.target.value === 'inherit' ? 'inherit' : event.target.value === 'automatic' ? 'automatic' : 'individual',
        meal: event.target.value === 'automatic' || event.target.value === 'inherit' ? null : {
        enabled: event.target.value === 'configured', startTime: value.meal?.startTime || (event.target.value === 'disabled' ? '14:00' : ''),
        endTime: value.meal?.endTime || (event.target.value === 'disabled' ? '14:00' : ''),
        durationMinutes: value.meal?.durationMinutes ?? 60,
      } })}>
      <MenuItem value="inherit">Usar comida de la sucursal</MenuItem><MenuItem value="automatic">Detección automática (sin horario fijo)</MenuItem><MenuItem value="configured">Configurar salida y regreso de comida</MenuItem><MenuItem value="disabled">Sin movimientos de comida</MenuItem>
    </TextField>
    {value.meal?.enabled && <>
      <Box sx={fieldGrid}>
        <TextField required type="time" label="Salida a comer desde" value={value.meal.startTime} slotProps={{ inputLabel: { shrink: true } }}
          onChange={(event) => updateMeal({ startTime: event.target.value,
            ...(!value.meal!.endTime || value.meal!.endTime === value.meal!.startTime ? { endTime: event.target.value } : {}) })} />
        <TextField required type="time" label="Salida a comer hasta" value={value.meal.endTime} slotProps={{ inputLabel: { shrink: true } }}
          onChange={(event) => updateMeal({ endTime: event.target.value })} helperText="Usa la misma hora si tiene una salida fija." />
        <TextField required type="number" label="Duración de comida (minutos)" value={value.meal.durationMinutes}
          onChange={(event) => updateMeal({ durationMinutes: Number(event.target.value) })} slotProps={{ htmlInput: { min: 1, max: 240, step: 1 } }} />
      </Box>
      <Typography variant="body2" color="text.secondary">El regreso esperado se calcula desde la salida real más la duración. Debe permitir volver antes de las {hours?.exitTime ?? 'horas de salida configuradas'}.</Typography>
    </>}
    {mealMode === 'inherit' && <Typography variant="body2" color="text.secondary">Comida de sucursal: {branchMealLabel(base?.settings.branchMeal)}. Los cambios futuros de la sucursal se heredarán.</Typography>}
    {mealMode === 'automatic' && <Alert severity="info">Con cuatro checadas efectivas se identifican entrada, salida a comer, regreso y salida laboral. Se muestra la duración real de comida, sin horario fijo ni retardos de comida.</Alert>}
    <FormControlLabel label="Usar margen de reconocimiento de la sucursal" control={<Switch checked={value.recognitionMarginInherited ?? false}
      onChange={(event) => onChange({ ...value, recognitionMarginInherited: event.target.checked })} />} />
    {value.recognitionMarginInherited ? <Typography variant="body2" color="text.secondary">Margen de sucursal: {base?.settings.recognitionMarginMinutes ?? 30} minutos.</Typography>
      : <TextField required type="number" label="Margen para reconocer movimientos (minutos)" value={value.recognitionMarginMinutes}
      onChange={(event) => onChange({ ...value, recognitionMarginMinutes: Number(event.target.value) })}
      slotProps={{ htmlInput: { min: 0, max: 120, step: 1 } }} helperText="Inicialmente 30 minutos para distinguir comida y movimientos intermedios. La entrada y salida reales pueden quedar fuera de la jornada. Las tolerancias de retardo se calculan por separado." />}
  </>
}
