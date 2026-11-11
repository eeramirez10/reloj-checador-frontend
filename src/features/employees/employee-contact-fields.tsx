import Alert from '@mui/material/Alert'
import MenuItem from '@mui/material/MenuItem'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import { useBloodTypes, type ContactValues } from '../portal/api'
import { getApiErrorMessage } from '../../shared/api/api-error'

export default function EmployeeContactFields({ value,onChange,canEditEmail = true,disabled = false }: {
  value: ContactValues; onChange: (value: ContactValues) => void; canEditEmail?: boolean; disabled?: boolean
}) {
  const types = useBloodTypes()
  const update = (key: keyof ContactValues,field: string) => onChange({ ...value,[key]: field })
  return <Stack spacing={2.5}>
    <TextField label="Correo" type="email" value={value.email} disabled={disabled || !canEditEmail} onChange={event => update('email',event.target.value)}
      helperText={canEditEmail ? 'Aquí se enviarán el acceso temporal y las notificaciones de permisos.' : 'RH administra el correo registrado.'} slotProps={{ htmlInput: { maxLength: 254 } }} />
    <TextField label="Teléfono principal / WhatsApp" type="tel" value={value.whatsappPhone} disabled={disabled} onChange={event => update('whatsappPhone',event.target.value)}
      placeholder="+525512345678" helperText="Incluye el código de país. Este número se utilizará para la integración de WhatsApp." slotProps={{ htmlInput: { maxLength: 40 } }} />
    <TextField label="Teléfono alterno" type="tel" value={value.alternatePhone} disabled={disabled} onChange={event => update('alternatePhone',event.target.value)}
      placeholder="+525512345678" slotProps={{ htmlInput: { maxLength: 40 } }} />
    {types.isError && <Alert severity="error">{getApiErrorMessage(types.error)}</Alert>}
    <TextField select label="Tipo de sangre" value={value.bloodType} disabled={disabled || types.isPending || types.isError} onChange={event => update('bloodType',event.target.value)}>
      <MenuItem value="">Sin registrar</MenuItem>{types.data?.map(code => <MenuItem key={code} value={code}>{code}</MenuItem>)}
    </TextField>
  </Stack>
}
