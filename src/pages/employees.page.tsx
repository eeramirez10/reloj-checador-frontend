import AddRoundedIcon from '@mui/icons-material/AddRounded'
import CameraAltRoundedIcon from '@mui/icons-material/CameraAltRounded'
import RefreshRoundedIcon from '@mui/icons-material/RefreshRounded'
import SyncAltRoundedIcon from '@mui/icons-material/SyncAltRounded'
import Alert from '@mui/material/Alert'
import Avatar from '@mui/material/Avatar'
import Button from '@mui/material/Button'
import Checkbox from '@mui/material/Checkbox'
import Chip from '@mui/material/Chip'
import MenuItem from '@mui/material/MenuItem'
import Pagination from '@mui/material/Pagination'
import Paper from '@mui/material/Paper'
import Snackbar from '@mui/material/Snackbar'
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
import { useRef, useState } from 'react'
import { useDevices } from '../features/devices/hooks/use-devices'
import EmployeeClockDialog from '../features/employees/employee-clock-dialog'
import EmployeeActionsMenu, { type EmployeeActions } from '../features/employees/employee-actions-menu'
import EmployeeHistoryDialog from '../features/employees/employee-history-dialog'
import EmployeeIdentificationDialog from '../features/employees/employee-identification-dialog'
import { useEmployees } from '../features/employees/hooks/use-employees'
import type { Employee } from '../features/employees/types/employee'
import { getToday, useBranches, useScheduleAssignments, useSchedules } from '../features/organization/api'
import AssignmentDialog from '../features/organization/assignment-dialog'
import { EmployeeDialog } from '../features/organization/person-dialog'
import { useSyncDeviceUserPhotos } from '../features/synchronization/hooks/use-sync-device-user-photos'
import { useSyncDeviceUsers } from '../features/synchronization/hooks/use-sync-device-users'
import type { UserPhotoReference } from '../features/users/types/user-photo-reference'
import UserPhotoDialog, { UserPhotoAvatar } from '../features/users/user-photo-dialog/user-photo-dialog'
import { getApiErrorMessage } from '../shared/api/api-error'
import PageHeader from '../shared/ui/page-header'
import PageLoading from '../shared/ui/page-loading'

const pageSize = 25
type EmploymentStatusFilter = 'active' | 'inactive' | 'all'

function EmployeeStatus({ employee }: { employee: Employee }) {
  return <Stack spacing={0.5} sx={{ alignItems: 'flex-start' }}>
    {employee.identificationStatus === 'pending' && <Chip size="small" variant="outlined" color="warning" label="Pendiente de identificar" />}
    <Chip size="small" variant="outlined" color={employee.isActive ? 'success' : 'default'} label={employee.isActive ? 'Activo' : 'Dado de baja'} />
  </Stack>
}

function EmployeeIdentity({ employee, photoUser, onPhoto }: { employee: Employee; photoUser: UserPhotoReference | null; onPhoto: (photo: UserPhotoReference) => void }) {
  return <Stack direction="row" spacing={1.25} sx={{ alignItems: 'center', minWidth: 0 }}>
    {photoUser ? <UserPhotoAvatar user={photoUser} onClick={() => onPhoto(photoUser)} /> : <Avatar sx={{ width: 36, height: 36 }}>{employee.name.slice(0, 1)}</Avatar>}
    <Stack sx={{ minWidth: 0 }}><Typography variant="body2" sx={{ fontWeight: 500 }}>{employee.name}</Typography><Typography variant="caption" color="text.secondary">{employee.position || 'Puesto sin especificar'}</Typography>
      {employee.employeeNumber && <Typography variant="caption" color="text.secondary">Referencia de origen {employee.employeeNumber}</Typography>}
    </Stack>
  </Stack>
}

