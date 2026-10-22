import { useQueryClient } from '@tanstack/react-query'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Checkbox from '@mui/material/Checkbox'
import Divider from '@mui/material/Divider'
import FormControlLabel from '@mui/material/FormControlLabel'
import MenuItem from '@mui/material/MenuItem'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import { useState } from 'react'
import { useOrganizationMutation } from './api'
import { initialBranchConfiguration, saveBranchConfiguration, type BranchConfigurationView } from './branch-configuration'
import EditorDialog from './editor-dialog'
import ToleranceField from './tolerance-field'
import type { PolicySettings } from './types'

const days = ['Lunes','Martes','Miércoles','Jueves','Viernes','Sábado','Domingo']
const fieldGrid = { display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' } }

export default function BranchConfigurationDialog({ view, onClose }: { view: BranchConfigurationView; onClose: () => void }) {
  const [value, setValue] = useState(() => initialBranchConfiguration(view))
  const mutation = useOrganizationMutation(saveBranchConfiguration)
  const client = useQueryClient()
  function policy<Key extends keyof PolicySettings>(key: Key, next: PolicySettings[Key]) {
    setValue((current) => ({ ...current, policy: { ...current.policy, [key]: next } }))
  }
  return <EditorDialog title={`Configurar sucursal · ${view.branch.name}`} onClose={onClose} saveLabel="Guardar configuración" onSave={async () => {
    try { await mutation.mutateAsync({ branchId: view.branch.id, settings: value }) }
    catch (error) { await client.invalidateQueries({ queryKey: ['branch-configurations'] }); throw error }
  }}>
    <TextField required type="date" label="Aplicar desde" value={value.effectiveFrom} onChange={(event) => setValue({ ...value, effectiveFrom: event.target.value })}
      slotProps={{ inputLabel: { shrink: true } }} helperText="La jornada, comida y reglas se guardan juntas con esta vigencia. Las versiones anteriores se conservan." />
    {view.firstAttendanceDate && <Button size="small" sx={{ alignSelf: 'flex-start' }} onClick={() => setValue({ ...value, effectiveFrom: view.firstAttendanceDate! })}>Aplicar desde la primera checada ({view.firstAttendanceDate})</Button>}
    <Typography component="h3" variant="h3">Jornada laboral</Typography>
    <Stack direction="row" sx={{ flexWrap: 'wrap' }}>{days.map((label,index) => <FormControlLabel key={label} label={label} control={<Checkbox
      checked={value.workHours.workDays.includes(index + 1)} onChange={(event) => setValue({ ...value, workHours: { ...value.workHours,
        workDays: event.target.checked ? [...value.workHours.workDays, index + 1].sort((left,right) => left - right) : value.workHours.workDays.filter((day) => day !== index + 1) } })} />} />)}</Stack>
    <Box sx={fieldGrid}>
      <TextField required type="time" label="Entrada" value={value.workHours.entryTime} slotProps={{ inputLabel: { shrink: true } }} onChange={(event) => setValue({ ...value, workHours: { ...value.workHours, entryTime: event.target.value } })} />
      <TextField required type="time" label="Salida" value={value.workHours.exitTime} slotProps={{ inputLabel: { shrink: true } }} onChange={(event) => setValue({ ...value, workHours: { ...value.workHours, exitTime: event.target.value } })} />
    </Box>
    <Divider />
    <Typography component="h3" variant="h3">Comida de la sucursal</Typography>
    <TextField select label="Configuración de comida" value={value.meal.mode} onChange={(event) => {
      const mode = event.target.value as typeof value.meal.mode
      setValue({ ...value, meal: { ...value.meal, mode,
        startTime: mode === 'configured' && value.meal.startTime === '00:00' ? '13:30' : value.meal.startTime,
        endTime: mode === 'configured' && value.meal.endTime === '00:00' ? '13:30' : value.meal.endTime } })
    }}>
      <MenuItem value="automatic">Detección automática (sin horario fijo)</MenuItem>
      <MenuItem value="configured">Con horario de comida</MenuItem>
      <MenuItem value="disabled">Sin movimientos de comida</MenuItem>
    </TextField>
    {value.meal.mode === 'configured' && <Box sx={fieldGrid}>
      <TextField required type="time" label="Salida a comer desde" value={value.meal.startTime} slotProps={{ inputLabel: { shrink: true } }} onChange={(event) => setValue({ ...value, meal: { ...value.meal, startTime: event.target.value,
        ...(value.meal.endTime === value.meal.startTime ? { endTime: event.target.value } : {}) } })} />
      <TextField required type="time" label="Salida a comer hasta" value={value.meal.endTime} slotProps={{ inputLabel: { shrink: true } }} onChange={(event) => setValue({ ...value, meal: { ...value.meal, endTime: event.target.value } })} helperText="Usa la misma hora para una salida fija." />
      <TextField required type="number" label="Duración de comida (minutos)" value={value.meal.durationMinutes} slotProps={{ htmlInput: { min: 1, max: 240 } }} onChange={(event) => setValue({ ...value, meal: { ...value.meal, durationMinutes: Number(event.target.value) } })} helperText="El regreso esperado se calcula desde la salida real." />
    </Box>}
    <Typography variant="body2" color="text.secondary">La comida de sucursal se aplica a quienes la heredan. Las configuraciones individuales conservan su prioridad.</Typography>
    <Divider />
    <Typography component="h3" variant="h3">Reconocimiento y tolerancias</Typography>
    <Box sx={fieldGrid}>
      <TextField required type="number" label="Margen de entradas repetidas (minutos)" value={value.policy.entryRepeatWindowMinutes} slotProps={{ htmlInput: { min: 0, max: 120 } }} onChange={(event) => policy('entryRepeatWindowMinutes', Number(event.target.value))} helperText="Inicialmente 20 minutos desde la primera entrada, sin encadenar ventanas." />
      <TextField required type="number" label="Margen para reconocer movimientos (minutos)" value={value.recognitionMarginMinutes} slotProps={{ htmlInput: { min: 0, max: 120 } }} onChange={(event) => setValue({ ...value, recognitionMarginMinutes: Number(event.target.value) })} helperText="Inicialmente 30 minutos. Es independiente de las tolerancias." />
      <ToleranceField label="Tolerancia de entrada" value={value.policy.entryToleranceMinutes} onChange={(next) => policy('entryToleranceMinutes',next)} />
      <ToleranceField label="Tolerancia de comida" value={value.policy.mealToleranceMinutes} onChange={(next) => policy('mealToleranceMinutes',next)} />
    </Box>
    <Divider />
    <Typography component="h3" variant="h3">Retardos y descuentos</Typography>
    <Box sx={fieldGrid}>
      <TextField required type="number" label="Retardos de llegada permitidos" value={value.policy.entryAllowedTardies} slotProps={{ htmlInput: { min: 0, max: 100 } }} onChange={(event) => policy('entryAllowedTardies',Number(event.target.value))} helperText={`El retardo ${value.policy.entryAllowedTardies + 1} genera un día de descuento.`} />
      <TextField required type="number" label="Retardos de comida permitidos" value={value.policy.mealAllowedTardies} slotProps={{ htmlInput: { min: 0, max: 100 } }} onChange={(event) => policy('mealAllowedTardies',Number(event.target.value))} helperText={`El retardo ${value.policy.mealAllowedTardies + 1} genera un día de descuento.`} />
      <TextField select label="Periodo de acumulación" value={value.policy.accumulationMode} onChange={(event) => policy('accumulationMode',event.target.value as PolicySettings['accumulationMode'])}>
        <MenuItem value="first_lateness">Desde el primer retardo de cada grupo</MenuItem><MenuItem value="calendar_month">Mes calendario</MenuItem>
      </TextField>
      {value.policy.accumulationMode === 'first_lateness' && <TextField required type="number" label="Días del periodo" value={value.policy.accumulationDays} slotProps={{ htmlInput: { min: 1, max: 366 } }} onChange={(event) => policy('accumulationDays',Number(event.target.value))} />}
    </Box>
    <Alert severity="info">Al guardar se recalcula la asistencia. Las checadas, imágenes y datos de los empleados se conservan.</Alert>
  </EditorDialog>
}
