import Box from '@mui/material/Box'
import Checkbox from '@mui/material/Checkbox'
import FormControlLabel from '@mui/material/FormControlLabel'
import Stack from '@mui/material/Stack'
import Switch from '@mui/material/Switch'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import type { EmployeeScheduleInput } from './employee-scheduling'
import type { WorkSchedule } from './types'

const dayLabels = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']

export default function EmployeeWorkHoursFields({ value, base, onChange }: {
  value: EmployeeScheduleInput; base?: WorkSchedule; onChange: (value: EmployeeScheduleInput) => void
}) {
  return <>
    <FormControlLabel label="Usar horario especial de este empleado" control={<Switch checked={Boolean(value.workHours)}
      onChange={(_, checked) => onChange({ ...value, workHours: checked
        ? { workDays: [...(base?.settings.workDays ?? [1,2,3,4,5])], entryTime: base?.settings.entryTime ?? '09:00', exitTime: base?.settings.exitTime ?? '18:00' } : null })} />} />
    {!value.workHours && <Typography variant="body2" color="text.secondary">{base
      ? `${base.name}: ${base.settings.entryTime}–${base.settings.exitTime}. Los cambios de la sucursal se heredarán automáticamente.`
      : 'La sucursal todavía no tiene un horario base vigente. Configúralo o activa un horario especial.'}</Typography>}
    {value.workHours && <>
      <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' } }}>
        <TextField required type="time" label="Entrada individual" value={value.workHours.entryTime} slotProps={{ inputLabel: { shrink: true } }}
          onChange={(event) => onChange({ ...value, workHours: { ...value.workHours!, entryTime: event.target.value } })} />
        <TextField required type="time" label="Salida individual" value={value.workHours.exitTime} slotProps={{ inputLabel: { shrink: true } }}
          onChange={(event) => onChange({ ...value, workHours: { ...value.workHours!, exitTime: event.target.value } })} />
      </Box>
      <Stack direction="row" sx={{ flexWrap: 'wrap' }}>{dayLabels.map((label, index) => <FormControlLabel key={label} label={label}
        control={<Checkbox checked={value.workHours!.workDays.includes(index + 1)} onChange={(_, checked) => {
          const workDays = value.workHours!.workDays
          onChange({ ...value, workHours: { ...value.workHours!, workDays: checked
            ? [...workDays, index + 1].sort((left, right) => left - right) : workDays.filter((day) => day !== index + 1) } })
        }} />} />)}</Stack>
    </>}
    <Typography variant="h3" component="h3">Reconocimiento de movimientos</Typography>
    <FormControlLabel label="Usar margen de reconocimiento de la sucursal" control={<Switch checked={value.recognitionMarginInherited ?? false}
      onChange={(_, checked) => onChange({ ...value, recognitionMarginInherited: checked })} />} />
    {value.recognitionMarginInherited ? <Typography variant="body2" color="text.secondary">Margen de sucursal: {base?.settings.recognitionMarginMinutes ?? 30} minutos.</Typography>
      : <TextField required type="number" label="Margen para reconocer movimientos (minutos)" value={value.recognitionMarginMinutes}
        onChange={(event) => onChange({ ...value, recognitionMarginMinutes: Number(event.target.value) })} slotProps={{ htmlInput: { min: 0, max: 120, step: 1 } }}
        helperText="Permite distinguir comida y movimientos intermedios. Las tolerancias de retardo se calculan por separado." />}
  </>
}
