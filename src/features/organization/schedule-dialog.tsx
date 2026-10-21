import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Checkbox from '@mui/material/Checkbox'
import FormControlLabel from '@mui/material/FormControlLabel'
import MenuItem from '@mui/material/MenuItem'
import Stack from '@mui/material/Stack'
import Switch from '@mui/material/Switch'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import { useState } from 'react'
import { getToday, saveSchedule, useBranches, useOrganizationMutation } from './api'
import EditorDialog from './editor-dialog'
import type { ScheduleSettings, WorkSchedule } from './types'

const dayLabels = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo']

export default function ScheduleDialog({ schedule, onClose }: { schedule?: WorkSchedule; onClose: () => void }) {
  const branches = useBranches()
  const [branchId, setBranchId] = useState(schedule?.branchId ?? '')
  const [name, setName] = useState(schedule?.name ?? '')
  const [effectiveFrom, setEffectiveFrom] = useState(getToday)
  const [isDefault, setIsDefault] = useState(schedule?.isDefault ?? false)
  const [settings, setSettings] = useState<ScheduleSettings>(schedule?.settings ?? {
    workDays: [1, 2, 3, 4, 5], entryTime: '08:30', exitTime: '18:00', mealEnabled: true, mealStart: '14:00', mealEnd: '15:00', mealDurationMinutes: 60,
  })
  const mutation = useOrganizationMutation(saveSchedule)
  function update<Key extends keyof ScheduleSettings>(key: Key, value: ScheduleSettings[Key]) { setSettings((current) => ({ ...current, [key]: value })) }
  return (
    <EditorDialog title={schedule ? 'Crear versión de horario' : 'Crear horario'} onClose={onClose} onSave={() => mutation.mutateAsync({ branchId, name, effectiveFrom, isDefault, settings })}>
      <TextField required label="Nombre del horario" value={name} onChange={(event) => setName(event.target.value)} placeholder="Por ejemplo: Administración · comida 14:00–15:00" />
      <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' } }}>
        <TextField required select label="Sucursal" value={branchId} onChange={(event) => setBranchId(event.target.value)}>
          {(branches.data ?? []).filter((branch) => branch.active || branch.id === branchId).map((branch) => <MenuItem key={branch.id} value={branch.id}>{branch.name}</MenuItem>)}
        </TextField>
        <TextField required type="date" label="Vigente desde" value={effectiveFrom} onChange={(event) => setEffectiveFrom(event.target.value)} slotProps={{ inputLabel: { shrink: true } }} />
      </Box>
      <FormControlLabel control={<Switch checked={isDefault} onChange={(event) => setIsDefault(event.target.checked)} />} label="Horario base de la sucursal para personas sin horario individual" />
      <Typography component="h3" variant="h3">Jornada</Typography>
      <Stack direction="row" sx={{ flexWrap: 'wrap' }}>
        {dayLabels.map((label, index) => <FormControlLabel key={label} label={label} control={<Checkbox checked={settings.workDays.includes(index + 1)} onChange={(event) => update('workDays', event.target.checked ? [...settings.workDays, index + 1].sort() : settings.workDays.filter((day) => day !== index + 1))} />} />)}
      </Stack>
      <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' } }}>
        <TextField required type="time" label="Entrada" value={settings.entryTime} onChange={(event) => update('entryTime', event.target.value)} slotProps={{ inputLabel: { shrink: true } }} />
        <TextField required type="time" label="Salida" value={settings.exitTime} onChange={(event) => update('exitTime', event.target.value)} slotProps={{ inputLabel: { shrink: true } }} />
      </Box>
      <FormControlLabel control={<Switch checked={settings.mealEnabled} onChange={(event) => update('mealEnabled', event.target.checked)} />} label="Identificar salida y regreso de comida" />
      {settings.mealEnabled && <>
        <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr 1fr' } }}>
          <TextField required type="time" label="Puede salir desde" value={settings.mealStart} onChange={(event) => update('mealStart', event.target.value)} slotProps={{ inputLabel: { shrink: true } }} />
          <TextField required type="time" label="Puede salir hasta" value={settings.mealEnd} onChange={(event) => update('mealEnd', event.target.value)} slotProps={{ inputLabel: { shrink: true } }} />
          <TextField required type="number" label="Duración (minutos)" value={settings.mealDurationMinutes} onChange={(event) => update('mealDurationMinutes', Number(event.target.value))} slotProps={{ htmlInput: { min: 1, max: 240 } }} />
        </Box>
        <Alert severity="info">El regreso esperado se calcula desde la salida real. Salir a las 14:30 con 60 minutos de comida permite regresar a las 15:30, más la tolerancia de la sucursal.</Alert>
      </>}
      {schedule && <Typography color="text.secondary" variant="body2">Se creará una versión nueva. Asígnala a las personas que deban usarla; las asignaciones de la versión anterior se conservan.</Typography>}
    </EditorDialog>
  )
}
