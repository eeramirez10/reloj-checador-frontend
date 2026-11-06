import Alert from '@mui/material/Alert'
import Button from '@mui/material/Button'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import { useState, type FormEvent } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../features/auth/auth-context'
import AuthShell from '../features/auth/auth-shell'
import { httpClient } from '../shared/api/http-client'
import { getApiErrorMessage } from '../shared/api/api-error'
import PageLoading from '../shared/ui/page-loading'

export default function ChangePasswordPage() {
  const auth = useAuth()
  const navigate = useNavigate()
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  if (auth.isPending) return <PageLoading />
  if (!auth.account) return <Navigate to="/login" replace />
  async function submit(event: FormEvent) {
    event.preventDefault()
    if (busy) return
    if (newPassword !== confirmation) { setError('Las contraseñas nuevas no coinciden.'); return }
    setBusy(true); setError('')
    try {
      await httpClient.post('/auth/change-password', { currentPassword, newPassword })
      await auth.clear()
      navigate('/login', { replace: true, state: { passwordChanged: true } })
    } catch (error) { setError(getApiErrorMessage(error)) }
    finally { setBusy(false) }
  }
  return <AuthShell title="Cambiar contraseña">
    <Typography variant="body2" color="text.secondary">{auth.account.name} · {auth.account.username}</Typography>
    {auth.account.mustChangePassword && <Alert severity="info">Cambia tu contraseña temporal para acceder al panel.</Alert>}
    {error && <Alert severity="error">{error}</Alert>}
    <Stack component="form" spacing={2.5} onSubmit={submit}>
      <TextField required label="Contraseña actual" type="password" autoComplete="current-password" value={currentPassword} disabled={busy} onChange={event => setCurrentPassword(event.target.value)} slotProps={{ htmlInput: { maxLength: 128 } }} />
      <TextField required label="Nueva contraseña" type="password" autoComplete="new-password" helperText="De 8 a 128 caracteres." value={newPassword} disabled={busy} onChange={event => setNewPassword(event.target.value)} slotProps={{ htmlInput: { minLength: 8, maxLength: 128 } }} />
      <TextField required label="Confirmar nueva contraseña" type="password" autoComplete="new-password" value={confirmation} disabled={busy} onChange={event => setConfirmation(event.target.value)} slotProps={{ htmlInput: { minLength: 8, maxLength: 128 } }} />
      <Button type="submit" variant="contained" disabled={busy}>{busy ? 'Guardando…' : 'Actualizar contraseña'}</Button>
      {!auth.account.mustChangePassword && <Button component={Link} to="/" disabled={busy}>Volver al panel</Button>}
    </Stack>
  </AuthShell>
}
