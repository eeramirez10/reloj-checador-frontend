import RestoreRoundedIcon from '@mui/icons-material/RestoreRounded'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import LinearProgress from '@mui/material/LinearProgress'
import MenuItem from '@mui/material/MenuItem'
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
import { useDevices } from '../devices/hooks/use-devices'
import { getToday, useBranches } from '../organization/api'
import { getApiErrorMessage } from '../../shared/api/api-error'
import PageLoading from '../../shared/ui/page-loading'
import { useAttendanceRecovery } from './hooks/use-attendance-recovery'
import type { RecoveryResult } from './hooks/use-attendance-recovery'

const statusLabels: Record<RecoveryResult['status'], string> = {
  queued: 'Pendiente', running: 'Leyendo y recalculando…', succeeded: 'Completado', failed: 'Revisar', skipped: 'No intentado',
}

function recentDates(timeZone?: string) {
  const today = getToday(timeZone)
  const yesterday = new Date(Date.parse(`${today}T12:00:00Z`) - 86400000).toISOString().slice(0, 10)
  const display = (date: string) => date.split('-').reverse().join('/')
  return `${display(yesterday)} al ${display(today)}`
}

export default function AttendanceRecoveryDialog({ initialBranchId = '', initialDeviceId = '', onClose }: {
  initialBranchId?: string; initialDeviceId?: string; onClose: () => void
}) {
  const branches = useBranches()
  const devices = useDevices()
  const recovery = useAttendanceRecovery()
  const [branchId, setBranchId] = useState(initialBranchId)
  const [deviceId, setDeviceId] = useState(initialDeviceId)
  const available = (devices.data ?? []).filter(device => !branchId || device.branchId === branchId)
  const targets = available.filter(device => !deviceId || device.id === deviceId)
  const completed = recovery.results.filter(result => ['succeeded', 'failed', 'skipped'].includes(result.status)).length
  const failed = recovery.results.filter(result => ['failed', 'skipped'].includes(result.status))
  const inserted = recovery.results.reduce((total, result) => total + (result.run?.insertedCount ?? 0), 0)
  const emptyCount = recovery.results.filter(result => result.status === 'succeeded' && result.run?.receivedCount === 0).length
  const ready = !devices.isPending && !devices.isError && !branches.isPending && !branches.isError && targets.length > 0

  return <Dialog open fullWidth maxWidth="md" onClose={recovery.busy ? undefined : onClose}>
    <DialogTitle>Recuperar ayer y hoy</DialogTitle>
    <DialogContent dividers><Stack spacing={2.5}>
      <Typography variant="body2">Vuelve a leer los relojes después de recuperar la conexión de red. Se guardan únicamente las checadas nuevas y se recalculan asistencia, incidencias y horas extras.</Typography>
      <Alert severity="info">La lectura incluye todos los registros que conserva el reloj, también los anteriores a ayer. Repetirla no duplica checadas ni elimina el historial.</Alert>
      <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' } }}>
        <TextField select label="Sucursal" value={branchId} disabled={recovery.busy || branches.isPending} slotProps={{ select: { displayEmpty: true }, inputLabel: { shrink: true } }} onChange={event => { setBranchId(event.target.value); setDeviceId(''); recovery.reset() }}>
          <MenuItem value="">Todas las sucursales autorizadas</MenuItem>
          {branches.data?.map(branch => <MenuItem key={branch.id} value={branch.id}>{branch.name}</MenuItem>)}
        </TextField>
        <TextField select label="Reloj" value={deviceId} disabled={recovery.busy || devices.isPending} slotProps={{ select: { displayEmpty: true }, inputLabel: { shrink: true } }} onChange={event => { setDeviceId(event.target.value); recovery.reset() }}>
          <MenuItem value="">Todos los relojes de la selección</MenuItem>
          {available.map(device => <MenuItem key={device.id} value={device.id}>{device.name}</MenuItem>)}
        </TextField>
      </Box>
      {branches.isError && <Alert severity="error">{getApiErrorMessage(branches.error)}</Alert>}
      {devices.isError && <Alert severity="error">{getApiErrorMessage(devices.error)}</Alert>}
      {devices.isPending ? <PageLoading /> : <>
        <Typography variant="body2">{targets.length} {targets.length === 1 ? 'reloj seleccionado' : 'relojes seleccionados'}. Se procesan uno por uno; una falla de conexión permite continuar con el siguiente.</Typography>
        <TableContainer><Table size="small" aria-label="Recuperación de checadas" sx={{ minWidth: 650 }}>
          <TableHead><TableRow><TableCell>Reloj y fechas locales</TableCell><TableCell>Resultado</TableCell><TableCell align="right">Leídas</TableCell><TableCell align="right">Nuevas</TableCell></TableRow></TableHead>
          <TableBody>{targets.map(device => {
            const result = recovery.results.find(item => item.deviceId === device.id)
            const empty = result?.status === 'succeeded' && result.run?.receivedCount === 0
            return <TableRow key={device.id}>
              <TableCell><Typography variant="body2" sx={{ fontWeight: 600 }}>{device.name}</Typography><Typography component="div" variant="caption">{device.ipAddress}:{device.tcpPort}</Typography><Typography component="div" variant="caption">{recentDates(device.timeZone)}</Typography></TableCell>
              <TableCell sx={{ maxWidth: 340 }}><Chip size="small" variant="outlined" color={result?.status === 'failed' || empty ? 'warning' : result?.status === 'succeeded' ? 'success' : 'default'} label={empty ? 'Sin registros devueltos' : statusLabels[result?.status ?? 'queued']} />
                {result?.error && <Typography component="p" variant="caption" color="error" sx={{ overflowWrap: 'anywhere', mb: 0 }}>{result.error}</Typography>}
              </TableCell>
              <TableCell align="right">{result?.run?.receivedCount ?? '—'}</TableCell><TableCell align="right">{result?.run?.insertedCount ?? '—'}</TableCell>
            </TableRow>
          })}{targets.length === 0 && <TableRow><TableCell colSpan={4}>No hay relojes disponibles para esta selección.</TableCell></TableRow>}</TableBody>
        </Table></TableContainer>
      </>}
      {recovery.busy && <Stack spacing={1} role="status" aria-live="polite"><LinearProgress variant="determinate" value={completed / recovery.results.length * 100} /><Typography variant="body2">Procesando relojes: {completed} de {recovery.results.length}. Espera a que termine la lectura y el recálculo.</Typography></Stack>}
      {!recovery.busy && recovery.results.length > 0 && <Alert severity={failed.length || emptyCount ? 'warning' : 'success'}>
        {inserted} checadas nuevas guardadas en los relojes completados. {failed.length ? `${failed.length} ${failed.length === 1 ? 'reloj requiere' : 'relojes requieren'} revisión. Los registros ya guardados se conservan; consulta Sincronización para revisar el historial y cualquier avance parcial.` : emptyCount ? `${emptyCount} ${emptyCount === 1 ? 'reloj no devolvió' : 'relojes no devolvieron'} registros. Se conservó el historial; revisa que esos equipos conserven las checadas.` : 'La asistencia de los relojes completados quedó recalculada. Las checadas ya registradas no se duplicaron.'}
      </Alert>}
      <Typography variant="caption" color="text.secondary">Las fechas muestran ayer y hoy en la zona de cada reloj. Los conteos incluyen toda la descarga, no solo esos dos días. La acción también permite leer relojes con sincronización automática pausada.</Typography>
    </Stack></DialogContent>
    <DialogActions sx={{ p: 2, flexWrap: 'wrap', gap: 1 }}>
      <Button disabled={recovery.busy} onClick={onClose}>Cerrar</Button>
      {failed.length > 0 && <Button variant="outlined" disabled={recovery.busy || !ready} onClick={() => void recovery.recover(failed.map(result => result.deviceId))}>Reintentar pendientes</Button>}
      <Button variant="contained" startIcon={<RestoreRoundedIcon />} disabled={recovery.busy || !ready} onClick={() => void recovery.recover(targets.map(device => device.id))}>{recovery.busy ? 'Recuperando…' : 'Recuperar ayer y hoy'}</Button>
    </DialogActions>
  </Dialog>
}
