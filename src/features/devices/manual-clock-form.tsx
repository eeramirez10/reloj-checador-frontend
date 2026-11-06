import EditCalendarRoundedIcon from '@mui/icons-material/EditCalendarRounded'
import Button from '@mui/material/Button'
import CircularProgress from '@mui/material/CircularProgress'
import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import { useState, type FormEvent } from 'react'

export default function ManualClockForm({ initialLocalTime, timeZone, disabled, saving, onSubmit }: {
  initialLocalTime: string
  timeZone: string
  disabled: boolean
  saving: boolean
  onSubmit: (localTime: string) => void
}) {
  const [date, setDate] = useState(() => initialLocalTime.slice(0, 10))
  const [time, setTime] = useState(() => initialLocalTime.slice(11))

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (disabled || !date || !time) return
    onSubmit(`${date} ${time.length === 5 ? `${time}:00` : time}`)
  }

  return <Paper component="form" onSubmit={submit} variant="outlined" sx={{ p: 2 }}>
    <Stack spacing={1.75}>
      <Typography component="h3" variant="h6">Ajustar manualmente</Typography>
      <Typography color="text.secondary" variant="body2">Captura la fecha y hora local que quieres establecer en el reloj. Zona horaria: {timeZone}.</Typography>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
        <TextField required fullWidth label="Fecha manual" type="date" value={date} disabled={disabled}
          onChange={(event) => setDate(event.target.value)} slotProps={{ inputLabel: { shrink: true }, htmlInput: { min: '2000-01-01', max: '2099-12-31' } }} />
        <TextField required fullWidth label="Hora manual" type="time" value={time} disabled={disabled}
          onChange={(event) => setTime(event.target.value)} slotProps={{ inputLabel: { shrink: true }, htmlInput: { step: 1 } }} />
      </Stack>
      <Typography color="text.secondary" variant="caption">Se enviará el valor capturado al momento del ajuste y se comprobará con una nueva lectura.</Typography>
      <Button type="submit" variant="outlined" disabled={disabled || !date || !time} sx={{ alignSelf: { sm: 'flex-start' } }}
        startIcon={saving ? <CircularProgress color="inherit" size={18} /> : <EditCalendarRoundedIcon />}>
        {saving ? 'Aplicando y verificando…' : 'Aplicar fecha y hora manual'}
      </Button>
    </Stack>
  </Paper>
}
