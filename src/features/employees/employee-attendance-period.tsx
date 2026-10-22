import Alert from '@mui/material/Alert'
import Button from '@mui/material/Button'
import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import { useState } from 'react'
import type { AttendancePeriod } from './types/employee-attendance'
import { validateAttendancePeriod } from './employee-attendance-format'

export default function EmployeeAttendancePeriod({ period, busy, onSubmit }: {
  period: AttendancePeriod; busy: boolean; onSubmit: (period: AttendancePeriod) => void
}) {
  const [draft, setDraft] = useState(period)
  const [error, setError] = useState<string | null>(null)
  return <Paper component="form" variant="outlined" sx={{ p: 2 }} onSubmit={(event) => {
    event.preventDefault()
    const message = validateAttendancePeriod(draft)
    setError(message)
    if (!message) onSubmit(draft)
  }}>
    <Stack spacing={2}>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ alignItems: { sm: 'flex-start' } }}>
        <TextField required type="date" size="small" label="Desde" value={draft.from} onChange={(event) => setDraft((current) => ({ ...current, from: event.target.value }))} slotProps={{ inputLabel: { shrink: true } }} sx={{ minWidth: { sm: 180 } }} />
        <TextField required type="date" size="small" label="Hasta" value={draft.to} onChange={(event) => setDraft((current) => ({ ...current, to: event.target.value }))} slotProps={{ inputLabel: { shrink: true } }} sx={{ minWidth: { sm: 180 } }} />
        <Button type="submit" variant="contained" disabled={busy}>{busy ? 'Consultando…' : 'Consultar'}</Button>
      </Stack>
      {error && <Alert severity="error">{error}</Alert>}
    </Stack>
  </Paper>
}
