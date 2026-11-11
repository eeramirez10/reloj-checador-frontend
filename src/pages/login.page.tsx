import Alert from '@mui/material/Alert'
import Button from '@mui/material/Button'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import { useState, type FormEvent } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import AuthShell from '../features/auth/auth-shell'
import { useAuth } from '../features/auth/auth-context'
import { getApiErrorMessage } from '../shared/api/api-error'
import PageLoading from '../shared/ui/page-loading'

export default function LoginPage() {
  const auth = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const from = location.state?.from
  const destination = typeof from === 'string' && from.startsWith('/') && !from.startsWith('//') && !from.startsWith('/login') ? from : '/'
  if (auth.isPending) return <PageLoading />
  if (auth.account) return <Navigate to={auth.account.mustChangePassword ? '/change-password' : destination} replace state={{ from: destination }} />

  async function submit(event: FormEvent) {
    event.preventDefault()
    if (busy) return
    setBusy(true); setError('')
    try { const account = await auth.login(username, password); navigate(account.mustChangePassword ? '/change-password' : destination, { replace: true,state: { from: destination } }) }
    catch (error) { setError(getApiErrorMessage(error)) }
    finally { setBusy(false) }
  }
  return <AuthShell title="Iniciar sesión">
    <Typography variant="body2" color="text.secondary">Ingresa con la cuenta que te asignó el administrador.</Typography>
    {location.state?.passwordChanged && <Alert severity="success">Contraseña actualizada. Inicia sesión nuevamente.</Alert>}
    {(error || auth.error) && <Alert severity="error">{error || getApiErrorMessage(auth.error)}</Alert>}
    <Stack component="form" spacing={2.5} onSubmit={submit}>
      <TextField required label="Usuario" autoComplete="username" autoFocus value={username} disabled={busy} onChange={event => setUsername(event.target.value)} slotProps={{ htmlInput: { maxLength: 64 } }} />
      <TextField required label="Contraseña" type="password" autoComplete="current-password" value={password} disabled={busy} onChange={event => setPassword(event.target.value)} slotProps={{ htmlInput: { maxLength: 128 } }} />
      <Button type="submit" variant="contained" disabled={busy}>{busy ? 'Iniciando sesión…' : 'Entrar'}</Button>
    </Stack>
    <Typography variant="caption" color="text.secondary">Si olvidaste tu contraseña, solicita al administrador que la restablezca.</Typography>
  </AuthShell>
}
