import Alert from '@mui/material/Alert'
import AlertTitle from '@mui/material/AlertTitle'
import Box from '@mui/material/Box'
import LinearProgress from '@mui/material/LinearProgress'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import type { UserPhotoSyncProgress, UserPhotoSyncSummary } from './types/user-photo-sync'

interface UserPhotoSyncFeedbackProps {
  isPending: boolean
  progress: UserPhotoSyncProgress | null
  summary: UserPhotoSyncSummary | undefined
  onClose: () => void
}

export default function UserPhotoSyncFeedback({ isPending, progress, summary, onClose }: UserPhotoSyncFeedbackProps) {
  if (isPending) {
    return <Alert severity="info" role="status">
      <Stack spacing={1}>
        <Typography variant="body2">
          {progress ? `Procesando ${progress.current} de ${progress.total}: ${progress.target.name} · ID ${progress.target.userId}` : 'Actualizando empleados…'}
        </Typography>
        <LinearProgress aria-label="Progreso de sincronización de fotos" variant={progress ? 'determinate' : 'indeterminate'} value={progress ? (progress.current - 1) / progress.total * 100 : undefined} />
      </Stack>
    </Alert>
  }
  if (!summary) return null

  const pending = summary.outcomes.filter((outcome) => outcome.status !== 'downloaded')
  const missingCount = pending.filter((outcome) => outcome.status === 'missing').length
  const errorCount = pending.length - missingCount

  return <Alert severity={pending.length ? 'warning' : 'success'} onClose={onClose} sx={{ overflowWrap: 'anywhere' }}>
    <AlertTitle>Sincronización de fotos finalizada · {summary.deviceName}</AlertTitle>
    <Typography variant="body2">Fotos descargadas: {summary.outcomes.length - pending.length}. Sin imagen devuelta: {missingCount}. Con error: {errorCount}.</Typography>
    {pending.length > 0 && <>
      <Typography variant="body2">Los empleados pendientes permanecen seleccionados para reintentarlo. Un error del SDK no confirma que el empleado carezca de foto.</Typography>
      <Box component="details" sx={{ mt: 1 }}>
        <Box component="summary" sx={{ cursor: 'pointer' }}>Ver {pending.length} pendientes</Box>
        <Box component="ul" sx={{ pl: 2.5, mb: 0, maxHeight: 240, overflowY: 'auto' }}>
          {pending.map((outcome) => <li key={outcome.employeeId}>
            <Typography variant="body2">{outcome.name} · ID {outcome.userId}: {outcome.status === 'missing' ? 'El servicio no devolvió una imagen.' : outcome.message}</Typography>
          </li>)}
        </Box>
      </Box>
    </>}
  </Alert>
}
