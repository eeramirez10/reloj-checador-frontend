import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import FormControlLabel from '@mui/material/FormControlLabel'
import MenuItem from '@mui/material/MenuItem'
import Stack from '@mui/material/Stack'
import Switch from '@mui/material/Switch'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import { useState } from 'react'
import type { Employee } from '../employees/types/employee'
import { getToday, useOrganizationMutation } from '../organization/api'
import { formatCardDate } from '../employees/employee-attendance-format'
import { getApiErrorMessage } from '../../shared/api/api-error'
import { createLeave, previewLeave, useLeaveProfile } from './api'
import EmployeeSelect from './employee-select'
import { EmployeeDialog } from '../organization/person-dialog'
import { leaveKindLabels } from './leave-format'
import type { LeaveInput, LeaveKind, LeavePreview } from './types'

export default function LeaveRequestDialog({ employees, onClose, onCreated }: { employees: Employee[]; onClose: () => void; onCreated: (id: string) => void }) {
  const [value, setValue] = useState<LeaveInput>(() => ({ employeeId: '', kind: 'absence', from: getToday(), to: getToday(), authorizedTime: null, paid: true, useVacation: false, reason: '' }))
  const [sourceKey] = useState(() => crypto.randomUUID())
  const [preview, setPreview] = useState<LeavePreview | null>(null)
  const [reviewing, setReviewing] = useState(false)
  const [error, setError] = useState('')
  const [configuring, setConfiguring] = useState(false)
  const employee = employees.find((item) => item.id === value.employeeId)
  const profile = useLeaveProfile(value.employeeId || undefined)
  const mutation = useOrganizationMutation(async () => {
    if (!preview) throw new Error('Revisa la solicitud antes de enviarla.')
    return createLeave(value, preview.token, sourceKey)
  })
  const busy = reviewing || mutation.isPending
  const active = employees.filter((item) => item.isActive && item.identificationStatus === 'confirmed')
  function update(changes: Partial<LeaveInput>) { setValue((current) => ({ ...current, ...changes })); setPreview(null); setError('') }
  async function submit() {
    setError('')
    try {
      if (!preview) { setReviewing(true); setPreview(await previewLeave(value)) }
      else {
        const result = await mutation.mutateAsync(undefined)
        onCreated(result.id)
      }
    } catch (cause) { setError(getApiErrorMessage(cause)); setPreview(null) }
    finally { setReviewing(false) }
  }
  return <>
    <Dialog fullWidth maxWidth="md" open onClose={busy ? undefined : onClose}>
      <Box component="form" onSubmit={(event) => { event.preventDefault(); void submit() }} sx={{ display: 'flex', flexDirection: 'column', minHeight: 0, overflow: 'hidden' }}>
        <DialogTitle>Nueva solicitud de permiso</DialogTitle>
        <DialogContent dividers><Stack spacing={2.5}>
          {error && <Alert severity="error">{error}</Alert>}
          <EmployeeSelect employees={active} required value={value.employeeId} onChange={(employeeId) => update({ employeeId })} disabled={busy} />
          {employee && <Box sx={{ p: 2, bgcolor: 'background.default', borderLeft: 3, borderColor: 'primary.main' }}><Stack spacing={0.75}>
            <Typography variant="body2">{employee.branchName || 'Sin sucursal'}</Typography>
            {profile.isError ? <Alert severity="error">{getApiErrorMessage(profile.error)} <Button onClick={() => void profile.refetch()}>Reintentar</Button></Alert>
              : <Typography variant="body2">Jefe directo: <strong>{profile.isPending ? 'Consultando…' : profile.data?.managerName || 'Sin asignar'}</strong></Typography>}
            <Typography variant="body2">Vacaciones disponibles: <strong>{profile.data?.vacationBalance ?? '—'} días</strong></Typography>
            <Button size="small" disabled={busy} sx={{ alignSelf: 'flex-start' }} onClick={() => setConfiguring(true)}>Configurar jefe y vacaciones</Button>
          </Stack></Box>}
          <TextField required select label="Tipo de permiso" value={value.kind} disabled={busy} onChange={(event) => {
            const kind = event.target.value as LeaveKind
            update({ kind, authorizedTime: kind === 'absence' ? null : '', useVacation: false })
          }}>{Object.entries(leaveKindLabels).map(([key, label]) => <MenuItem key={key} value={key}>{label}</MenuItem>)}</TextField>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
            <TextField required type="date" label="Desde" value={value.from} disabled={busy} onChange={(event) => update({ from: event.target.value })} slotProps={{ inputLabel: { shrink: true } }} />
            <TextField required type="date" label="Hasta" value={value.to} disabled={busy} onChange={(event) => update({ to: event.target.value })} slotProps={{ inputLabel: { shrink: true }, htmlInput: { min: value.from } }} />
          </Box>
          {value.kind !== 'absence' && <TextField required type="time" label={value.kind === 'late_arrival' ? 'Hora autorizada de entrada' : 'Hora autorizada de salida'}
            value={value.authorizedTime ?? ''} disabled={busy} onChange={(event) => update({ authorizedTime: event.target.value })}
            slotProps={{ inputLabel: { shrink: true }, htmlInput: { step: 60 } }} helperText="Se aplica a cada día laborable del rango, en la hora local de su sucursal." />}
          <Stack spacing={1}>
            {value.kind === 'absence' && <FormControlLabel label="Tomar días de vacaciones" control={<Switch checked={value.useVacation} disabled={busy}
              onChange={(_, checked) => update({ useVacation: checked, ...(checked ? { paid: true } : {}) })} />} />}
            <TextField select label="Goce de sueldo" value={value.paid ? 'paid' : 'unpaid'} disabled={busy || value.useVacation}
              helperText={value.useVacation ? 'Los permisos a cuenta de vacaciones siempre son con goce de sueldo.' : undefined}
              onChange={(event) => update({ paid: event.target.value === 'paid' })}><MenuItem value="paid">Con goce de sueldo</MenuItem><MenuItem value="unpaid">Sin goce de sueldo</MenuItem></TextField>
          </Stack>
          <TextField required multiline minRows={3} label="Motivo / comentarios" value={value.reason} disabled={busy} onChange={(event) => update({ reason: event.target.value })} slotProps={{ htmlInput: { maxLength: 2000 } }} />
          {preview && <Box aria-label="Revisión de la solicitud" sx={{ pt: 2, borderTop: 1, borderColor: 'divider' }}><Stack spacing={1.5}>
            <Typography variant="h3">Revisa tu solicitud</Typography>
            <Typography variant="body2">Jefe responsable: <strong>{preview.details.managerName}</strong>. Se registrará como pendiente de aprobación.</Typography>
            <Typography variant="body2"><strong>{preview.details.days.length} días laborables</strong>, del {formatCardDate(value.from)} al {formatCardDate(value.to)}. Los descansos no se incluyen.</Typography>
            <Stack direction="row" spacing={0.75} useFlexGap sx={{ flexWrap: 'wrap', maxHeight: 150, overflowY: 'auto' }}>{preview.details.days.map((day) => <Chip key={day.date} size="small" variant="outlined" label={formatCardDate(day.date)} />)}</Stack>
            {value.useVacation && <Alert severity={preview.vacationDays > preview.vacationBalance ? 'error' : 'info'}>
              Saldo actual: {preview.vacationBalance} días. Se descontarán {preview.vacationDays} días al aprobar. Saldo resultante: {preview.vacationBalance - preview.vacationDays} días.
            </Alert>}
          </Stack></Box>}
        </Stack></DialogContent>
        <DialogActions sx={{ p: 2, flexWrap: 'wrap', gap: 1 }}>
          <Button disabled={busy} onClick={onClose}>Cancelar</Button>
          {preview && <Button disabled={busy} onClick={() => setPreview(null)}>Volver a revisar</Button>}
          <Button type="submit" variant="contained" disabled={busy || Boolean(preview && preview.vacationDays > preview.vacationBalance)}>
            {busy ? 'Procesando…' : preview ? 'Solicitar permiso' : 'Revisar solicitud'}
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
    {configuring && employee && <EmployeeDialog employee={employee} initialTab="leave" onClose={() => { setConfiguring(false); setPreview(null) }} />}
  </>
}
