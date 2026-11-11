import AddRoundedIcon from '@mui/icons-material/AddRounded'
import RefreshRoundedIcon from '@mui/icons-material/RefreshRounded'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import MenuItem from '@mui/material/MenuItem'
import Pagination from '@mui/material/Pagination'
import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'
import Tab from '@mui/material/Tab'
import Tabs from '@mui/material/Tabs'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import { useState } from 'react'
import { useEmployees } from '../features/employees/hooks/use-employees'
import { formatCardDate } from '../features/employees/employee-attendance-format'
import { getToday, useBranches } from '../features/organization/api'
import { useLeaveRequests } from '../features/leave/api'
import EmployeeSelect from '../features/leave/employee-select'
import LeaveDetailDialog from '../features/leave/leave-detail-dialog'
import LeaveRequestDialog from '../features/leave/leave-request-dialog'
import { leaveKindLabels, leaveStatusColors, leaveStatusLabels } from '../features/leave/leave-format'
import type { LeaveFilters, LeaveKind, LeaveRequest, LeaveStatus } from '../features/leave/types'
import { getApiErrorMessage } from '../shared/api/api-error'
import PageHeader from '../shared/ui/page-header'
import PageLoading from '../shared/ui/page-loading'
import { usePermissions } from '../features/auth/auth-context'

function RequestStatus({ request }: { request: LeaveRequest }) {
  return <Chip size="small" variant="outlined" color={leaveStatusColors[request.status]} label={leaveStatusLabels[request.status]} />
}
function RequestPeriod({ request }: { request: LeaveRequest }) {
  return <Stack spacing={0.25}><Typography variant="body2">{formatCardDate(request.from)} al {formatCardDate(request.to)}</Typography>
    <Typography variant="caption" color="text.secondary">{request.details.days.length} días laborables{request.authorizedTime ? ` · ${request.authorizedTime} h` : ''}</Typography></Stack>
}

