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
import { useState } from 'react'
import { useBranches } from '../features/organization/api'
import BranchDialog from '../features/organization/branch-dialog'
import type { Branch } from '../features/organization/types'
import { getTimeZoneLabel } from '../features/organization/time-zones'
import { getApiErrorMessage } from '../shared/api/api-error'
import PageHeader from '../shared/ui/page-header'
import PageLoading from '../shared/ui/page-loading'

export default function BranchesPage() {
  const branches = useBranches()
  const [editing, setEditing] = useState<Branch | 'new' | null>(null)
  return (
    <>
      <PageHeader title="Sucursales" description="Organiza los centros de trabajo, sus direcciones y datos de contacto."
        action={<Button startIcon={<AddRoundedIcon />} variant="contained" onClick={() => setEditing('new')}>Agregar sucursal</Button>} />
      {branches.isError && <Alert severity="error">{getApiErrorMessage(branches.error)}</Alert>}
      {branches.isPending ? <PageLoading /> : (
        <TableContainer component={Paper} variant="outlined">
          <Table aria-label="Sucursales" sx={{ minWidth: 850 }}>
            <TableHead><TableRow><TableCell>Sucursal</TableCell><TableCell>Dirección</TableCell><TableCell>Contacto</TableCell><TableCell>Zona horaria</TableCell><TableCell>Estatus</TableCell><TableCell>Acciones</TableCell></TableRow></TableHead>
            <TableBody>
              {(branches.data ?? []).map((branch) => (
                <TableRow key={branch.id} hover>
                  <TableCell sx={{ maxWidth: 260 }}><Stack><Typography variant="body2" sx={{ fontWeight: 600 }}>{branch.name}</Typography><Typography variant="caption" color="text.secondary" sx={{ overflowWrap: 'anywhere' }}>{branch.id}</Typography></Stack></TableCell>
                  <TableCell sx={{ maxWidth: 280 }}>{[branch.street, branch.exteriorNumber, branch.interiorNumber && `Int. ${branch.interiorNumber}`, branch.neighborhood, branch.postalCode, branch.city, branch.state].filter(Boolean).join(', ') || 'Dirección pendiente'}</TableCell>
                  <TableCell><Stack><Typography variant="body2">{branch.managerName || 'Sin encargado'}</Typography><Typography variant="caption">{branch.phone || branch.email || 'Sin contacto'}</Typography></Stack></TableCell>
                  <TableCell><Stack><Typography variant="body2">{getTimeZoneLabel(branch.timeZone)}</Typography><Typography variant="caption" color="text.secondary">{branch.timeZone}</Typography></Stack></TableCell>
                  <TableCell><Chip size="small" label={branch.active ? 'Activa' : 'Inactiva'} color={branch.active ? 'success' : 'default'} variant="outlined" /></TableCell>
                  <TableCell><Button size="small" onClick={() => setEditing(branch)}>Editar</Button></TableCell>
                </TableRow>
              ))}
              {!branches.data?.length && <TableRow><TableCell colSpan={6}>Agrega una sucursal para asignar relojes, personas y horarios.</TableCell></TableRow>}
            </TableBody>
          </Table>
        </TableContainer>
      )}
      {editing && <BranchDialog branch={editing === 'new' ? undefined : editing} onClose={() => setEditing(null)} />}
    </>
  )
}
