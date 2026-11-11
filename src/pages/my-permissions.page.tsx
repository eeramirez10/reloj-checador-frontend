import Alert from '@mui/material/Alert'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import MenuItem from '@mui/material/MenuItem'
import Pagination from '@mui/material/Pagination'
import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'
import Tab from '@mui/material/Tab'
import Tabs from '@mui/material/Tabs'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useMyProfile } from '../features/portal/api'
import { useAuth } from '../features/auth/auth-context'
import { useLeaveRequests } from '../features/leave/api'
import LeaveRequestDialog from '../features/leave/leave-request-dialog'
import LeaveDetailDialog from '../features/leave/leave-detail-dialog'
import { leaveKindLabels,leaveStatusLabels,leaveStatusColors } from '../features/leave/leave-format'
import type { LeaveFilters } from '../features/leave/types'
import { formatCardDate } from '../features/employees/employee-attendance-format'
import { getToday } from '../features/organization/api'
import { getApiErrorMessage } from '../shared/api/api-error'
import PageHeader from '../shared/ui/page-header'
import PageLoading from '../shared/ui/page-loading'

export default function MyPermissionsPage() {
  const profile = useMyProfile()
  const { account } = useAuth()
  const [params,setParams] = useSearchParams()
  const selected = params.get('requestId')
  const [creating,setCreating] = useState(false)
  const [filters,setFilters] = useState<LeaveFilters>(() => { const today = getToday(); return { from: `${today.slice(0,4)}-01-01`,to: `${Number(today.slice(0,4))+1}-12-31`,scope: params.get('scope') === 'assigned' ? 'assigned' : 'own',page: 1,limit: 20 } })
  const requests = useLeaveRequests(filters)
  const canReview = account && ['employee','manager'].includes(account.role) && profile.data?.hasReports
  function select(id?: string) { setParams(current => { const next = new URLSearchParams(current); if (id) next.set('requestId',id); else next.delete('requestId'); return next }) }
  return <><PageHeader title="Mis permisos" description="Solicita un permiso y da seguimiento a su resolución."
    action={<Button variant="contained" disabled={!profile.data} onClick={() => setCreating(true)}>Solicitar permiso</Button>} />
    <Stack spacing={2}>
      {profile.isError && <Alert severity="error">{getApiErrorMessage(profile.error)}</Alert>}
      {canReview && <Tabs value={filters.scope} onChange={(_,scope: 'own' | 'assigned') => setFilters(current => ({ ...current,scope,page: 1 }))}>
        <Tab value="own" label="Mis solicitudes" /><Tab value="assigned" label="Por autorizar / mi equipo" />
      </Tabs>}
      <Paper variant="outlined" sx={{ p: 2 }}><Stack direction={{ xs: 'column',sm: 'row' }} spacing={2}>
        <TextField type="date" label="Desde" value={filters.from} slotProps={{ inputLabel: { shrink: true } }} onChange={event => { const from = event.target.value; if (from) setFilters(current => ({ ...current,from,to: current.to < from ? from : current.to,page: 1 })) }} />
        <TextField type="date" label="Hasta" value={filters.to} slotProps={{ inputLabel: { shrink: true } }} onChange={event => { const to = event.target.value; if (to) setFilters(current => ({ ...current,to,from: current.from > to ? to : current.from,page: 1 })) }} />
        <TextField select label="Estado" value={filters.status ?? ''} sx={{ minWidth: 180 }} onChange={event => setFilters(current => ({ ...current,status: event.target.value as LeaveFilters['status'] || undefined,page: 1 }))}>
          <MenuItem value="">Todos</MenuItem>{Object.entries(leaveStatusLabels).map(([status,label]) => <MenuItem key={status} value={status}>{label}</MenuItem>)}
        </TextField>
      </Stack></Paper>
      {requests.isError && <Alert severity="error">{getApiErrorMessage(requests.error)}</Alert>}
      {requests.isPending ? <PageLoading /> : <>
        {requests.data?.requests.map(request => <Paper key={request.id} variant="outlined" sx={{ p: 2.5 }}><Stack spacing={1}>
          <Stack direction="row" spacing={2} sx={{ alignItems: 'center',justifyContent: 'space-between',flexWrap: 'wrap',gap: 1 }}>
            <Typography variant="h3">{filters.scope === 'assigned' ? request.details.employeeName : leaveKindLabels[request.kind]}</Typography>
            <Chip size="small" variant="outlined" color={leaveStatusColors[request.status]} label={leaveStatusLabels[request.status]} />
          </Stack>
          <Typography variant="body2">{formatCardDate(request.from)} al {formatCardDate(request.to)} · {request.details.days.length} días laborables</Typography>
          <Typography variant="body2" color="text.secondary">{filters.scope === 'assigned' ? leaveKindLabels[request.kind] : `Jefe responsable: ${request.details.managerName}`}</Typography>
          <Button variant="outlined" sx={{ alignSelf: 'flex-start' }} onClick={() => select(request.id)}>Ver solicitud</Button>
        </Stack></Paper>)}
        {requests.data?.total === 0 && <Paper variant="outlined" sx={{ p: 3 }}><Typography>No hay solicitudes para estos filtros.</Typography></Paper>}
        {requests.data && requests.data.total > filters.limit && <Pagination page={requests.data.page} count={Math.ceil(requests.data.total / filters.limit)} onChange={(_,page) => setFilters(current => ({ ...current,page }))} />}
      </>}
    </Stack>
    {creating && profile.data && <LeaveRequestDialog selfProfile={profile.data} onClose={() => setCreating(false)} onCreated={id => { setCreating(false); select(id) }} />}
    {selected && <LeaveDetailDialog id={selected} onClose={() => select()} onCreated={select} />}
  </>
}
