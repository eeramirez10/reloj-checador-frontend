import Alert from '@mui/material/Alert'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import MenuItem from '@mui/material/MenuItem'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { httpClient } from '../../shared/api/http-client'
import { getApiErrorMessage } from '../../shared/api/api-error'
import PageLoading from '../../shared/ui/page-loading'
import TemporaryPasswordField from '../auth/temporary-password-field'

interface AccessView {
  account: { username: string; role: string; isActive: boolean; mustChangePassword: boolean } | null
  messages: { id: string; state: string; recipient: string; attempts: number; errorCode: string | null; createdAt: string }[]
}
const states: Record<string,string> = { pending: 'En cola',sending: 'Enviando',accepted: 'Aceptado por Microsoft',failed: 'Falló el envío',uncertain: 'Revisar envío',expired: 'Vencido o sustituido' }
export default function EmployeeAccessFields({ employeeId,hasUnsavedContact = false }: { employeeId: string; hasUnsavedContact?: boolean }) {
  const client = useQueryClient()
  const access = useQuery({ queryKey: ['employee-access',employeeId],queryFn: async ({ signal }) => (await httpClient.get<AccessView>(`/employees/${employeeId}/access`,{ signal })).data,refetchInterval: 10_000 })
  const [username,setUsername] = useState<string | null>(null)
  const [delivery,setDelivery] = useState<'manual' | 'email'>('manual')
  const [password,setPassword] = useState('')
  const mutation = useMutation({ mutationFn: async () => {
    const { data } = await httpClient.post<{ username: string; emailId: string | null }>(`/employees/${employeeId}/access`,{
      username: (username ?? access.data?.account?.username ?? '').trim(), delivery, ...(delivery === 'manual' ? { password } : {}),
    })
    return data
  },
    onSuccess: async () => { await Promise.all([client.invalidateQueries({ queryKey: ['employee-access',employeeId] }),client.invalidateQueries({ queryKey: ['auth-accounts'] }),client.invalidateQueries({ queryKey: ['auth-audit'] })]) } })
  if (access.isPending) return <PageLoading />
  if (access.isError) return <Alert severity="error">{getApiErrorMessage(access.error)}</Alert>
  const account = access.data.account
  return <Stack spacing={2.5}>
    <Typography variant="body2">Puedes crear el acceso y entregar las credenciales directamente, sin registrar correo ni configurar Microsoft 365.</Typography>
    {delivery === 'email' && hasUnsavedContact && <Alert severity="info">Tienes cambios de contacto sin guardar. Vuelve a Contacto y guárdalos antes de enviar el acceso por correo.</Alert>}
    {account && <Typography variant="body2">Cuenta vinculada: <strong>{account.username}</strong> · {account.isActive ? 'Activa' : 'Inactiva'}</Typography>}
    {account && account.role !== 'employee' ? <Alert severity="info">Esta cuenta tiene permisos adicionales. El administrador puede gestionarla en Cuentas de acceso.</Alert> : <>
      <TextField label="Usuario" value={username ?? account?.username ?? ''} onChange={event => { setUsername(event.target.value.toLowerCase()); mutation.reset() }} disabled={mutation.isPending}
        helperText="De 3 a 64 letras, números, puntos, guiones o guiones bajos." slotProps={{ htmlInput: { maxLength: 64,pattern: '[a-z0-9][a-z0-9._\\-]{2,63}' } }} />
      <TextField select label="Entrega del acceso" value={delivery} disabled={mutation.isPending} onChange={event => { setDelivery(event.target.value as typeof delivery); mutation.reset() }}>
        <MenuItem value="manual">Manual, sin correo</MenuItem><MenuItem value="email">Enviar por correo</MenuItem>
      </TextField>
      {delivery === 'manual' ? <>
        <TemporaryPasswordField value={password} onChange={value => { setPassword(value); mutation.reset() }} required disabled={mutation.isPending} />
        <Typography variant="body2">Copia la contraseña antes de salir y entrégala junto con el usuario. Al entrar se solicitará cambiarla; vence en 24 horas.</Typography>
      </> : <Alert severity="info">Requiere el correo del empleado guardado en Contacto y la configuración de correo del servidor. La contraseña se genera automáticamente y se registra en la cola de envío.</Alert>}
      {account && <Alert severity="info">Generar otro acceso sustituye la contraseña anterior y cierra las sesiones de esta cuenta. La contraseña temporal vence en 24 horas.</Alert>}
      <Button variant="contained" sx={{ alignSelf: 'flex-start' }} disabled={(delivery === 'email' && hasUnsavedContact) || mutation.isPending || !(username ?? account?.username ?? '').trim() || (delivery === 'manual' && (password.length < 8 || password.length > 128))} onClick={() => mutation.mutate()}>
        {mutation.isPending ? 'Generando acceso…' : delivery === 'email' ? account ? 'Generar y enviar nuevo acceso' : 'Crear y enviar acceso' : account ? 'Generar nuevo acceso manual' : 'Crear acceso manual'}
      </Button>
    </>}
    {mutation.isError && <Alert severity="error">{getApiErrorMessage(mutation.error)}</Alert>}
    {mutation.isSuccess && <Alert severity="success">{mutation.data.emailId ? 'Acceso generado y correo registrado en la cola de envío.' : 'Acceso generado y vinculado. Entrega el usuario y la contraseña temporal directamente; no se envió correo.'}</Alert>}
    <Stack spacing={1}><Typography variant="h3">Envíos de acceso</Typography>
      {access.data.messages.map(message => <Stack key={message.id} spacing={0.5} sx={{ borderLeft: 2,borderColor: 'divider',pl: 1.5 }}>
        <Chip size="small" variant="outlined" sx={{ alignSelf: 'flex-start' }} label={states[message.state] ?? message.state} />
        <Typography variant="body2">{message.recipient}</Typography><Typography variant="caption" color="text.secondary">{new Date(message.createdAt).toLocaleString('es-MX')} · {message.attempts} intentos{message.errorCode ? ` · ${message.errorCode}` : ''}</Typography>
      </Stack>)}
      {!access.data.messages.length && <Typography variant="body2" color="text.secondary">No hay correos de acceso registrados. La entrega manual no genera mensajes.</Typography>}
    </Stack>
  </Stack>
}
