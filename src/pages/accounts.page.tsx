import AddRoundedIcon from '@mui/icons-material/AddRounded'
import Alert from '@mui/material/Alert'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import Typography from '@mui/material/Typography'
import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { getAccounts } from '../features/auth/api'
import AccountDialog from '../features/auth/account-dialog'
import { roleLabels, type AuthAccount } from '../features/auth/types'
import { useBranches } from '../features/organization/api'
import { getApiErrorMessage } from '../shared/api/api-error'
import PageHeader from '../shared/ui/page-header'
import PageLoading from '../shared/ui/page-loading'

export default function AccountsPage() {
  const accounts = useQuery({ queryKey: ['auth-accounts'], queryFn: ({ signal }) => getAccounts(signal) })
  const branches = useBranches()
  const [editing, setEditing] = useState<AuthAccount | 'new' | null>(null)
  function scope(account: AuthAccount) {
    return account.role === 'admin' ? 'Todas las sucursales' : account.branchIds.map(id => branches.data?.find(branch => branch.id === id)?.name ?? 'Sucursal no disponible').join(', ') || 'Sin sucursales'
  }
  const action = (account: AuthAccount) => <Button size="small" aria-label={`Editar cuenta de ${account.name}`} onClick={() => setEditing(account)}>Editar cuenta</Button>
  return <>
    <PageHeader title="Cuentas de acceso" description="Administra quién entra al panel y las sucursales que puede consultar o gestionar."
      action={<Button variant="contained" startIcon={<AddRoundedIcon />} disabled={!branches.data} onClick={() => setEditing('new')}>Crear cuenta</Button>} />
    <Stack spacing={2}>
      {[accounts, branches].filter(query => query.isError).map((query, index) => <Alert key={index} severity="error">{getApiErrorMessage(query.error)}</Alert>)}
      {accounts.isPending ? <PageLoading /> : <>
        <TableContainer component={Paper} variant="outlined" sx={{ display: { xs: 'none', md: 'block' } }}><Table aria-label="Cuentas de acceso" sx={{ minWidth: 850 }}>
          <TableHead><TableRow><TableCell>Cuenta</TableCell><TableCell>Rol</TableCell><TableCell>Sucursales autorizadas</TableCell><TableCell>Estado</TableCell><TableCell>Acciones</TableCell></TableRow></TableHead>
          <TableBody>{accounts.data?.map(account => <TableRow key={account.id}>
            <TableCell><Typography variant="body2" sx={{ fontWeight: 600 }}>{account.name}</Typography><Typography variant="caption" color="text.secondary">{account.username}</Typography></TableCell>
            <TableCell>{roleLabels[account.role]}</TableCell><TableCell sx={{ maxWidth: 400 }}>{scope(account)}</TableCell>
            <TableCell><AccountStatus account={account} /></TableCell><TableCell>{action(account)}</TableCell>
          </TableRow>)}</TableBody>
        </Table></TableContainer>
        <Stack spacing={1.5} sx={{ display: { xs: 'flex', md: 'none' } }}>{accounts.data?.map(account => <Paper key={account.id} variant="outlined" sx={{ p: 2 }}>
          <Stack spacing={1.25}><Typography sx={{ fontWeight: 600 }}>{account.name}</Typography><Typography variant="body2">{account.username} · {roleLabels[account.role]}</Typography>
            <Typography variant="body2" sx={{ overflowWrap: 'anywhere' }}>{scope(account)}</Typography><AccountStatus account={account} />{action(account)}</Stack>
        </Paper>)}</Stack>
      </>}
    </Stack>
    {editing && <AccountDialog account={editing === 'new' ? undefined : editing} branches={branches.data ?? []} onClose={() => setEditing(null)} />}
  </>
}

function AccountStatus({ account }: { account: AuthAccount }) {
  return <Stack spacing={0.5} sx={{ alignItems: 'flex-start' }}><Chip size="small" variant="outlined" color={account.isActive ? 'success' : 'default'} label={account.isActive ? 'Activa' : 'Desactivada'} />
    {account.mustChangePassword && <Typography variant="caption" color="text.secondary">Cambio de contraseña pendiente</Typography>}
  </Stack>
}
