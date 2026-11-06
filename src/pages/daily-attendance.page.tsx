import RefreshRoundedIcon from '@mui/icons-material/RefreshRounded'
import Alert from '@mui/material/Alert'
import Avatar from '@mui/material/Avatar'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import MenuItem from '@mui/material/MenuItem'
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
import { getToday, recalculateAttendance, useBranches, useDailyAttendance, useDeductions, useOrganizationMutation } from '../features/organization/api'
import { dailyStatusLabels, formatAttendanceTime, movementLabels } from '../features/organization/attendance-labels'
import type { DailyAttendance } from '../features/organization/types'
import { defaultTimeZone, getTimeZoneLabel } from '../features/organization/time-zones'
import type { UserPhotoReference } from '../features/users/types/user-photo-reference'
import UserPhotoDialog, { UserPhotoAvatar } from '../features/users/user-photo-dialog/user-photo-dialog'
import { getApiErrorMessage } from '../shared/api/api-error'
import PageHeader from '../shared/ui/page-header'
import PageLoading from '../shared/ui/page-loading'
import RouteDetails from '../features/attendance/route-details'
import { formatOvertime } from '../features/attendance/overtime-format'
import { leaveAuthorizationText } from '../features/leave/leave-format'
import { usePermissions } from '../features/auth/auth-context'

function DayDetails({ day, onClose }: { day: DailyAttendance; onClose: () => void }) {
  return <Dialog open fullWidth maxWidth="md" onClose={onClose}>
    <DialogTitle>{day.result.name} · {day.date}</DialogTitle>
    <DialogContent dividers>
      <Stack spacing={2}>
        <Typography variant="body2">{day.result.branchName || 'Sin sucursal'} · {day.result.scheduleName || 'Sin horario'} · {day.result.timeZone}</Typography>
        <RouteDetails routes={day.result.routes} />
        {day.result.overtime && <Typography variant="body2">Horas extras netas: {day.result.overtime.status === 'calculated' ? formatOvertime(day.result.overtime.netSeconds) : day.result.overtime.issue ?? 'Pendientes'}.</Typography>}
        {day.result.scheduleSettings && <Typography variant="body2">Jornada {day.result.scheduleSettings.entryTime}–{day.result.scheduleSettings.exitTime} ({day.result.scheduleSource === 'branch' ? 'sucursal' : 'individual'}). Margen de reconocimiento: {day.result.scheduleSettings.recognitionMarginMinutes ?? 30} minutos.</Typography>}
        {day.result.policyConfigured === false && <Alert severity="info">La jornada se identifica por horarios. No hay reglas de retardos vigentes para esta fecha; no se generan sanciones de esa política.</Alert>}
        {day.result.mealDetection === 'automatic' && <Alert severity="info">Comida detectada automáticamente por las checadas, sin horario fijo ni retardos de comida.</Alert>}
        {day.result.mealDetection === 'configured' && day.result.scheduleSettings && <Typography variant="body2">Comida {day.result.scheduleSettings.mealSource === 'branch' ? 'de sucursal' : 'individual'}: {day.result.scheduleSettings.mealStart}–{day.result.scheduleSettings.mealEnd}, {day.result.scheduleSettings.mealDurationMinutes} minutos.</Typography>}
        {day.result.issues.map((issue) => <Alert key={issue} severity="warning">{issue}</Alert>)}
        {day.result.leaveAuthorizations?.map((leave) => <Alert key={leave.requestId} severity="info">{leaveAuthorizationText(leave)}</Alert>)}
        {day.result.incidents.map((incident) => <Alert key={incident.kind} severity="warning">{incident.kind === 'arrival' ? 'Llegada tarde' : incident.kind === 'meal_departure' ? 'Salida a comer fuera de rango' : 'Regreso de comida tarde'}: {incident.minutes} minutos respecto a la hora prevista.</Alert>)}
        <Table size="small" aria-label="Detalle de movimientos"><TableHead><TableRow><TableCell>Fecha y hora local</TableCell><TableCell>Movimiento identificado</TableCell></TableRow></TableHead>
          <TableBody>{day.result.punches.map((punch) => <TableRow key={punch.id}><TableCell>{punch.localTime}</TableCell><TableCell>{movementLabels[punch.movement]}</TableCell></TableRow>)}</TableBody></Table>
        <Typography variant="body2" color="text.secondary">Tiempo trabajado: {day.result.workedMinutes === undefined ? 'Pendiente de completar movimientos' : `${Math.floor(day.result.workedMinutes / 60)} h ${day.result.workedMinutes % 60} min`}.</Typography>
        {day.result.policy && <Typography variant="body2" color="text.secondary">Tolerancia de entrada: {day.result.policy.entryToleranceMinutes} min. Descuento al superar {day.result.policy.entryAllowedTardies} retardos de llegada.
          {day.result.mealDetection === 'configured' && ` Tolerancia de comida: ${day.result.policy.mealToleranceMinutes} min. Descuento al superar ${day.result.policy.mealAllowedTardies} retardos de comida.`}</Typography>}
      </Stack>
    </DialogContent><DialogActions><Button onClick={onClose}>Cerrar</Button></DialogActions>
  </Dialog>
}