export default function LeaveRequestsPage() {
  const { canManagePersonnel } = usePermissions()
  const [filters, setFilters] = useState<LeaveFilters>(() => {
    const today = getToday()
    const end = new Date(Date.UTC(Number(today.slice(0, 4)), Number(today.slice(5, 7)), 0)).toISOString().slice(0, 10)
    return { from: `${today.slice(0, 7)}-01`, to: end, status: 'pending', page: 1, limit: 25 }
  })
  const [creating, setCreating] = useState(false)
  const [selected, setSelected] = useState<string | null>(null)
  const employees = useEmployees({ limit: 500 })
  const branches = useBranches()
  const requests = useLeaveRequests(filters)
  const people = employees.data ?? []
  const update = (changes: Partial<LeaveFilters>) => setFilters((current) => ({ ...current, ...changes, page: 1 }))
  const rows = requests.data?.requests ?? []
  return <>
    <PageHeader title="Permisos" description="Registra solicitudes, revisa autorizaciones y controla los días a cuenta de vacaciones."
      action={<Stack direction="row" spacing={1}><Button variant="outlined" disabled={requests.isFetching} startIcon={<RefreshRoundedIcon />} onClick={() => void requests.refetch()}>Actualizar</Button>
        {canManagePersonnel && <Button variant="contained" startIcon={<AddRoundedIcon />} disabled={!employees.data} onClick={() => setCreating(true)}>Nueva solicitud</Button>}</Stack>} />
    <Stack spacing={2}>
      {[requests, employees, branches].filter((query) => query.isError).map((query, index) => <Alert key={index} severity="error">{getApiErrorMessage(query.error)}</Alert>)}
      <Paper variant="outlined" sx={{ p: 2 }}><Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', lg: 'repeat(3, minmax(0, 1fr))' }, gap: 2 }}>
        <TextField required size="small" type="date" label="Desde" value={filters.from} slotProps={{ inputLabel: { shrink: true } }}
          onChange={(event) => { const from = event.target.value || getToday(); update({ from, ...(from > filters.to ? { to: from } : {}) }) }} />
        <TextField required size="small" type="date" label="Hasta" value={filters.to} slotProps={{ inputLabel: { shrink: true } }}
          onChange={(event) => { const to = event.target.value || getToday(); update({ to, ...(to < filters.from ? { from: to } : {}) }) }} />
        <TextField size="small" select label="Sucursal" value={filters.branchId ?? ''} onChange={(event) => update({ branchId: event.target.value || undefined })}>
          <MenuItem value="">Todas las sucursales</MenuItem>{branches.data?.map((branch) => <MenuItem key={branch.id} value={branch.id}>{branch.name}</MenuItem>)}
        </TextField>
        <EmployeeSelect employees={people} value={filters.employeeId ?? ''} onChange={(id) => update({ employeeId: id || undefined })} />
        <EmployeeSelect employees={people} value={filters.managerId ?? ''} label="Jefe responsable" onChange={(id) => update({ managerId: id || undefined })} />
        <TextField size="small" select label="Tipo de permiso" value={filters.kind ?? ''} onChange={(event) => update({ kind: event.target.value as LeaveKind || undefined })}>
          <MenuItem value="">Todos los tipos</MenuItem>{Object.entries(leaveKindLabels).map(([kind, label]) => <MenuItem key={kind} value={kind}>{label}</MenuItem>)}
        </TextField>
      </Box><Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1.5 }}>Se muestran las solicitudes cuyo periodo coincide con las fechas seleccionadas.</Typography></Paper>
      <Tabs value={filters.status ?? 'all'} onChange={(_, status: string) => update({ status: status === 'all' ? undefined : status as LeaveStatus })}
        variant="scrollable" allowScrollButtonsMobile aria-label="Estado de las solicitudes">
        {Object.entries(leaveStatusLabels).map(([status, label]) => <Tab key={status} value={status} label={`${label}s`} />)}
        <Tab value="all" label="Todos" />
      </Tabs>
      <Typography variant="body2" color="text.secondary">{requests.data?.total ?? 0} {requests.data?.total === 1 ? 'solicitud' : 'solicitudes'}</Typography>
      {requests.isPending ? <PageLoading /> : <>
        <TableContainer component={Paper} variant="outlined" sx={{ display: { xs: 'none', md: 'block' } }}><Table aria-label="Solicitudes de permisos" sx={{ minWidth: 1080 }}>
          <TableHead><TableRow><TableCell>Empleado</TableCell><TableCell>Permiso</TableCell><TableCell>Periodo</TableCell><TableCell>Goce / vacaciones</TableCell><TableCell>Jefe</TableCell><TableCell>Estado</TableCell><TableCell>Detalle</TableCell></TableRow></TableHead>
          <TableBody>{rows.map((request) => <TableRow key={request.id} hover>
            <TableCell><Stack><Typography variant="body2" sx={{ fontWeight: 500 }}>{request.details.employeeName}</Typography><Typography variant="caption" color="text.secondary">{request.details.branchName}</Typography></Stack></TableCell>
            <TableCell>{leaveKindLabels[request.kind]}</TableCell><TableCell><RequestPeriod request={request} /></TableCell>
            <TableCell><Stack><Typography variant="body2">{request.paid ? 'Con goce' : 'Sin goce'}</Typography><Typography variant="caption" color="text.secondary">{request.useVacation ? `${request.details.days.length} días de vacaciones` : 'Sin tomar vacaciones'}</Typography></Stack></TableCell>
            <TableCell>{request.details.managerName}</TableCell><TableCell><RequestStatus request={request} /></TableCell><TableCell><Button size="small" onClick={() => setSelected(request.id)}>Ver solicitud</Button></TableCell>
          </TableRow>)}{!rows.length && <TableRow><TableCell colSpan={7} sx={{ py: 5 }}><EmptyRequests onCreate={canManagePersonnel ? () => setCreating(true) : undefined} /></TableCell></TableRow>}</TableBody>
        </Table></TableContainer>
        <Stack spacing={1.5} sx={{ display: { xs: 'flex', md: 'none' } }}>{rows.map((request) => <Paper variant="outlined" key={request.id} sx={{ p: 2 }}><Stack spacing={1.25}>
          <Stack direction="row" spacing={1} sx={{ justifyContent: 'space-between', alignItems: 'flex-start' }}><Typography sx={{ fontWeight: 600, overflowWrap: 'anywhere' }}>{request.details.employeeName}</Typography><RequestStatus request={request} /></Stack>
          <Typography variant="body2">{leaveKindLabels[request.kind]} · {request.paid ? 'Con goce' : 'Sin goce'}</Typography>
          <RequestPeriod request={request} /><Typography variant="caption" color="text.secondary">{request.details.branchName} · Jefe: {request.details.managerName}</Typography>
          {request.useVacation && <Typography variant="body2">{request.details.days.length} días a cuenta de vacaciones</Typography>}
          <Button variant="outlined" onClick={() => setSelected(request.id)}>Ver solicitud</Button>
        </Stack></Paper>)}{!rows.length && <Paper variant="outlined" sx={{ p: 3 }}><EmptyRequests onCreate={canManagePersonnel ? () => setCreating(true) : undefined} /></Paper>}</Stack>
        {requests.data && requests.data.total > filters.limit && <Pagination sx={{ alignSelf: 'center' }} page={requests.data.page} count={Math.ceil(requests.data.total / filters.limit)} onChange={(_, page) => setFilters((current) => ({ ...current, page }))} />}
      </>}
    </Stack>
    {creating && <LeaveRequestDialog employees={people} onClose={() => setCreating(false)} onCreated={(id) => { setCreating(false); setSelected(id) }} />}
    {selected && <LeaveDetailDialog id={selected} onClose={() => setSelected(null)} onCreated={setSelected} />}
  </>
}

function EmptyRequests({ onCreate }: { onCreate?: () => void }) {
  return <Stack spacing={1} sx={{ alignItems: 'center', textAlign: 'center' }}><Typography variant="body2">No hay solicitudes con estos filtros.</Typography>
    <Typography variant="caption" color="text.secondary">Cambia el periodo para consultar otras solicitudes.</Typography>{onCreate && <Button onClick={onCreate}>Nueva solicitud</Button>}</Stack>
}