export default function EmployeesPage() {
  const employees = useEmployees({ limit: 500 })
  const devices = useDevices()
  const branches = useBranches()
  const schedules = useSchedules()
  const assignments = useScheduleAssignments()
  const employeeSync = useSyncDeviceUsers()
  const photos = useSyncDeviceUserPhotos()
  const [tab, setTab] = useState('confirmed')
  const [search, setSearch] = useState('')
  const [branchId, setBranchId] = useState('')
  const [deviceId, setDeviceId] = useState('')
  const [statusFilter, setStatusFilter] = useState<EmploymentStatusFilter>('active')
  const [page, setPage] = useState(1)
  const [selected, setSelected] = useState<Set<string>>(() => new Set())
  const [editing, setEditing] = useState<Employee | 'new' | null>(null)
  const [identifying, setIdentifying] = useState<Employee | null>(null)
  const [clockEmployee, setClockEmployee] = useState<Employee | null>(null)
  const [history, setHistory] = useState<Employee | null>(null)
  const [assignIds, setAssignIds] = useState<string[] | null>(null)
  const [photo, setPhoto] = useState<UserPhotoReference | null>(null)
  const [notice, setNotice] = useState<{ severity: 'success' | 'error'; message: string } | null>(null)
  const tableRef = useRef<HTMLDivElement>(null)
  const data = employees.data ?? []
  const statusFilteredEmployees = statusFilter === 'all' ? data : data.filter((employee) => employee.isActive === (statusFilter === 'active'))
  const scopedDevices = (devices.data ?? []).filter((device) => !branchId || device.branchId === branchId)
  const syncDeviceId = deviceId && deviceId !== 'unassigned' ? deviceId : scopedDevices.length === 1 ? scopedDevices[0].id : undefined
  const today = getToday()
  const normalized = search.trim().toLocaleLowerCase('es-MX')
  const filtered = statusFilteredEmployees.filter((employee) => {
    if (tab !== 'all' && employee.identificationStatus !== tab) return false
    if (branchId && (branchId === 'unassigned' ? Boolean(employee.branchId) : employee.branchId !== branchId)) return false
    const currentClock = employee.clockRecords.find((record) => record.bindingStatus === 'active')
    if (deviceId && (deviceId === 'unassigned' ? Boolean(currentClock) : currentClock?.deviceId !== deviceId)) return false
    return !normalized || [employee.name, employee.employeeNumber, employee.rfc, employee.imss, employee.position,
      ...employee.clockRecords.flatMap((record) => [record.userId, record.name, record.cardNumber])]
      .some((value) => value?.toLocaleLowerCase('es-MX').includes(normalized))
  })
  const visible = filtered.slice((page - 1) * pageSize, page * pageSize)
  const visibleRows = visible.map((employee) => {
    const clock = employee.clockRecords.find((record) => record.bindingStatus === 'active')
    const photoRecord = [clock, ...employee.clockRecords].find((record) => record?.hasPhoto)
    const photoUser = photoRecord ? { deviceId: photoRecord.deviceId, userId: photoRecord.userId, name: employee.name, hasPhoto: photoRecord.hasPhoto } : null
    const assignment = assignments.data?.find((item) => item.employeeId === employee.id && item.effectiveFrom <= today)
    const date = getToday(branches.data?.find((branch) => branch.id === employee.branchId)?.timeZone)
    const base = schedules.data?.find((item) => item.branchId === employee.branchId && item.isDefault && item.effectiveFrom <= date
      && (!item.supersededFrom || date < item.supersededFrom))
    const legacy = assignment?.scheduleId ? schedules.data?.find((item) => item.id === assignment.scheduleId) : undefined
    const role = employee.scheduling ? base : legacy ?? base
    const hours = employee.scheduling?.workHours ?? role?.settings
    const scheduleLabel = hours ? `${employee.scheduling?.workHours ? 'Individual' : role?.name ?? 'Jornada'} · ${hours.entryTime}–${hours.exitTime}` : 'Sin horario'
    return { employee, clock, photoUser, scheduleLabel }
  })
  const actions: EmployeeActions = { edit: setEditing, identify: setIdentifying, clock: setClockEmployee, assign: (employee) => setAssignIds([employee.id]), history: setHistory }
  const selectedEmployees = data.filter((employee) => selected.has(employee.id))
  const selectedPhotoRecords = selectedEmployees.map((employee) => employee.clockRecords.find((record) => record.bindingStatus === 'active' && record.deviceId === syncDeviceId))
  const canSyncPhotos = Boolean(syncDeviceId && selected.size > 0 && selected.size <= 25 && selectedPhotoRecords.every(Boolean))
  function resetSelection() { setPage(1); setSelected(new Set()); tableRef.current?.scrollTo({ left: 0 }) }
  function toggleEmployee(id: string, checked: boolean) { setSelected((current) => { const next = new Set(current); if (checked) next.add(id); else next.delete(id); return next }) }
  async function syncEmployees() {
    if (!syncDeviceId) return
    try {
      const result = await employeeSync.mutateAsync(syncDeviceId)
      setNotice({ severity: 'success', message: `Registros del reloj sincronizados: ${result.receivedCount}. Revisa los nuevos casos en Pendientes.` })
    } catch (error) { setNotice({ severity: 'error', message: getApiErrorMessage(error) }) }
  }
  async function syncPhotos() {
    if (!syncDeviceId || !canSyncPhotos) return
    try {
      const result = await photos.mutateAsync({ deviceId: syncDeviceId, userIds: selectedPhotoRecords.map((record) => record!.userId) })
      setNotice({ severity: 'success', message: `Fotos actualizadas: ${result.downloadedCount}. Sin foto: ${result.missingCount}.` })
      setSelected(new Set())
    } catch (error) { setNotice({ severity: 'error', message: getApiErrorMessage(error) }) }
  }
  return <>
    <PageHeader title="Empleados" description="Una sola ficha por persona: datos personales, sucursal, reloj, foto y horario."
      action={<Stack direction="row" spacing={1}><Button variant="outlined" disabled={employees.isFetching} startIcon={<RefreshRoundedIcon />} onClick={() => void employees.refetch()}>Actualizar</Button><Button variant="contained" startIcon={<AddRoundedIcon />} onClick={() => setEditing('new')}>Agregar empleado</Button></Stack>} />
    <Stack spacing={2}>
      {[employees, devices, branches, schedules, assignments].filter((query) => query.isError).map((query, index) => <Alert key={index} severity="error">{getApiErrorMessage(query.error)}</Alert>)}
      <Tabs value={tab} onChange={(_, value: string) => { setTab(value); resetSelection() }} aria-label="Identificación de empleados" variant="scrollable" allowScrollButtonsMobile>
        <Tab value="confirmed" label={`Empleados (${statusFilteredEmployees.filter((employee) => employee.identificationStatus === 'confirmed').length})`} />
        <Tab value="pending" label={`Pendientes de identificar (${statusFilteredEmployees.filter((employee) => employee.identificationStatus === 'pending').length})`} />
        <Tab value="all" label={`Todos (${statusFilteredEmployees.length})`} />
      </Tabs>
      <Paper variant="outlined" sx={{ p: 2 }}><Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
        <TextField fullWidth size="small" label="Buscar empleado" placeholder="Nombre, ID del reloj, RFC, NSS o tarjeta" value={search} onChange={(event) => { setSearch(event.target.value); setPage(1) }} />
        <TextField fullWidth select size="small" label="Sucursal" sx={{ maxWidth: { md: 250 } }} value={branchId} onChange={(event) => { setBranchId(event.target.value); setDeviceId(''); resetSelection() }}>
          <MenuItem value="">Todas las sucursales</MenuItem><MenuItem value="unassigned">Sin asignar</MenuItem>{(branches.data ?? []).map((branch) => <MenuItem key={branch.id} value={branch.id}>{branch.name}</MenuItem>)}
        </TextField>
        <TextField fullWidth select size="small" label="Reloj asignado" sx={{ maxWidth: { md: 280 } }} value={deviceId} onChange={(event) => { setDeviceId(event.target.value); resetSelection() }}>
          <MenuItem value="">Todos los relojes</MenuItem><MenuItem value="unassigned">Sin reloj asignado</MenuItem>{scopedDevices.map((device) => <MenuItem key={device.id} value={device.id}>{device.name}</MenuItem>)}
        </TextField>
        <TextField fullWidth select size="small" label="Estado" sx={{ maxWidth: { md: 180 } }} value={statusFilter} onChange={(event) => { setStatusFilter(event.target.value as EmploymentStatusFilter); resetSelection() }}>
          <MenuItem value="active">Activos</MenuItem><MenuItem value="inactive">Inactivos</MenuItem><MenuItem value="all">Todos los estados</MenuItem>
        </TextField>
      </Stack>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ mt: 2 }}>
          <Button disabled={!syncDeviceId || employeeSync.isPending} startIcon={<SyncAltRoundedIcon />} onClick={() => void syncEmployees()}>{employeeSync.isPending ? 'Sincronizando…' : 'Sincronizar empleados del reloj'}</Button>
          <Typography variant="caption" color="text.secondary" sx={{ alignSelf: 'center' }}>Selecciona una sucursal con un solo reloj o el reloj que deseas consultar.</Typography>
        </Stack>
      </Paper>
      {tab === 'pending' && <Alert severity="info">Estos registros se conservaron con sus checadas y fotos. Completa su identidad o asígnalos a un empleado existente; sus nombres no se comparan automáticamente.</Alert>}
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ justifyContent: 'space-between', alignItems: { sm: 'center' } }}>
        <Typography variant="body2" color="text.secondary">{filtered.length} personas · {selected.size} seleccionadas</Typography>
        <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap' }}>
          <Button disabled={!selected.size} onClick={() => setAssignIds([...selected])}>Asignar sucursal / horario</Button>
          <Button disabled={!canSyncPhotos || photos.isPending} startIcon={<CameraAltRoundedIcon />} onClick={() => void syncPhotos()}>{photos.isPending ? 'Descargando…' : 'Sincronizar fotos'}</Button>
          <Button disabled={!selected.size} onClick={() => setSelected(new Set())}>Limpiar selección</Button>
        </Stack>
      </Stack>
      {employees.isPending ? <PageLoading /> : <>
        <TableContainer ref={tableRef} component={Paper} variant="outlined" sx={{ display: { xs: 'none', md: 'block' } }}><Table aria-label="Directorio unificado de empleados" sx={{ minWidth: 1200 }}>
          <TableHead><TableRow>
            <TableCell padding="checkbox" sx={{ position: 'sticky', left: 0, zIndex: 2, bgcolor: 'background.paper' }}><Checkbox slotProps={{ input: { 'aria-label': 'Seleccionar página de empleados' } }} checked={visible.length > 0 && visible.every((employee) => selected.has(employee.id))} indeterminate={visible.some((employee) => selected.has(employee.id)) && !visible.every((employee) => selected.has(employee.id))}
              onChange={(event) => setSelected((current) => { const next = new Set(current); for (const employee of visible) { if (event.target.checked) next.add(employee.id); else next.delete(employee.id) } return next })} /></TableCell>
            <TableCell sx={{ position: 'sticky', left: 48, zIndex: 2, bgcolor: 'background.paper' }}>Empleado</TableCell><TableCell>RFC / NSS</TableCell><TableCell>Sucursal</TableCell><TableCell>Reloj / ID</TableCell><TableCell>Horario</TableCell><TableCell>Estatus</TableCell><TableCell>Acciones</TableCell>
          </TableRow></TableHead>
          <TableBody>{visibleRows.map(({ employee, clock, photoUser, scheduleLabel }) => {
            return <TableRow hover key={employee.id}>
              <TableCell padding="checkbox" sx={{ position: 'sticky', left: 0, zIndex: 1, bgcolor: 'background.paper' }}><Checkbox checked={selected.has(employee.id)} slotProps={{ input: { 'aria-label': `Seleccionar ${employee.name}` } }} onChange={(event) => toggleEmployee(employee.id, event.target.checked)} /></TableCell>
              <TableCell sx={{ minWidth: 240, position: 'sticky', left: 48, zIndex: 1, bgcolor: 'background.paper' }}><EmployeeIdentity employee={employee} photoUser={photoUser} onPhoto={setPhoto} /></TableCell>
              <TableCell><Stack><Typography variant="body2">{employee.rfc || '—'}</Typography><Typography variant="caption" color="text.secondary">{employee.imss || '—'}</Typography></Stack></TableCell>
              <TableCell>{employee.branchName || 'Sin asignar'}</TableCell>
              <TableCell>{clock ? <Stack><Typography variant="body2">{clock.deviceName}</Typography><Typography variant="caption" color="text.secondary">ID {clock.userId}</Typography></Stack> : 'Sin reloj asignado'}</TableCell>
              <TableCell>{scheduleLabel}</TableCell>
              <TableCell><EmployeeStatus employee={employee} /></TableCell>
              <TableCell><EmployeeActionsMenu employee={employee} actions={actions} /></TableCell>
            </TableRow>
          })}{!visible.length && <TableRow><TableCell colSpan={8}>No hay empleados con estos filtros. Agrega una ficha o sincroniza los registros de un reloj.</TableCell></TableRow>}</TableBody>
        </Table></TableContainer>
        <Stack spacing={1.5} sx={{ display: { xs: 'flex', md: 'none' } }}>
          {visibleRows.map(({ employee, clock, photoUser, scheduleLabel }) => <Paper key={employee.id} variant="outlined" sx={{ p: 2 }}>
            <Stack spacing={1.25}>
              <Stack direction="row" spacing={0.5} sx={{ alignItems: 'flex-start' }}>
                <Checkbox checked={selected.has(employee.id)} slotProps={{ input: { 'aria-label': `Seleccionar ${employee.name}` } }} onChange={(event) => toggleEmployee(employee.id, event.target.checked)} />
                <EmployeeIdentity employee={employee} photoUser={photoUser} onPhoto={setPhoto} />
              </Stack>
              <EmployeeStatus employee={employee} />
              <Typography variant="body2">Sucursal: {employee.branchName || 'Sin asignar'}</Typography>
              <Typography variant="body2">Reloj: {clock ? `${clock.deviceName}, ID ${clock.userId}` : 'Sin reloj asignado'}</Typography>
              <Typography variant="caption" color="text.secondary">Horario: {scheduleLabel}</Typography>
              <Typography variant="caption" color="text.secondary">RFC: {employee.rfc || '—'}. NSS: {employee.imss || '—'}.</Typography>
              <EmployeeActionsMenu employee={employee} actions={actions} />
            </Stack>
          </Paper>)}
          {!visibleRows.length && <Paper variant="outlined" sx={{ p: 3 }}>No hay empleados con estos filtros.</Paper>}
        </Stack>
        {filtered.length > pageSize && <Pagination sx={{ alignSelf: 'center' }} page={page} count={Math.ceil(filtered.length / pageSize)} onChange={(_, value) => setPage(value)} />}
      </>}
    </Stack>
    {editing && <EmployeeDialog employee={editing === 'new' ? undefined : editing} onClose={() => setEditing(null)} />}
    {identifying && <EmployeeIdentificationDialog employee={identifying} employees={data} onClose={() => setIdentifying(null)} />}
    {clockEmployee && <EmployeeClockDialog employee={clockEmployee} employees={data} onClose={() => setClockEmployee(null)} />}
    {history && <EmployeeHistoryDialog employee={history} onClose={() => setHistory(null)} />}
    {assignIds && <AssignmentDialog title="Asignar sucursal y horario" targets={{ employeeIds: assignIds }} onClose={() => { setAssignIds(null); setSelected(new Set()) }} />}
    <UserPhotoDialog key={photo ? `${photo.deviceId}:${photo.userId}` : 'closed'} user={photo} onClose={() => setPhoto(null)} />
    <Snackbar open={Boolean(notice)} autoHideDuration={6000} onClose={() => setNotice(null)}>{notice ? <Alert severity={notice.severity} onClose={() => setNotice(null)}>{notice.message}</Alert> : <span />}</Snackbar>
  </>
}
