import AccessTimeRoundedIcon from '@mui/icons-material/AccessTimeRounded'
import RefreshRoundedIcon from '@mui/icons-material/RefreshRounded'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import CircularProgress from '@mui/material/CircularProgress'
import FormControl from '@mui/material/FormControl'
import InputLabel from '@mui/material/InputLabel'
import MenuItem from '@mui/material/MenuItem'
import Paper from '@mui/material/Paper'
import Select from '@mui/material/Select'
import Stack from '@mui/material/Stack'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import { useState } from 'react'
import { Link as RouterLink } from 'react-router-dom'
import { useAttendance } from '../features/attendance/hooks/use-attendance'
import type { AttendanceLog } from '../features/attendance/types/attendance-log'
import { getZonedDayRange } from '../features/attendance/utils/zoned-day-range'
import { useDevices } from '../features/devices/hooks/use-devices'
import UserPhotoDialog, { UserPhotoAvatar } from '../features/users/user-photo-dialog/user-photo-dialog'
import type { UserPhotoReference } from '../features/users/types/user-photo-reference'
import { getApiErrorMessage } from '../shared/api/api-error'
import PageHeader from '../shared/ui/page-header'
import PageLoading from '../shared/ui/page-loading'
import { getToday, useBranches, useDailyAttendance } from '../features/organization/api'
import { movementLabels } from '../features/organization/attendance-labels'
import type { Movement } from '../features/organization/types'
import { defaultTimeZone, getTimeZoneLabel } from '../features/organization/time-zones'

const localDayFormatter = new Intl.DateTimeFormat('es-MX', {
  timeZone: 'UTC',
  dateStyle: 'full',
})

const punchStateLabels: Record<number, string> = {
  0: 'Entrada',
  1: 'Salida',
  2: 'Salida a descanso',
  3: 'Regreso de descanso',
  4: 'Entrada de tiempo extra',
  5: 'Salida de tiempo extra',
}

function getMovementColor(movement: Movement | undefined): 'default' | 'success' | 'warning' | 'error' {
  if (movement === 'entry' || movement === 'meal_return') return 'success'
  if (movement === 'exit' || movement === 'meal_departure') return 'warning'
  if (movement === 'outside_schedule' || movement === 'unclassified') return 'error'
  return 'default'
}

function getLocalDayLabel(date: string): string {
  return localDayFormatter.format(new Date(`${date}T12:00:00.000Z`))
}

function getLocalTime(log: AttendanceLog, timeZone: string): string {
  if (typeof log.occurredAtLocal === 'string' && log.occurredAtLocal.trim()) {
    return log.occurredAtLocal.split(' ').slice(1).join(' ') || '—'
  }
  const date = new Date(log.occurredAt)
  return Number.isNaN(date.getTime())
    ? 'Hora no disponible'
    : new Intl.DateTimeFormat('es-MX', {
      timeZone,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }).format(date)
}

function groupLogsByDay(logs: AttendanceLog[]): Array<[string, AttendanceLog[]]> {
  const groups = new Map<string, AttendanceLog[]>()
  for (const log of logs) {
    const day = log.occurredAtLocal?.slice(0, 10) || 'Fecha no disponible'
    const dayLogs = groups.get(day) ?? []
    dayLogs.push(log)
    groups.set(day, dayLogs)
  }
  return [...groups.entries()].sort(([left], [right]) => right.localeCompare(left))
}

type AttendanceDayProps = {
  date: string
  logs: AttendanceLog[]
  deviceNames: Map<string, string>
  onOpenPhoto: (user: UserPhotoReference) => void
  movements: Map<string, Movement>
  timeZone: string
}

