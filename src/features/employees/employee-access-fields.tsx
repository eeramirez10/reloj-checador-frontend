import Alert from '@mui/material/Alert'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { httpClient } from '../../shared/api/http-client'
import { getApiErrorMessage } from '../../shared/api/api-error'
import PageLoading from '../../shared/ui/page-loading'

interface AccessView {
  account: { username: string; role: string; isActive: boolean; mustChangePassword: boolean } | null
  messages: { id: string; state: string; recipient: string; attempts: number; errorCode: string | null; createdAt: string }[]
}
const states: Record<string,string> = { pending: 'En cola',sending: 'Enviando',accepted: 'Aceptado por Microsoft',failed: 'Falló el envío',uncertain: 'Revisar envío',expired: 'Vencido o sustituido' }
export default function EmployeeAccessFields({ employeeId,hasUnsavedContact = false }: { employeeId: string; hasUnsavedContact?: boolean }) {
  const client = useQueryClient()
  const access = useQuery({ queryKey: ['employee-access',employeeId],queryFn: async ({ signal }) => (await httpClient.get<AccessView>(`/employees/${employeeId}/access`,{ signal })).data,refetchInterval: 10_000 })
  const [username,setUsername] = useState<string | null>(null)
  const mutation = useMutation({ mutationFn: () => httpClient.post(`/employees/${employeeId}/access`,{ username: (username ?? access.data?.account?.username ?? '').trim() }),
    onSuccess: async () => { await client.invalidateQueries({ queryKey: ['employee-access',employeeId] }); await client.invalidateQueries({ queryKey: ['auth-accounts'] }) } })
  if (access.isPending) return <PageLoading />
  if (access.isError) return <Alert severity="error">{getApiErrorMessage(access.error)}</Alert>
  const account = access.data.account
  return <Stack spacing={2.5}>
    <Typography variant="body2">Guarda primero el correo del empleado en Contacto. El acceso se enviará a esa dirección desde Recursos Humanos.</Typography>
    {hasUnsavedContact && <Alert severity="info">Tienes cambios de contacto sin guardar. Vuelve a Contacto y guárdalos antes de generar el acceso.</Alert>}
    {account && <Typography variant="body2">Cuenta vinculada: <strong>{account.username}</strong> · {account.isActive ? 'Activa' : 'Inactiva'}</Typography>}
    {account && account.role !== 'employee' ? <Alert severity="info">Esta cuenta tiene permisos adicionales. El administrador puede gestionarla en Cuentas de acceso.</Alert> : <>
      <TextField label="Usuario" value={username ?? account?.username ?? ''} onChange={event => setUsername(event.target.value.toLowerCase())} disabled={mutation.isPending}
        helperText="De 3 a 64 letras, números, puntos, guiones o guiones bajos." slotProps={{ htmlInput: { maxLength: 64,pattern: '[a-z0-9][a-z0-9._\\-]{2,63}' } }} />
      {account && <Alert severity="info">Generar otro acceso sustituye la contraseña anterior y cierra las sesiones de esta cuenta. La contraseña temporal vence en 24 horas.</Alert>}
      <Button variant="contained" sx={{ alignSelf: 'flex-start' }} disabled={hasUnsavedContact || mutation.isPending || !(username ?? account?.username ?? '').trim()} onClick={() => mutation.mutate()}>
        {mutation.isPending ? 'Generando acceso…' : account ? 'Generar y enviar nuevo acceso' : 'Crear y enviar acceso'}
      </Button>
    </>}
    {mutation.isError && <Alert severity="error">{getApiErrorMessage(mutation.error)}</Alert>}
    {mutation.isSuccess && <Alert severity="success">Acceso generado y correo registrado en la cola de envío.</Alert>}
    <Stack spacing={1}><Typography variant="h3">Envíos de acceso</Typography>
      {access.data.messages.map(message => <Stack key={message.id} spacing={0.5} sx={{ borderLeft: 2,borderColor: 'divider',pl: 1.5 }}>
        <Chip size="small" variant="outlined" sx={{ alignSelf: 'flex-start' }} label={states[message.state] ?? message.state} />
        <Typography variant="body2">{message.recipient}</Typography><Typography variant="caption" color="text.secondary">{new Date(message.createdAt).toLocaleString('es-MX')} · {message.attempts} intentos{message.errorCode ? ` · ${message.errorCode}` : ''}</Typography>
      </Stack>)}
      {!access.data.messages.length && <Typography variant="body2" color="text.secondary">Todavía no se ha generado un correo de acceso.</Typography>}
    </Stack>
  </Stack>
}
