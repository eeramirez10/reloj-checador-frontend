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
import { useCompanies,type Company } from '../features/companies/api'
import CompanyDialog from '../features/companies/company-dialog'
import PageHeader from '../shared/ui/page-header'
import PageLoading from '../shared/ui/page-loading'
import { getApiErrorMessage } from '../shared/api/api-error'
import CompanyEmployeesDialog from '../features/companies/company-employees-dialog'
import { usePermissions } from '../features/auth/auth-context'

export default function CompaniesPage() {
  const companies = useCompanies()
  const {isAdmin,canManagePersonnel}=usePermissions()
  const [editing,setEditing] = useState<Company | 'new' | null>(null)
  const [assigning,setAssigning]=useState<Company|null>(null)
  return <><PageHeader title="Empresas" description="Clasifica empleados y separa sus consultas y reportes por empresa."
    action={<Stack direction="row" spacing={1}><Button variant="outlined" disabled={companies.isFetching} onClick={() => void companies.refetch()}>Actualizar</Button>
      {isAdmin&&<Button variant="contained" startIcon={<AddRoundedIcon />} onClick={() => setEditing('new')}>Agregar empresa</Button>}</Stack>} />
    {companies.isError && <Alert severity="error">{getApiErrorMessage(companies.error)}</Alert>}
    {companies.isPending ? <PageLoading /> : <TableContainer component={Paper} variant="outlined"><Table aria-label="Empresas" sx={{ minWidth: 640 }}>
      <TableHead><TableRow><TableCell>Empresa</TableCell><TableCell>Código interno</TableCell><TableCell>Observaciones</TableCell><TableCell>Estado</TableCell><TableCell>Acciones</TableCell></TableRow></TableHead>
      <TableBody>{companies.data?.map(company => <TableRow key={company.id} hover>
        <TableCell><Typography variant="body2" sx={{ fontWeight: 600 }}>{company.name}</Typography></TableCell><TableCell>{company.code ?? '—'}</TableCell>
        <TableCell sx={{ maxWidth: 360,whiteSpace: 'pre-wrap',overflowWrap: 'anywhere' }}>{company.notes || '—'}</TableCell>
        <TableCell><Chip size="small" variant="outlined" color={company.active ? 'success' : 'default'} label={company.active ? 'Activa' : 'Inactiva'} /></TableCell>
        <TableCell><Stack direction="row" spacing={1}>{isAdmin&&<Button size="small" onClick={() => setEditing(company)} aria-label={`Editar ${company.name}`}>Editar</Button>}
          {canManagePersonnel&&<Button size="small" variant="outlined" disabled={!company.active} onClick={()=>setAssigning(company)} aria-label={`Asignar empleados a ${company.name}`}>Asignar empleados</Button>}</Stack></TableCell>
      </TableRow>)}{companies.data?.length === 0 && <TableRow><TableCell colSpan={5}>Agrega una empresa y después asígnala desde el expediente del empleado.</TableCell></TableRow>}</TableBody>
    </Table></TableContainer>}
    {editing && <CompanyDialog company={editing === 'new' ? undefined : editing} onClose={() => setEditing(null)} />}
    {assigning&&<CompanyEmployeesDialog company={assigning} onClose={()=>setAssigning(null)} />}
  </>
}
