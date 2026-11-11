import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import PageLoading from '../../shared/ui/page-loading'
import { getApiErrorMessage } from '../../shared/api/api-error'
import { useAuth } from './auth-context'
import { canOpenPage } from './types'

export default function AuthGuard() {
  const { account, isPending, error, refresh } = useAuth()
  const location = useLocation()
  if (isPending) return <PageLoading />
  if (error) return <Box sx={{ p: 3 }}><Alert severity="error">{getApiErrorMessage(error)} <Button onClick={() => void refresh()}>Reintentar</Button></Alert></Box>
  if (!account) return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />
  if (account.mustChangePassword) return <Navigate to="/change-password" replace state={{ from: location.pathname + location.search }} />
  if (account.role === 'employee' && location.pathname === '/') return <Navigate to="/my/today" replace />
  if (!canOpenPage(account.role, location.pathname)) return <Navigate to="/" replace />
  return <Outlet key={`${account.id}:${account.version}`} />
}
