import SyncAltRoundedIcon from '@mui/icons-material/SyncAltRounded'
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
import AttendanceRecoveryDialog from '../features/synchronization/attendance-recovery-dialog'
import { useSyncRuns } from '../features/synchronization/hooks/use-sync-runs'
import { useDevices } from '../features/devices/hooks/use-devices'
import { getApiErrorMessage } from '../shared/api/api-error'
import PageHeader from '../shared/ui/page-header'
import PageLoading from '../shared/ui/page-loading'

function SynchronizationPage() {
  const [recovering, setRecovering] = useState(false)
  const history = useSyncRuns()
  const devices = useDevices()
  const names = new Map(devices.data?.map(device => [device.id, device.name]))
  const statuses = { running: 'En curso', succeeded: 'Completada', failed: 'Falló' }
  const types = { attendance: 'Checadas', users: 'Usuarios', user_photos: 'Fotos' }
  return <>
    <PageHeader title="Sincronización" description="Recupera checadas pendientes después de una interrupción y revisa el resultado de cada reloj."
      action={<Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: 'wrap' }}><Button variant="outlined" disabled={history.isFetching} onClick={() => { void history.refetch(); void devices.refetch() }}>Actualizar historial</Button><Button variant="contained" startIcon={<SyncAltRoundedIcon />} onClick={() => setRecovering(true)}>Recuperar ayer y hoy</Button></Stack>} />
    <Stack spacing={2}>
      <Alert severity="info">Actualizar historial consulta lo que ya está guardado. Recuperar ayer y hoy se conecta a los relojes, agrega las checadas nuevas y recalcula la asistencia sin duplicarlas.</Alert>
      {history.isError && <Alert severity="error">{getApiErrorMessage(history.error)}</Alert>}
      {devices.isError && <Alert severity="error">{getApiErrorMessage(devices.error)}</Alert>}
      {history.isPending ? <PageLoading /> : history.data?.length === 0 ? <Paper variant="outlined" sx={{ p: 3 }}><Typography variant="h3">Aún no hay sincronizaciones</Typography><Typography variant="body2" sx={{ mt: 1 }}>Usa Recuperar ayer y hoy para consultar los relojes disponibles en tus sucursales.</Typography></Paper> : history.data && <TableContainer component={Paper} variant="outlined"><Table aria-label="Historial de sincronización" sx={{ minWidth: 850 }}>
        <TableHead><TableRow><TableCell>Inicio</TableCell><TableCell>Reloj</TableCell><TableCell>Tipo</TableCell><TableCell>Estado</TableCell><TableCell align="right">Leídos</TableCell><TableCell align="right">Nuevos</TableCell><TableCell>Detalle</TableCell></TableRow></TableHead>
        <TableBody>{history.data.map(run => <TableRow key={run.id}>
          <TableCell>{new Date(run.startedAt).toLocaleString('es-MX')}</TableCell><TableCell>{names.get(run.deviceId) ?? 'Reloj no disponible'}</TableCell><TableCell>{types[run.syncType] ?? run.syncType}</TableCell>
          <TableCell><Chip size="small" variant="outlined" color={run.status === 'failed' ? 'error' : run.status === 'succeeded' ? 'success' : 'default'} label={statuses[run.status]} /></TableCell>
          <TableCell align="right">{run.receivedCount}</TableCell><TableCell align="right">{run.insertedCount}</TableCell><TableCell sx={{ maxWidth: 360, overflowWrap: 'anywhere' }}>{run.errorMessage || (run.status === 'running' ? 'Actualiza el historial para consultar el resultado.' : '—')}</TableCell>
        </TableRow>)}</TableBody>
      </Table></TableContainer>}
    </Stack>
    {recovering && <AttendanceRecoveryDialog onClose={() => setRecovering(false)} />}
  </>
}

export default SynchronizationPage