function AttendanceDay({ date, logs, deviceNames, onOpenPhoto, movements, timeZone }: AttendanceDayProps) {
  return (
    <Paper variant="outlined" sx={{ overflow: 'hidden' }}>
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={0.75}
        sx={{ alignItems: { xs: 'flex-start', sm: 'center' }, justifyContent: 'space-between', p: 2, borderBottom: 1, borderColor: 'divider' }}
      >
        <Typography component="h2" variant="h3">{getLocalDayLabel(date)}</Typography>
        <Typography color="text.secondary" variant="body2">
          {logs.length} {logs.length === 1 ? 'checada' : 'checadas'}
        </Typography>
      </Stack>

      <TableContainer>
        <Table aria-label={`Checadas del ${date}`} sx={{ minWidth: 740 }}>
          <TableHead>
            <TableRow sx={{ bgcolor: 'background.default' }}>
              <TableCell>Hora</TableCell>
              <TableCell>Persona</TableCell>
              <TableCell>Reloj</TableCell>
              <TableCell>Movimiento</TableCell>
              <TableCell>Verificación</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {logs.map((log) => {
              const photoUser = {
                deviceId: log.deviceId,
                userId: log.userId,
                name: log.userName,
                hasPhoto: log.userHasPhoto,
              }

              return (
                <TableRow hover key={log.id}>
                  <TableCell>
                    <Typography sx={{ fontWeight: 500 }} variant="body2">{getLocalTime(log, timeZone)}</Typography>
                  </TableCell>
                  <TableCell>
                    <Stack direction="row" spacing={1.25} sx={{ alignItems: 'center' }}>
                      <UserPhotoAvatar user={photoUser} onClick={() => onOpenPhoto(photoUser)} />
                      <Stack spacing={0.35}>
                        <Typography sx={{ fontWeight: 500 }} variant="body2">
                          {log.userName || 'Sin nombre'}
                        </Typography>
                         <Typography color="text.secondary" variant="caption">
                           {log.employeeNumber ? `Empleado ${log.employeeNumber} · ID reloj ${log.userId}` : `ID reloj ${log.userId}`}
                         </Typography>
                         {log.employeePosition && (
                           <Typography color="text.secondary" variant="caption">{log.employeePosition}</Typography>
                         )}
                      </Stack>
                    </Stack>
                  </TableCell>
                   <TableCell><Stack><Typography variant="body2">{deviceNames.get(log.deviceId) ?? 'Reloj no disponible'}</Typography><Typography variant="caption" color="text.secondary">{log.branchName || 'Sin sucursal'}</Typography></Stack></TableCell>
                  <TableCell>
                    <Chip
                      color={getMovementColor(movements.get(log.id))}
                      label={movements.has(log.id) ? movementLabels[movements.get(log.id)!] : 'Pendiente de clasificación'}
                      size="small"
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell><Stack><Typography variant="body2">{log.verificationType === undefined ? '—' : `Método ${log.verificationType}`}</Typography>
                    <Typography variant="caption" color="text.secondary">Marcado en reloj: {log.punchState === undefined ? 'Sin estado' : punchStateLabels[log.punchState] ?? `Estado ${log.punchState}`}</Typography></Stack></TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  )
}

function AttendancePage() {
  const branches = useBranches()
  const [branchId, setBranchId] = useState('')
  const [deviceId, setDeviceId] = useState('')
  const [userId, setUserId] = useState('')
  const [search, setSearch] = useState('')
  const [selectedDate, setSelectedDate] = useState(getToday)
  const daily = useDailyAttendance({ from: selectedDate, to: selectedDate })
  const movements = new Map((daily.data ?? []).flatMap((day) => day.result.punches.map((punch) => [punch.id, punch.movement] as const)))
  const [photoUser, setPhotoUser] = useState<UserPhotoReference | null>(null)
  const devices = useDevices()
  const selectedDevice = devices.data?.find((device) => device.id === deviceId)
  const selectedBranch = branches.data?.find((branch) => branch.id === (branchId || selectedDevice?.branchId))
  const timeZone = selectedBranch?.timeZone ?? selectedDevice?.timeZone ?? defaultTimeZone
  const timeZoneLabel = getTimeZoneLabel(timeZone, new Date(`${selectedDate}T12:00:00Z`))
  const dayRange = getZonedDayRange(selectedDate, timeZone)
  const attendance = useAttendance({
    branchId: branchId || undefined,
    deviceId: deviceId || undefined,
    userId: userId.trim() || undefined,
    from: dayRange.from,
    to: dayRange.to,
    timeZone,
    limit: 500,
  })
  const deviceNames = new Map((devices.data ?? []).map((device) => [device.id, device.name]))
  const normalizedSearch = search.trim().toLocaleLowerCase('es-MX')
  const filteredLogs = (attendance.data ?? []).filter((log) => (
    (!branchId || log.branchId === branchId) && (!normalizedSearch
     || `${log.userName ?? ''} ${log.employeeNumber ?? ''} ${log.employeePosition ?? ''} ${log.userId}`.toLocaleLowerCase('es-MX').includes(normalizedSearch))
  ))
  const groupedLogs = groupLogsByDay(filteredLogs)

  function updateFilters(nextBranchId: string, nextDeviceId: string) {
    const device = devices.data?.find((item) => item.id === nextDeviceId)
    const branch = branches.data?.find((item) => item.id === (nextBranchId || device?.branchId))
    const nextTimeZone = branch?.timeZone ?? device?.timeZone ?? defaultTimeZone
    if (selectedDate === getToday(timeZone)) setSelectedDate(getToday(nextTimeZone))
    setBranchId(nextBranchId)
    setDeviceId(nextDeviceId)
  }

  return (
    <>
      <PageHeader
        action={
          <Button
            disabled={attendance.isFetching}
            onClick={() => { void attendance.refetch(); void daily.refetch() }}
            startIcon={attendance.isFetching ? <CircularProgress color="inherit" size={16} /> : <RefreshRoundedIcon />}
            variant="outlined"
          >
            Actualizar
          </Button>
        }
        description={`Elige un día para ver sus checadas agrupadas. Horas en ${timeZoneLabel}.`}
        title="Checadas"
      />

      <Stack spacing={2}>
        {attendance.isError && (
          <Alert
            action={<Button color="inherit" onClick={() => void attendance.refetch()} size="small">Reintentar</Button>}
            severity={attendance.data ? 'warning' : 'error'}
          >
            {attendance.data
              ? 'No se pudo actualizar la lista; se muestran los últimos datos disponibles.'
              : getApiErrorMessage(attendance.error)}
          </Alert>
        )}

        <Paper sx={{ p: 2 }} variant="outlined">
          <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', md: 'repeat(4, minmax(0, 1fr))' } }}>
            <TextField
              fullWidth
              label="Fecha"
              onChange={(event) => setSelectedDate(event.target.value || getToday(timeZone))}
              slotProps={{ inputLabel: { shrink: true } }}
              size="small"
              type="date"
              value={selectedDate}
            />
            <FormControl fullWidth size="small">
              <InputLabel id="attendance-device-filter-label">Reloj</InputLabel>
              <Select
                label="Reloj"
                labelId="attendance-device-filter-label"
                onChange={(event) => updateFilters(branchId, event.target.value)}
                value={deviceId}
              >
                <MenuItem value="">Todos los relojes</MenuItem>
                {(devices.data ?? []).filter((device) => !branchId || device.branchId === branchId).map((device) => (
                  <MenuItem key={device.id} value={device.id}>{device.name}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              fullWidth
              label="ID en el reloj"
              onChange={(event) => setUserId(event.target.value)}
              placeholder="Por ejemplo: 1008"
              size="small"
              value={userId}
            />
            <TextField
              fullWidth
              label="Buscar persona"
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Nombre o ID"
              size="small"
              value={search}
            />
          </Box>
          <TextField select size="small" label="Sucursal donde checó" value={branchId} onChange={(event) => {
            const nextBranchId = event.target.value
            const nextDeviceId = nextBranchId && selectedDevice?.branchId !== nextBranchId ? '' : deviceId
            updateFilters(nextBranchId, nextDeviceId)
          }} sx={{ mt: 2, minWidth: 260 }}>
            <MenuItem value="">Todas las sucursales</MenuItem>
            {(branches.data ?? []).map((branch) => <MenuItem key={branch.id} value={branch.id}>{branch.name}</MenuItem>)}
          </TextField>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
            {branchId || deviceId ? 'Se usa la zona horaria configurada en la sucursal.' : 'Selecciona una sucursal o un reloj para consultar sus horas locales.'}
          </Typography>
        </Paper>

        {attendance.isPending ? (
          <PageLoading />
        ) : attendance.isError && !attendance.data ? null : groupedLogs.length === 0 ? (
          <Paper variant="outlined" sx={{ display: 'grid', minHeight: 300, placeItems: 'center', p: 3 }}>
            <Stack spacing={1.5} sx={{ alignItems: 'center', maxWidth: 440, textAlign: 'center' }}>
              <AccessTimeRoundedIcon color="primary" sx={{ fontSize: 38 }} />
              <Typography component="h2" variant="h3">
                {attendance.data?.length ? 'No hay coincidencias' : 'No hay checadas para este día'}
              </Typography>
              <Typography color="text.secondary" variant="body2">
                {attendance.data?.length
                  ? 'Prueba con otro reloj, ID de empleado en el reloj o nombre.'
                  : 'Elige otra fecha o sincroniza un reloj para consultar sus registros.'}
              </Typography>
              {!attendance.data?.length && (
                <Button component={RouterLink} to="/devices" variant="outlined">
                  Ir a dispositivos
                </Button>
              )}
            </Stack>
          </Paper>
        ) : (
          <Stack spacing={2}>
            {groupedLogs.map(([date, logs]) => (
              <AttendanceDay
                date={date}
                deviceNames={deviceNames}
                key={date}
                 logs={logs}
                  movements={movements}
                 timeZone={timeZone}
                onOpenPhoto={setPhotoUser}
              />
            ))}
            <Typography color="text.secondary" sx={{ textAlign: 'center' }} variant="caption">
              Máximo 500 checadas por día
            </Typography>
          </Stack>
        )}
      </Stack>

      <UserPhotoDialog
        key={photoUser?.userId ?? 'closed'}
        onClose={() => setPhotoUser(null)}
        user={photoUser}
      />
    </>
  )
}

export default AttendancePage
