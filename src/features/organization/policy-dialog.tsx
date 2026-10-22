import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import MenuItem from '@mui/material/MenuItem'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import { useState } from 'react'
import { getToday, savePolicy, useOrganizationMutation } from './api'
import EditorDialog from './editor-dialog'
import type { Branch, BranchPolicy, PolicySettings } from './types'
import ToleranceField from './tolerance-field'

export default function PolicyDialog({ branch, policy, onClose }: { branch: Branch; policy?: BranchPolicy; onClose: () => void }) {
  const [effectiveFrom, setEffectiveFrom] = useState(getToday)
  const [settings, setSettings] = useState<PolicySettings>({
    entryToleranceMinutes: 0, mealToleranceMinutes: 0, entryAllowedTardies: 3, mealAllowedTardies: 3, accumulationMode: 'first_lateness', accumulationDays: 30,
    ...policy?.settings, entryRepeatWindowMinutes: policy?.settings.entryRepeatWindowMinutes ?? 20,
  })
  const mutation = useOrganizationMutation(savePolicy)
  function update<Key extends keyof PolicySettings>(key: Key, value: PolicySettings[Key]) { setSettings((current) => ({ ...current, [key]: value })) }
  return (
    <EditorDialog title={`Reglas de ${branch.name}`} onClose={onClose} saveLabel="Guardar versión" onSave={() => mutation.mutateAsync({ branchId: branch.id, effectiveFrom, settings })}>
      <TextField required type="date" label="Aplicar desde" value={effectiveFrom} onChange={(event) => setEffectiveFrom(event.target.value)} slotProps={{ inputLabel: { shrink: true } }} helperText="Se conserva la versión anterior. Las fechas anteriores a esta vigencia no cambian." />
      <Typography variant="h3" component="h3">Lecturas repetidas</Typography>
      <TextField required type="number" label="Margen de entradas repetidas (minutos)" value={settings.entryRepeatWindowMinutes} onChange={(event) => update('entryRepeatWindowMinutes', Number(event.target.value))} slotProps={{ htmlInput: { min: 0, max: 120 } }} helperText="Se cuenta desde la primera entrada y solo aplica al bloque inicial. Conserva las marcas originales. Con 0 se mantiene únicamente la detección de lecturas de menos de un minuto." />
      <Typography variant="h3" component="h3">Tolerancias</Typography>
      <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' } }}>
        <ToleranceField label="Tolerancia de entrada" value={settings.entryToleranceMinutes} onChange={(value) => update('entryToleranceMinutes', value)} />
        <ToleranceField label="Tolerancia de comida" value={settings.mealToleranceMinutes} onChange={(value) => update('mealToleranceMinutes', value)} />
      </Box>
      <Typography variant="body2" color="text.secondary">La tolerancia de comida aplica tanto al límite para salir como al regreso calculado desde la salida real.</Typography>
      <Typography variant="h3" component="h3">Retardos y descuentos</Typography>
      <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' } }}>
        <TextField required type="number" label="Retardos de llegada permitidos" value={settings.entryAllowedTardies} onChange={(event) => update('entryAllowedTardies', Number(event.target.value))} slotProps={{ htmlInput: { min: 0, max: 100 } }} helperText={`El retardo ${settings.entryAllowedTardies + 1} genera un día de descuento.`} />
        <TextField required type="number" label="Retardos de comida permitidos" value={settings.mealAllowedTardies} onChange={(event) => update('mealAllowedTardies', Number(event.target.value))} slotProps={{ htmlInput: { min: 0, max: 100 } }} helperText={`El retardo ${settings.mealAllowedTardies + 1} genera un día de descuento.`} />
      </Box>
      <TextField select label="Periodo de acumulación" value={settings.accumulationMode} onChange={(event) => update('accumulationMode', event.target.value as PolicySettings['accumulationMode'])}>
        <MenuItem value="first_lateness">Desde el primer retardo de cada grupo</MenuItem>
        <MenuItem value="calendar_month">Mes calendario</MenuItem>
      </TextField>
      {settings.accumulationMode === 'first_lateness' && <TextField required type="number" label="Días del periodo" value={settings.accumulationDays} onChange={(event) => update('accumulationDays', Number(event.target.value))} slotProps={{ htmlInput: { min: 1, max: 366 } }} />}
      <Alert severity="info">Llegada y comida tienen contadores separados. Cada grupo completado registra un día de descuento. Salir y regresar tarde de comida pueden sumar dos retardos.</Alert>
    </EditorDialog>
  )
}