export default function DailyAttendancePage() {
  const { isAdmin } = usePermissions()
  const [from, setFrom] = useState(getToday)
  const [to, setTo] = useState(getToday)
  const [branchId, setBranchId] = useState('')
  const [search, setSearch] = useState('')
  const [tab, setTab] = useState(0)
  const [detail, setDetail] = useState<DailyAttendance | null>(null)
  const [photo, setPhoto] = useState<UserPhotoReference | null>(null)
  const branches = useBranches()
  const timeZone = branches.data?.find((branch) => branch.id === branchId)?.timeZone ?? defaultTimeZone
  const filters = { from, to, branchId: branchId || undefined }
  const days = useDailyAttendance(filters)
  const deductions = useDeductions(filters)
  const refresh = useOrganizationMutation(recalculateAttendance)
  const normalized = search.trim().toLocaleLowerCase('es-MX')
  const visible = (days.data ?? []).filter((day) => !normalized || `${day.result.name} ${day.result.employeeNumber ?? ''} ${day.result.userIds.join(' ')}`.toLocaleLowerCase('es-MX').includes(normalized))
  const visibleDeductions = (deductions.data ?? []).filter((deduction) => !normalized || deduction.name.toLocaleLowerCase('es-MX').includes(normalized))
  return <>
    <PageHeader title="Asistencia diaria" description="Consulta la jornada identificada automáticamente, los retardos acumulados y los días de descuento registrados."
      action={isAdmin ? <Button disabled={refresh.isPending} variant="outlined" startIcon={<RefreshRoundedIcon />} onClick={() => refresh.mutate(undefined)}>{refresh.isPending ? 'Calculando…' : 'Actualizar cálculo'}</Button> : undefined} />
    <Stack spacing={2}>
      {[days, deductions, refresh].filter((query) => query.isError).map((query, index) => <Alert key={index} severity="error">{getApiErrorMessage(query.error)}</Alert>)}
      <Paper variant="outlined" sx={{ p: 2 }}><Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
        <TextField required size="small" type="date" label="Desde" value={from} onChange={(event) => { const value = event.target.value || getToday(timeZone); setFrom(value); if (value > to) setTo(value) }} slotProps={{ inputLabel: { shrink: true } }} sx={{ minWidth: { md: 170 }, flexShrink: 0 }} />
        <TextField required size="small" type="date" label="Hasta" value={to} onChange={(event) => { const value = event.target.value || getToday(timeZone); setTo(value); if (value < from) setFrom(value) }} slotProps={{ inputLabel: { shrink: true } }} sx={{ minWidth: { md: 170 }, flexShrink: 0 }} />
        <TextField fullWidth select size="small" label="Sucursal" value={branchId} onChange={(event) => {
          const nextBranchId = event.target.value
          const nextTimeZone = branches.data?.find((branch) => branch.id === nextBranchId)?.timeZone ?? defaultTimeZone
          if (from === getToday(timeZone) && to === getToday(timeZone)) {
            const date = getToday(nextTimeZone)
            setFrom(date)
            setTo(date)
          }
          setBranchId(nextBranchId)
        }} sx={{ maxWidth: { md: 280 } }}>
          <MenuItem value="">Todas las sucursales</MenuItem>{(branches.data ?? []).map((branch) => <MenuItem key={branch.id} value={branch.id}>{branch.name}</MenuItem>)}
        </TextField>
        <TextField fullWidth size="small" label="Buscar persona" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Nombre, empleado o ID del reloj" />
      </Stack></Paper>
      <Typography variant="caption" color="text.secondary">{branchId ? `Horas en ${getTimeZoneLabel(timeZone)}.` : 'Cada jornada se muestra en la hora local de su sucursal.'}</Typography>
      <Tabs value={tab} onChange={(_, value: number) => setTab(value)} aria-label="Tipo de reporte"><Tab label={`Jornadas (${visible.length})`} /><Tab label={`Descuentos (${visibleDeductions.filter((item) => !item.voidedAt).length})`} /></Tabs>
      {days.isPending || deductions.isPending ? <PageLoading /> : tab === 0 ? <>
        <TableContainer component={Paper} variant="outlined"><Table aria-label="Resumen diario de asistencia" sx={{ minWidth: 1350 }}>
          <TableHead><TableRow><TableCell>Fecha / persona</TableCell><TableCell>Entrada</TableCell><TableCell>Salida a comer</TableCell><TableCell>Regreso de comida</TableCell><TableCell>Salida</TableCell><TableCell>Estatus</TableCell><TableCell>Retardos del día</TableCell><TableCell>Acumulados llegada / comida</TableCell><TableCell>Descuento</TableCell><TableCell>Detalle</TableCell></TableRow></TableHead>
          <TableBody>{visible.map((day) => {
            const result = day.result
            const photoUser = day.photo ? { ...day.photo, name: result.name } : null
            const time = (value?: string) => formatAttendanceTime(value, result.timeZone)
            return <TableRow hover key={day.id}>
              <TableCell><Stack direction="row" spacing={1.25} sx={{ alignItems: 'center' }}>
                {photoUser ? <UserPhotoAvatar user={photoUser} onClick={() => setPhoto(photoUser)} /> : <Avatar sx={{ width: 36, height: 36 }}>{result.name.slice(0, 1)}</Avatar>}
                <Stack><Typography variant="caption" color="text.secondary">{day.date} · {result.branchName || 'Sin sucursal'}</Typography><Typography variant="body2" sx={{ fontWeight: 500 }}>{result.name}</Typography><Typography variant="caption" color="text.secondary">{result.employeeNumber ? `Empleado ${result.employeeNumber}` : `ID reloj ${result.userIds.join(', ')}`}</Typography></Stack>
              </Stack></TableCell>
              <TableCell>{time(result.entry)}</TableCell><TableCell>{time(result.mealDeparture)}</TableCell>
              <TableCell><Stack><Typography variant="body2">{time(result.mealReturn)}</Typography>{result.expectedMealReturn && <Typography variant="caption" color="text.secondary">Previsto {time(result.expectedMealReturn)}</Typography>}{result.mealMinutes !== undefined && <Typography variant="caption" color="text.secondary">{result.mealMinutes} min</Typography>}</Stack></TableCell>
              <TableCell>{time(result.exit)}</TableCell>
              <TableCell><Stack spacing={0.5} sx={{ alignItems: 'flex-start' }}><Chip size="small" variant="outlined" color={result.status === 'complete' ? 'success' : result.status === 'ambiguous' || result.status === 'incomplete' ? 'warning' : 'default'} label={result.status === 'unconfigured' && result.scheduleSettings?.mealPending ? 'Revisar comida individual' : dailyStatusLabels[result.status]} />
                {result.leaveAuthorizations?.length && result.status !== 'authorized_absence' ? <Chip size="small" color="info" variant="outlined" label="Con permiso" /> : null}
                {result.routes?.length ? <Typography variant="caption" color="text.secondary">En ruta</Typography> : result.mealDetection === 'automatic' && <Typography variant="caption" color="text.secondary">Comida automática</Typography>}</Stack></TableCell>
              <TableCell>{result.incidents.length ? <Chip size="small" color="warning" label={result.incidents.length} /> : '0'}</TableCell>
              <TableCell>{result.counters.arrival} / {result.counters.meal}</TableCell><TableCell>{result.deductionDays ? `${result.deductionDays} día(s)` : '—'}</TableCell>
              <TableCell><Button size="small" onClick={() => setDetail(day)}>Ver</Button></TableCell>
            </TableRow>
          })}{!visible.length && <TableRow><TableCell colSpan={10}>No hay jornadas para estos filtros. Elige otra fecha o sincroniza un reloj.</TableCell></TableRow>}</TableBody>
        </Table></TableContainer>
        <Typography variant="caption" color="text.secondary">Los acumulados muestran el cierre de cada jornada. Los grupos completados se consumen al registrar el descuento; las checadas incompletas conservan sus movimientos pendientes.</Typography>
      </> : <TableContainer component={Paper} variant="outlined"><Table aria-label="Historial de descuentos" sx={{ minWidth: 900 }}>
        <TableHead><TableRow><TableCell>Persona</TableCell><TableCell>Sucursal</TableCell><TableCell>Motivo</TableCell><TableCell>Fecha del retardo que completó el grupo</TableCell><TableCell>Inicio del periodo</TableCell><TableCell>Retardos agrupados</TableCell><TableCell>Días de sueldo</TableCell><TableCell>Estatus</TableCell></TableRow></TableHead>
        <TableBody>{visibleDeductions.map((deduction) => <TableRow key={deduction.id}>
          <TableCell>{deduction.name}</TableCell><TableCell>{deduction.branchName}</TableCell><TableCell>{deduction.category === 'arrival' ? 'Llegada' : 'Comida'}</TableCell>
          <TableCell>{new Intl.DateTimeFormat('es-MX', { timeZone: deduction.timeZone, dateStyle: 'short', timeStyle: 'short' }).format(new Date(deduction.occurredAt))}</TableCell>
          <TableCell>{deduction.windowStart}</TableCell><TableCell>{deduction.incidentIds.length}</TableCell><TableCell>{deduction.salaryDays}</TableCell><TableCell><Chip size="small" label={deduction.voidedAt ? 'Anulado por recálculo' : 'Registrado'} color={deduction.voidedAt ? 'default' : 'warning'} variant="outlined" /></TableCell>
        </TableRow>)}{!visibleDeductions.length && <TableRow><TableCell colSpan={8}>No hay descuentos registrados para este periodo.</TableCell></TableRow>}</TableBody>
      </Table></TableContainer>}
    </Stack>
    {detail && <DayDetails day={detail} onClose={() => setDetail(null)} />}
    <UserPhotoDialog key={photo ? `${photo.deviceId}:${photo.userId}` : 'closed'} user={photo} onClose={() => setPhoto(null)} />
  </>
}
