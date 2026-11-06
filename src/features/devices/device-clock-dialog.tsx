import AccessTimeRoundedIcon from '@mui/icons-material/AccessTimeRounded'
import RefreshRoundedIcon from '@mui/icons-material/RefreshRounded'
import SyncRoundedIcon from '@mui/icons-material/SyncRounded'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import CircularProgress from '@mui/material/CircularProgress'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import Divider from '@mui/material/Divider'
import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { getApiErrorMessage } from '../../shared/api/api-error'
import { clockQueryKeys, getClockHistory, getClockTime, setManualClockTime, synchronizeClockTime } from './api/device-clock.api'
import type { Device } from './types/device'
import type { ClockAdjustment, ClockAdjustmentRequest } from './types/device-clock'
import ManualClockForm from './manual-clock-form'

function formatLocalTime(value: string): string {
  const [date, time] = value.split(' ')
  return `${date.split('-').reverse().join('/')} ${time}`
}

function driftDescription(seconds: number): string {
  const absolute = Math.abs(seconds)
  const hours = Math.floor(absolute / 3600)
  const minutes = Math.floor(absolute % 3600 / 60)
  const remainder = absolute % 60
  const duration = [hours ? `${hours} h` : '', minutes ? `${minutes} min` : '', `${remainder} s`].filter(Boolean).join(' ')
  return seconds === 0 ? 'Sin diferencia en esta lectura' : `${duration} ${seconds > 0 ? 'adelantado' : 'atrasado'}`
}

function TimePanel({ title, value }: { title: string; value: string }) {
  return <Paper variant="outlined" sx={{ p: 2, flex: 1, minWidth: 0 }}>
    <Stack spacing={1}>
      <Typography color="text.secondary" variant="body2">{title}</Typography>
      <Typography sx={{ fontVariantNumeric: 'tabular-nums', fontWeight: 600 }} variant="h5">{formatLocalTime(value)}</Typography>
    </Stack>
  </Paper>
}

function AdjustmentHistory({ entry }: { entry: ClockAdjustment }) {
  const label = entry.status === 'succeeded' ? 'Verificado' : entry.status === 'failed' ? 'No confirmado' : 'En proceso'
  return <Paper variant="outlined" sx={{ p: 1.75 }}>
    <Stack spacing={1}>
      <Stack direction="row" spacing={1} sx={{ alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1 }}>
        <Typography variant="body2">{new Date(entry.startedAt).toLocaleString('es-MX', { timeZone: entry.timeZone, hourCycle: 'h23' })}</Typography>
        <Chip size="small" variant="outlined" color={entry.status === 'succeeded' ? 'success' : entry.status === 'failed' ? 'error' : 'default'} label={label} />
      </Stack>
      <Typography color="text.secondary" variant="caption">{entry.mode === 'manual' ? 'Ajuste manual' : 'Hora del servidor'} · {entry.timeZone}</Typography>
      {entry.requestedLocalTime && <Typography variant="body2">Solicitada: {formatLocalTime(entry.requestedLocalTime)}</Typography>}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 1 }}>
        <Typography variant="body2">Anterior: {entry.before ? formatLocalTime(entry.before.localTime) : 'Sin lectura'}</Typography>
        <Typography variant="body2">Enviada: {entry.target ? formatLocalTime(entry.target.localTime) : 'Sin confirmación de envío'}</Typography>
      </Box>
      {entry.after && <Typography variant="body2">Leída después: {formatLocalTime(entry.after.localTime)} · {driftDescription(entry.after.driftSeconds)} respecto del servidor</Typography>}
      {entry.error && <Typography color="error.main" variant="body2">{entry.error}</Typography>}
    </Stack>
  </Paper>
}

