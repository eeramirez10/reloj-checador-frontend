import Box from '@mui/material/Box'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import type { PolicySettings } from './types'

type MarginKey = 'overtimeEntryMarginMinutes' | 'overtimeExitMarginMinutes'

export default function OvertimeMarginFields({ value, onChange }: { value: PolicySettings; onChange: (key: MarginKey, minutes: number) => void }) {
  return <>
    <Typography component="h3" variant="h3">Márgenes de horas extras</Typography>
    <Typography variant="body2" color="text.secondary">Se descuentan del tiempo anterior a la entrada y posterior a la salida de la jornada de sucursal. Aplican a todos los empleados con extras habilitadas, desde la vigencia indicada.</Typography>
    <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' } }}>
      <TextField required type="number" label="Margen de extras de entrada (min)" value={value.overtimeEntryMarginMinutes ?? 0}
        onChange={(event) => onChange('overtimeEntryMarginMinutes', Number(event.target.value))}
        slotProps={{ htmlInput: { min: 0, max: 240, step: 1 } }} helperText="Con 0 se reconoce todo el tiempo anticipado." />
      <TextField required type="number" label="Margen de extras de salida (min)" value={value.overtimeExitMarginMinutes ?? 0}
        onChange={(event) => onChange('overtimeExitMarginMinutes', Number(event.target.value))}
        slotProps={{ htmlInput: { min: 0, max: 240, step: 1 } }} helperText="Con 0 se reconoce todo el tiempo posterior." />
    </Box>
    <Typography variant="caption" color="text.secondary">Ejemplo: jornada 08:30–17:30 y márgenes de 30 min. Entrada 08:00 o salida 18:00: 0 extras de ese lado. Entrada 07:00: 1 hora extra; salida 18:30: 30 min extra. Son independientes de las tolerancias de retardo y no se aplican en días de descanso.</Typography>
  </>
}
