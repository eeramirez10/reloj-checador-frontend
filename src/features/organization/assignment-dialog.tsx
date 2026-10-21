import Alert from '@mui/material/Alert'
import MenuItem from '@mui/material/MenuItem'
import TextField from '@mui/material/TextField'
import { useState } from 'react'
import { saveAssignments, getToday, useBranches, useOrganizationMutation, useSchedules } from './api'
import EditorDialog from './editor-dialog'
import type { AssignmentTargets } from './types'

export default function AssignmentDialog({ targets, title, onClose }: { targets: AssignmentTargets; title: string; onClose: () => void }) {
  const branches = useBranches()
  const schedules = useSchedules()
  const [branchId, setBranchId] = useState('')
  const [scheduleId, setScheduleId] = useState('')
  const [effectiveFrom, setEffectiveFrom] = useState(getToday)
  const devicesOnly = Boolean(targets.deviceIds?.length)
  const mutation = useOrganizationMutation<void>(async () => {
    if (!branchId && !scheduleId) throw new Error('Selecciona una sucursal o un horario para asignar.')
    await saveAssignments({ ...targets, branchId: branchId || undefined,
      scheduleId: scheduleId === 'inherit' ? null : scheduleId || undefined, effectiveFrom })
  })
  return (
    <EditorDialog title={title} onClose={onClose} onSave={() => mutation.mutateAsync()} saveLabel="Guardar asignación">
      <TextField select label="Sucursal" value={branchId} onChange={(event) => { setBranchId(event.target.value); setScheduleId('') }}>
        <MenuItem value="">Conservar sucursal actual</MenuItem>
        {(branches.data ?? []).filter((branch) => branch.active).map((branch) => <MenuItem key={branch.id} value={branch.id}>{branch.name}</MenuItem>)}
      </TextField>
      {!devicesOnly && <TextField select label="Horario individual" value={scheduleId} onChange={(event) => setScheduleId(event.target.value)} helperText="Crea los roles en Horarios y reglas. La asignación individual tiene prioridad sobre el horario base.">
        <MenuItem value="">Conservar horario actual</MenuItem>
        <MenuItem value="inherit">Usar horario base de la sucursal</MenuItem>
        {(schedules.data ?? []).filter((schedule) => (!branchId || schedule.branchId === branchId)
          && (!schedule.supersededFrom || effectiveFrom < schedule.supersededFrom)).map((schedule) => <MenuItem key={schedule.id} value={schedule.id}>{schedule.name} · desde {schedule.effectiveFrom}</MenuItem>)}
      </TextField>}
      <TextField required type="date" label="Aplicar desde" value={effectiveFrom} onChange={(event) => setEffectiveFrom(event.target.value)} slotProps={{ inputLabel: { shrink: true } }} />
      <Alert severity="info">Las asignaciones anteriores a esta fecha se conservan. El reloj actual debe pertenecer a la sucursal del empleado.</Alert>
    </EditorDialog>
  )
}