export default function DeviceClockDialog({ device, branchName, onClose }: { device: Device; branchName: string; onClose: () => void }) {
  const queryClient = useQueryClient()
  const supported = device.driver === 'node' && Boolean(device.branchId && device.timeZone)
  // La comunicación con el equipo sigue en curso aunque se cierre el diálogo; se reutiliza esa consulta al volver a abrirlo.
  const clock = useQuery({ queryKey: clockQueryKeys.time(device.id), queryFn: () => getClockTime(device.id),
    enabled: supported, retry: false, refetchOnWindowFocus: false, staleTime: 0 })
  const history = useQuery({ queryKey: clockQueryKeys.history(device.id), queryFn: ({ signal }) => getClockHistory(device.id, signal) })
  const synchronization = useMutation({
    mutationFn: (request: ClockAdjustmentRequest) => request.mode === 'manual' ? setManualClockTime(device.id, request.localTime) : synchronizeClockTime(device.id),
    onMutate: () => queryClient.cancelQueries({ queryKey: clockQueryKeys.time(device.id) }),
    onSuccess: (result) => {
      if (result.after) queryClient.setQueryData(clockQueryKeys.time(device.id), result.after)
      else queryClient.removeQueries({ queryKey: clockQueryKeys.time(device.id) })
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: clockQueryKeys.history(device.id) }),
  })
  const busy = synchronization.isPending
  const close = () => { if (!busy) onClose() }
  const reading = clock.data

  return <Dialog open fullWidth maxWidth="md" aria-labelledby="device-clock-title" onClose={close}>
    <DialogTitle id="device-clock-title"><Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}><AccessTimeRoundedIcon color="primary" /><span>Fecha y hora del reloj</span></Stack></DialogTitle>
    <DialogContent dividers>
      <Stack spacing={2.5}>
        <Stack spacing={0.5}>
          <Typography sx={{ fontWeight: 600 }}>{device.name}</Typography>
          <Typography color="text.secondary" variant="body2">{branchName} · {device.ipAddress}:{device.tcpPort}</Typography>
          <Typography color="text.secondary" variant="body2">Zona horaria: {device.timeZone ?? 'Sin asignar'}</Typography>
        </Stack>
        {!supported && <Alert severity="info">{device.driver !== 'node' ? 'La administración de hora está disponible con TCP/IP directo.' : 'Asigna este reloj a una sucursal con zona horaria para consultar y sincronizar su hora.'}</Alert>}
        {supported && <>
          <Typography color="text.secondary" variant="body2">La referencia es la hora del servidor convertida a la zona horaria de la sucursal.</Typography>
          {clock.isFetching && <Stack direction="row" spacing={1} role="status" sx={{ alignItems: 'center' }}><CircularProgress size={18} /><Typography variant="body2">Consultando el reloj…</Typography></Stack>}
          {clock.isError && <Alert severity="error">{getApiErrorMessage(clock.error)}</Alert>}
          {reading && <Stack spacing={1.25}>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
              <TimePanel title="Hora del reloj" value={reading.localTime} />
              <TimePanel title="Hora de referencia de la sucursal" value={reading.referenceLocalTime} />
            </Stack>
            <Stack direction="row" spacing={1} sx={{ alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
              <Chip color={Math.abs(reading.driftSeconds) <= 5 ? 'success' : 'warning'} size="small" variant="outlined" label={Math.abs(reading.driftSeconds) <= 5 ? 'En hora' : 'Diferencia detectada'} />
              <Typography variant="body2">{driftDescription(reading.driftSeconds)}</Typography>
            </Stack>
            <Typography color="text.secondary" variant="caption">Valores de la última consulta: {new Date(reading.measuredAt).toLocaleString('es-MX', { timeZone: reading.timeZone, hourCycle: 'h23' })}. Actualiza para tomar otra lectura.</Typography>
          </Stack>}
          {synchronization.isError && <Alert severity="error">{getApiErrorMessage(synchronization.error)} Consulta nuevamente la hora para comprobar el estado actual.</Alert>}
          {synchronization.data && <Alert severity={synchronization.data.status === 'succeeded' ? 'success' : 'error'}>
            {synchronization.data.status === 'succeeded' ? synchronization.data.mode === 'manual' ? 'Fecha y hora manual aplicadas y verificadas en el reloj.' : 'Hora sincronizada y verificada en el reloj.' : synchronization.data.error ?? 'No se pudo confirmar el ajuste de hora.'}
          </Alert>}
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
            <Button variant="outlined" disabled={busy || clock.isFetching} startIcon={<RefreshRoundedIcon />} onClick={() => { synchronization.reset(); void clock.refetch() }}>Consultar hora</Button>
            <Button variant="contained" disabled={busy || clock.isFetching || !reading || clock.isError} startIcon={busy && synchronization.variables?.mode === 'server' ? <CircularProgress color="inherit" size={18} /> : <SyncRoundedIcon />} onClick={() => synchronization.mutate({ mode: 'server' })}>{busy && synchronization.variables?.mode === 'server' ? 'Sincronizando y verificando…' : 'Sincronizar hora'}</Button>
          </Stack>
          {reading && <ManualClockForm initialLocalTime={reading.localTime} timeZone={reading.timeZone} disabled={busy || clock.isFetching || clock.isError}
            saving={busy && synchronization.variables?.mode === 'manual'} onSubmit={(localTime) => synchronization.mutate({ mode: 'manual', localTime })} />}
          <Typography color="text.secondary" variant="caption">Sincronizar hora usa la referencia del servidor. El ajuste manual usa la fecha y hora que captures. Las checadas anteriores conservan su fecha y hora original.</Typography>
        </>}
        <Divider />
        <Stack spacing={1.5}>
          <Typography component="h3" variant="h6">Historial de ajustes</Typography>
          {history.isPending ? <CircularProgress size={20} /> : history.isError ? <Alert severity="error" action={<Button color="inherit" onClick={() => void history.refetch()}>Reintentar</Button>}>{getApiErrorMessage(history.error)}</Alert>
            : !history.data.length ? <Typography color="text.secondary" variant="body2">Este reloj todavía no tiene ajustes registrados.</Typography>
              : history.data.map((entry) => <AdjustmentHistory key={entry.id} entry={entry} />)}
        </Stack>
      </Stack>
    </DialogContent>
    <DialogActions><Button disabled={busy} onClick={close}>Cerrar</Button></DialogActions>
  </Dialog>
}
