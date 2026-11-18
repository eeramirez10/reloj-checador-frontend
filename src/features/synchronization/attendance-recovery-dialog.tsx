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

export default function AttendanceRecoveryDialog({ initialBranchId = '', initialDeviceId = '', initialDate, onClose }: {
  initialBranchId?: string; initialDeviceId?: string; initialDate?: string; onClose: (date?: string) => void
}) {
  const branches = useBranches()
  const devices = useDevices()
  const recovery = useAttendanceRecovery()
  const [branchId, setBranchId] = useState(initialBranchId)
  const [deviceId, setDeviceId] = useState(initialDeviceId)
  const [date, setDate] = useState(() => initialDate ?? getToday())
  const dateInstant = new Date(`${date}T00:00:00Z`)
  const validDate = /^\d{4}-\d{2}-\d{2}$/.test(date) && Number.isFinite(dateInstant.getTime()) && dateInstant.toISOString().slice(0, 10) === date
  const available = (devices.data ?? []).filter(device => !branchId || device.branchId === branchId)
  const targets = available.filter(device => !deviceId || device.id === deviceId)
  const completed = recovery.results.filter(result => ['succeeded', 'failed', 'skipped'].includes(result.status)).length
  const failed = recovery.results.filter(result => ['failed', 'skipped'].includes(result.status))
  const inserted = recovery.results.reduce((total, result) => total + (result.run?.insertedCount ?? 0), 0)
  const emptyCount = recovery.results.filter(result => result.status === 'succeeded' && result.run?.receivedCount === 0).length
  const ready = validDate && !devices.isPending && !devices.isError && !branches.isPending && !branches.isError && targets.length > 0

  function close() { onClose(validDate ? date : undefined) }

  return <Dialog open fullWidth maxWidth="md" onClose={recovery.busy ? undefined : close}>
    <DialogTitle>Recuperar por fecha</DialogTitle>
    <DialogContent dividers><Stack spacing={2.5}>
      <Typography variant="body2">Selecciona el día que necesitas recuperar. Se guardan únicamente sus checadas nuevas y se recalculan asistencia, incidencias y horas extras con el historial disponible.</Typography>
      <Alert severity="info">La fecha se interpreta en la zona horaria de cada reloj. Repetir la recuperación no duplica checadas ni elimina el historial.</Alert>
      <TextField required type="date" label="Fecha a recuperar" value={date} disabled={recovery.busy} error={!validDate}
        onChange={event => { setDate(event.target.value); recovery.reset() }} slotProps={{ inputLabel: { shrink: true } }}
        helperText={validDate ? 'Se recupera un día completo, de 00:00 a antes de las 00:00 del día siguiente.' : 'Selecciona una fecha válida.'} />
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
          <TableHead><TableRow><TableCell>Reloj y zona horaria</TableCell><TableCell>Resultado</TableCell><TableCell align="right">Leídas del día</TableCell><TableCell align="right">Nuevas del día</TableCell></TableRow></TableHead>
          <TableBody>{targets.map(device => {
            const result = recovery.results.find(item => item.deviceId === device.id)
            const empty = result?.status === 'succeeded' && result.run?.receivedCount === 0
            return <TableRow key={device.id}>
              <TableCell><Typography variant="body2" sx={{ fontWeight: 600 }}>{device.name}</Typography><Typography component="div" variant="caption">{device.ipAddress}:{device.tcpPort}</Typography><Typography component="div" variant="caption">{device.timeZone ?? 'America/Mexico_City'}</Typography></TableCell>
              <TableCell sx={{ maxWidth: 340 }}><Chip size="small" variant="outlined" color={result?.status === 'failed' || empty ? 'warning' : result?.status === 'succeeded' ? 'success' : 'default'} label={empty ? 'Sin registros para la fecha' : statusLabels[result?.status ?? 'queued']} />
                {result?.error && <Typography component="p" variant="caption" color="error" sx={{ overflowWrap: 'anywhere', mb: 0 }}>{result.error}</Typography>}
              </TableCell>
              <TableCell align="right">{result?.run?.receivedCount ?? '—'}</TableCell><TableCell align="right">{result?.run?.insertedCount ?? '—'}</TableCell>
            </TableRow>
          })}{targets.length === 0 && <TableRow><TableCell colSpan={4}>No hay relojes disponibles para esta selección.</TableCell></TableRow>}</TableBody>
        </Table></TableContainer>
      </>}
      {recovery.busy && <Stack spacing={1} role="status" aria-live="polite"><LinearProgress variant="determinate" value={completed / recovery.results.length * 100} /><Typography variant="body2">Procesando relojes: {completed} de {recovery.results.length}. Espera a que termine la lectura y el recálculo.</Typography></Stack>}
      {!recovery.busy && recovery.results.length > 0 && <Alert severity={failed.length || emptyCount ? 'warning' : 'success'}>
        {inserted} checadas nuevas del {date.split('-').reverse().join('/')} guardadas en los relojes completados. {failed.length ? `${failed.length} ${failed.length === 1 ? 'reloj requiere' : 'relojes requieren'} revisión. Los registros ya guardados se conservan; consulta Sincronización para revisar el historial y cualquier avance parcial.` : emptyCount ? `${emptyCount} ${emptyCount === 1 ? 'reloj no devolvió' : 'relojes no devolvieron'} registros para esa fecha. Se conservó el historial; revisa que esos equipos conserven las checadas.` : 'La asistencia de los relojes completados quedó recalculada. Las checadas ya registradas no se duplicaron.'}
      </Alert>}
      <Typography variant="caption" color="text.secondary">El reloj puede enviar su historial completo, pero solo se guardan y cuentan las checadas del día elegido. Para completar una ruta entre días, recupera también el otro día si todavía faltan sus registros.</Typography>
    </Stack></DialogContent>
    <DialogActions sx={{ p: 2, flexWrap: 'wrap', gap: 1 }}>
      <Button disabled={recovery.busy} onClick={close}>Cerrar</Button>
      {failed.length > 0 && <Button variant="outlined" disabled={recovery.busy || !ready} onClick={() => void recovery.recover(failed.map(result => result.deviceId), date)}>Reintentar pendientes</Button>}
      <Button variant="contained" startIcon={<RestoreRoundedIcon />} disabled={recovery.busy || !ready} onClick={() => void recovery.recover(targets.map(device => device.id), date)}>{recovery.busy ? 'Recuperando…' : 'Recuperar por fecha'}</Button>
    </DialogActions>
  </Dialog>
}
