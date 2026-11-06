import Avatar from '@mui/material/Avatar'
import ButtonBase from '@mui/material/ButtonBase'
import Divider from '@mui/material/Divider'
import Menu from '@mui/material/Menu'
import MenuItem from '@mui/material/MenuItem'
import Snackbar from '@mui/material/Snackbar'
import Alert from '@mui/material/Alert'
import Typography from '@mui/material/Typography'
import { useIsMutating } from '@tanstack/react-query'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { getApiErrorMessage } from '../../shared/api/api-error'
import { useAuth } from './auth-context'
import { roleLabels } from './types'

export default function AccountMenu() {
  const { account, logout } = useAuth()
  const [anchor, setAnchor] = useState<HTMLElement | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const mutations = useIsMutating()
  if (!account) return null
  async function signOut() {
    setBusy(true); setError('')
    try { await logout() }
    catch (error) { setError(getApiErrorMessage(error)) }
    finally { setBusy(false); setAnchor(null) }
  }
  return <>
    <ButtonBase aria-label="Menú de mi cuenta" aria-haspopup="menu" aria-expanded={Boolean(anchor)} onClick={event => setAnchor(event.currentTarget)} sx={{ borderRadius: '50%' }}>
      <Avatar sx={{ bgcolor: 'primary.light', color: 'primary.dark', fontSize: 12, fontWeight: 600, width: 32, height: 32 }}>{account.name.slice(0, 2).toUpperCase()}</Avatar>
    </ButtonBase>
    <Menu anchorEl={anchor} open={Boolean(anchor)} onClose={() => { if (!busy) setAnchor(null) }}>
      <MenuItem disabled sx={{ opacity: '1 !important', display: 'block' }}><Typography variant="body2">{account.name}</Typography><Typography variant="caption" color="text.secondary">{account.username} · {roleLabels[account.role]}</Typography></MenuItem>
      <Divider />
      <MenuItem component={Link} to="/change-password" disabled={busy || mutations > 0} onClick={() => setAnchor(null)}>Cambiar contraseña</MenuItem>
      <MenuItem disabled={busy || mutations > 0} onClick={() => void signOut()}>{busy ? 'Cerrando sesión…' : 'Cerrar sesión'}</MenuItem>
    </Menu>
    <Snackbar open={Boolean(error)} onClose={() => setError('')}><Alert severity="error" onClose={() => setError('')}>{error}</Alert></Snackbar>
  </>
}
