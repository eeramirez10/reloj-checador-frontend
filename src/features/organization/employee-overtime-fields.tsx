import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Checkbox from '@mui/material/Checkbox'
import FormControlLabel from '@mui/material/FormControlLabel'
import MenuItem from '@mui/material/MenuItem'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import { defaultOvertimeSettings, type OvertimeSettings } from '../attendance/types/overtime'

const grid = { display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' } }

export default function EmployeeOvertimeFields({ value = defaultOvertimeSettings, onChange }: {
  value?: OvertimeSettings; onChange: (value: OvertimeSettings) => void
}) {
  const update = (changes: Partial<OvertimeSettings>) => onChange({ ...value, ...changes })
  const rest = value.dailyRest
  return <>
    <FormControlLabel label="Habilitar horas extras" control={<Checkbox checked={value.enabled}
      onChange={(event) => update({ enabled: event.target.checked })} />} />
    {value.enabled && <>
      <Alert severity="info">Las horas extras y los retardos usan la jornada de la sucursal vigente en cada fecha. El horario especial del empleado se conserva. Se aplica desde la fecha «Aplicar desde», compartida con Jornada y Comida.</Alert>
      <TextField select label="Tipo de jornada" value={value.workMode} onChange={(event) => update({ workMode: event.target.value as OvertimeSettings['workMode'] })}>
        <MenuItem value="daily">Diaria</MenuItem><MenuItem value="route">En ruta</MenuItem>
      </TextField>
      {value.workMode === 'route' && <Alert severity="info">La primera checada abre la ruta y la siguiente efectiva registra el regreso, aunque transcurran varios días. Las lecturas iniciales repetidas se ignoran según la regla de sucursal. No se requieren movimientos de comida; el intervalo incluye las noches hasta el regreso.</Alert>}
      <FormControlLabel label="Descontar descansos" control={<Checkbox checked={value.restEnabled}
        onChange={(event) => update({ restEnabled: event.target.checked })} />} />
      {value.restEnabled && <>
        <FormControlLabel label="Descanso diario por horario" control={<Checkbox checked={Boolean(rest)}
          onChange={(event) => update({ dailyRest: event.target.checked ? { startTime: '22:00', endTime: '06:00' } : null })} />} />
        {rest && <Box sx={grid}>
          <TextField required type="time" label="Descanso desde" value={rest.startTime} slotProps={{ inputLabel: { shrink: true } }}
            onChange={(event) => update({ dailyRest: { ...rest, startTime: event.target.value } })} />
          <TextField required type="time" label="Descanso hasta" value={rest.endTime} error={rest.startTime === rest.endTime}
            helperText={rest.startTime === rest.endTime ? 'El inicio y fin deben ser distintos.' : 'Puede cruzar medianoche, por ejemplo 22:00–06:00.'}
            slotProps={{ inputLabel: { shrink: true } }} onChange={(event) => update({ dailyRest: { ...rest, endTime: event.target.value } })} />
        </Box>}
        <Typography variant="body2">Descanso adicional, una vez por {value.workMode === 'route' ? 'ruta' : 'jornada'}</Typography>
        <Box sx={grid}>
          <TextField required type="number" label="Horas adicionales de descanso" value={Math.floor(value.additionalRestMinutes / 60)}
            slotProps={{ htmlInput: { min: 0, max: 16666, step: 1 } }} onChange={(event) => update({ additionalRestMinutes: Number(event.target.value) * 60 + value.additionalRestMinutes % 60 })} />
          <TextField required type="number" label="Minutos adicionales de descanso" value={value.additionalRestMinutes % 60}
            slotProps={{ htmlInput: { min: 0, max: 59, step: 1 } }} onChange={(event) => update({ additionalRestMinutes: Math.floor(value.additionalRestMinutes / 60) * 60 + Number(event.target.value) })} />
        </Box>
        {!rest && !value.additionalRestMinutes && <Alert severity="warning">Configura el horario de descanso, una cantidad adicional o ambos.</Alert>}
        <Typography variant="body2" color="text.secondary">Ambos descansos se suman sin descontar dos veces la comida ni el mismo intervalo. Solo reducen las extras coincidentes, hasta un mínimo de cero. En ruta, el descanso adicional se reparte entre los días con extras y no se repite por fecha.</Typography>
      </>}
    </>}
  </>
}
