import Alert from '@mui/material/Alert'
import Button from '@mui/material/Button'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import FormControlLabel from '@mui/material/FormControlLabel'
import Stack from '@mui/material/Stack'
import Switch from '@mui/material/Switch'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import MenuItem from '@mui/material/MenuItem'
import { useBranches } from '../../organization/api'
import { useState, type FormEvent } from 'react'
import type { CreateDeviceInput, Device } from '../types/device'
import {
  getDeviceFormValues,
  toCreateDeviceInput,
  validateDeviceForm,
  type DeviceFormErrors,
  type DeviceFormValues,
} from './device-form.validation'

type DeviceFormProps = {
  onCancel: () => void
  onSubmit: (input: CreateDeviceInput) => Promise<void>
  submitting: boolean
  submissionError?: string
  device?: Device
}

function DeviceForm({ onCancel, onSubmit, submitting, submissionError, device }: DeviceFormProps) {
  const branches = useBranches()
  const [values, setValues] = useState(() => getDeviceFormValues(device))
  const [errors, setErrors] = useState<DeviceFormErrors>({})

  function updateField<Key extends keyof DeviceFormValues>(key: Key, value: DeviceFormValues[Key]) {
    setValues((current) => ({ ...current, [key]: value }))
    setErrors((current) => ({ ...current, [key]: undefined }))
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const validationErrors = validateDeviceForm(values, !device)
    setErrors(validationErrors)

    if (Object.keys(validationErrors).length > 0) return
    await onSubmit(toCreateDeviceInput(values))
  }

  return (
    <form onSubmit={(event) => void handleSubmit(event)} noValidate style={{ display: 'flex', flexDirection: 'column', flex: '1 1 auto', minHeight: 0, overflow: 'hidden' }}>
      <DialogContent dividers>
        <Stack spacing={2.25}>
          <Typography color="text.secondary" variant="body2">
            {device ? 'Actualiza el nombre y la conexión del mismo reloj. Los cambios se usarán en las próximas sincronizaciones.' : 'Registra el reloj en la red local. El puerto de comunicación predeterminado es 4370.'}
          </Typography>
          {device?.driver !== 'sdk-bridge' && <Alert severity="info">
            El driver actual usa la clave de comunicación 0. Configúrala así en el menú de conexión a PC del reloj.
          </Alert>}
          {submissionError && <Alert severity="error">{submissionError}</Alert>}
          <TextField required={!device} disabled={Boolean(device)} select fullWidth label="Sucursal" value={values.branchId} onChange={(event) => updateField('branchId', event.target.value)} error={Boolean(errors.branchId)} helperText={errors.branchId ?? (device ? 'Usa Asignar sucursal para modificar la ubicación con fecha de vigencia.' : 'El reloj registrará la ubicación de cada checada.')}>
            {device && !values.branchId && <MenuItem value="">Sin asignar</MenuItem>}
            {(branches.data ?? []).filter((branch) => branch.active || branch.id === values.branchId).map((branch) => <MenuItem key={branch.id} value={branch.id}>{branch.name}</MenuItem>)}
          </TextField>
          <TextField
            autoFocus
            required
            fullWidth
            label="Nombre del reloj"
            value={values.name}
            onChange={(event) => updateField('name', event.target.value)}
            error={Boolean(errors.name)}
            helperText={errors.name ?? 'Nombre del equipo, por ejemplo: MB160 recepción. La sucursal se asigna por separado.'}
            slotProps={{ htmlInput: { maxLength: 120 } }}
          />
          {device && <TextField label="Tipo de conexión" value={device.driver === 'node' ? 'TCP/IP directo' : 'Puente SDK'} slotProps={{ input: { readOnly: true } }} />}
          <TextField
            required
            fullWidth
            label="Dirección IPv4"
            placeholder="192.168.1.100"
            value={values.ipAddress}
            onChange={(event) => updateField('ipAddress', event.target.value)}
            error={Boolean(errors.ipAddress)}
            helperText={errors.ipAddress ?? 'Usa la dirección asignada al reloj en Ethernet.'}
            slotProps={{ htmlInput: { inputMode: 'decimal' } }}
          />
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <TextField
              required
              fullWidth
              label="Puerto TCP"
              type="number"
              value={values.tcpPort}
              onChange={(event) => updateField('tcpPort', event.target.value)}
              error={Boolean(errors.tcpPort)}
              helperText={errors.tcpPort ?? 'Predeterminado: 4370'}
              slotProps={{ htmlInput: { min: 1, max: 65535, step: 1 } }}
            />
            <TextField
              required
              fullWidth
              label="Intervalo de sincronización"
              type="number"
              value={values.syncIntervalSeconds}
              onChange={(event) => updateField('syncIntervalSeconds', event.target.value)}
              error={Boolean(errors.syncIntervalSeconds)}
              helperText={errors.syncIntervalSeconds ?? 'Segundos; mínimo 15.'}
              slotProps={{ htmlInput: { min: 15, max: 86400, step: 1 } }}
            />
          </Stack>
          <FormControlLabel
            control={
              <Switch
                checked={values.enabled}
                onChange={(event) => updateField('enabled', event.target.checked)}
              />
            }
            label="Sincronizar automáticamente"
          />
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button disabled={submitting} onClick={onCancel}>
          Cancelar
        </Button>
        <Button disabled={submitting} type="submit" variant="contained">
            {submitting ? 'Guardando…' : device ? 'Guardar cambios' : 'Guardar reloj'}
        </Button>
      </DialogActions>
    </form>
  )
}

export default DeviceForm
