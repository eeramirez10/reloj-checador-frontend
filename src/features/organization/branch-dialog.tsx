import Box from '@mui/material/Box'
import FormControlLabel from '@mui/material/FormControlLabel'
import MenuItem from '@mui/material/MenuItem'
import Switch from '@mui/material/Switch'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import { useState } from 'react'
import { saveBranch, useOrganizationMutation } from './api'
import EditorDialog from './editor-dialog'
import type { Branch } from './types'
import { getTimeZoneLabel, timeZoneOptions } from './time-zones'

const emptyBranch: Omit<Branch, 'id'> = { name: '', street: '', exteriorNumber: '', interiorNumber: '', neighborhood: '', postalCode: '', city: '', state: '', country: 'México', phone: '', email: '', managerName: '', timeZone: 'America/Mexico_City', active: true, notes: '' }
const addressFields = [
  ['street', 'Calle'], ['exteriorNumber', 'Número exterior'], ['interiorNumber', 'Número interior'],
  ['neighborhood', 'Colonia'], ['postalCode', 'Código postal'], ['city', 'Ciudad / municipio'], ['state', 'Estado'], ['country', 'País'],
] as const

export default function BranchDialog({ branch, onClose }: { branch?: Branch; onClose: () => void }) {
  const [values, setValues] = useState<Omit<Branch, 'id'>>(branch ?? emptyBranch)
  const mutation = useOrganizationMutation(saveBranch)
  const update = (key: keyof typeof emptyBranch, value: string | boolean) => setValues((current) => ({ ...current, [key]: value }))
  return (
    <EditorDialog title={branch ? `Editar ${branch.name}` : 'Agregar sucursal'} onClose={onClose} onSave={() => mutation.mutateAsync({ id: branch?.id, values })}>
      <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' } }}>
        <TextField label="ID de sucursal (UUID)" value={branch?.id ?? ''} placeholder="Se genera automáticamente al guardar" slotProps={{ input: { readOnly: true }, inputLabel: { shrink: true } }} helperText="Identificador automático del sistema." />
        <TextField required label="Nombre de la sucursal" value={values.name} onChange={(event) => update('name', event.target.value)} />
      </Box>
      <Typography component="h3" variant="h3">Dirección</Typography>
      <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' } }}>
        {addressFields.map(([key, label]) => <TextField key={key} label={label} value={values[key]} onChange={(event) => update(key, event.target.value)} />)}
      </Box>
      <Typography component="h3" variant="h3">Contacto y operación</Typography>
      <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' } }}>
        <TextField label="Encargado" value={values.managerName} onChange={(event) => update('managerName', event.target.value)} />
        <TextField label="Teléfono" value={values.phone} onChange={(event) => update('phone', event.target.value)} />
        <TextField label="Correo electrónico" type="email" value={values.email} onChange={(event) => update('email', event.target.value)} />
        <TextField required select label="Zona horaria" helperText="Al guardar se actualizan las horas mostradas y el cálculo de asistencia de esta sucursal." value={values.timeZone} onChange={(event) => update('timeZone', event.target.value)} slotProps={{ select: { sx: { '& .MuiSelect-select': { whiteSpace: 'normal' } } } }}>
          {timeZoneOptions.map((option) => <MenuItem key={option.value} value={option.value} sx={{ whiteSpace: 'normal' }}>{getTimeZoneLabel(option.value)}</MenuItem>)}
          {!timeZoneOptions.some((option) => option.value === values.timeZone) && <MenuItem value={values.timeZone} sx={{ whiteSpace: 'normal' }}>{getTimeZoneLabel(values.timeZone)}</MenuItem>}
        </TextField>
      </Box>
      <TextField label="Observaciones" multiline minRows={2} value={values.notes} onChange={(event) => update('notes', event.target.value)} />
      <FormControlLabel control={<Switch checked={values.active} onChange={(event) => update('active', event.target.checked)} />} label="Sucursal activa" />
    </EditorDialog>
  )
}
