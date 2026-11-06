import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import MenuItem from '@mui/material/MenuItem'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import { useState } from 'react'
import { useOrganizationMutation } from '../organization/api'
import EditorDialog from '../organization/editor-dialog'
import { formatCardDate } from '../employees/employee-attendance-format'
import { getApiErrorMessage } from '../../shared/api/api-error'
import PageLoading from '../../shared/ui/page-loading'
import { resolveLeave, useLeaveDetail } from './api'
import { formatLeaveTimestamp, leaveKindLabels, leaveStatusColors, leaveStatusLabels } from './leave-format'
import type { LeaveRequest } from './types'

type Resolution = 'approve' | 'reject' | 'cancel'
const resolutionLabels: Record<Resolution, string> = { approve: 'Aprobar permiso', reject: 'Rechazar permiso', cancel: 'Cancelar permiso' }

export default function LeaveDetailDialog({ id, onClose }: { id: string; onClose: () => void }) {
  const detail = useLeaveDetail(id)
  const [action, setAction] = useState<Resolution | null>(null)
  const request = detail.data?.request
  return <>
    <Dialog open fullWidth maxWidth="md" onClose={onClose}>
      <DialogTitle>Detalle del permiso</DialogTitle>
      <DialogContent dividers>{detail.isError ? <Alert severity="error">{getApiErrorMessage(detail.error)} <Button onClick={() => void detail.refetch()}>Reintentar</Button></Alert> : !request ? <PageLoading /> : <Stack spacing={2.5}>
        <Stack spacing={0.75}><Typography variant="h3">{request.details.employeeName}</Typography>
          <Typography variant="body2" color="text.secondary">{request.details.branchName}{request.details.employeeNumber ? ` · Nómina ${request.details.employeeNumber}` : ''}</Typography>
          <Chip sx={{ alignSelf: 'flex-start' }} size="small" variant="outlined" color={leaveStatusColors[request.status]} label={leaveStatusLabels[request.status]} />
        </Stack>
        <Box component="dl" sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2, m: 0,
          '& dt': { color: 'text.secondary', fontSize: '0.75rem' }, '& dd': { m: 0, mt: 0.5, fontSize: '0.875rem' } }}>
          <div><dt>Tipo de permiso</dt><dd>{leaveKindLabels[request.kind]}</dd></div>
          <div><dt>Periodo</dt><dd>{formatCardDate(request.from)} al {formatCardDate(request.to)}</dd></div>
          <div><dt>Goce de sueldo</dt><dd>{request.paid ? 'Con goce de sueldo' : 'Sin goce de sueldo'}</dd></div>
          <div><dt>Vacaciones</dt><dd>{request.useVacation ? `${request.details.days.length} días a cuenta de vacaciones` : 'No utiliza vacaciones'}</dd></div>
          <div><dt>Jefe responsable</dt><dd>{request.details.managerName}</dd></div>
          <div><dt>Registro</dt><dd>{formatLeaveTimestamp(request.createdAt)} · {request.source === 'web' ? 'Página web' : 'WhatsApp'}</dd></div>
          {request.authorizedTime && <div><dt>Hora autorizada, local de cada sucursal</dt><dd>{request.authorizedTime}</dd></div>}
        </Box>
        <Stack spacing={0.5}><Typography variant="subtitle2">Motivo / comentarios</Typography><Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>{request.reason}</Typography></Stack>
        <Stack spacing={1}><Typography variant="subtitle2">Días laborables incluidos ({request.details.days.length})</Typography>
          <Stack direction="row" spacing={0.75} useFlexGap sx={{ flexWrap: 'wrap', maxHeight: 160, overflowY: 'auto' }}>{request.details.days.map((day) => <Chip key={day.date} size="small" variant="outlined" label={formatCardDate(day.date)} />)}</Stack>
        </Stack>
        <Stack spacing={1.5} sx={{ pt: 2, borderTop: 1, borderColor: 'divider' }}><Typography variant="h3">Historial</Typography>
          {detail.data?.events.map((event) => <Box key={event.id} sx={{ pl: 1.5, borderLeft: 2, borderColor: 'divider' }}>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>{event.kind === 'created' ? 'Solicitud registrada' : leaveStatusLabels[event.kind]} · {formatLeaveTimestamp(event.createdAt)}</Typography>
            {event.comments && <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>{event.comments}</Typography>}
            {event.actorAccountName && <Typography component="p" variant="caption" color="text.secondary">Registrado por {event.actorAccountName}.</Typography>}
            {event.actorEmployeeId && <Typography variant="caption" color="text.secondary">Resolución registrada desde la página a nombre de {event.actorEmployeeId === request.managerId ? request.details.managerName : request.details.employeeName}.</Typography>}
            <Typography component="p" variant="caption" color="text.secondary" sx={{ mb: 0 }}>WhatsApp pendiente de conectar{event.recipientPhone ? ` · Destinatario ${event.recipientPhone}` : ' · Número de destinatario sin configurar'}.</Typography>
          </Box>)}
        </Stack>
        <Typography variant="caption" color="text.secondary" sx={{ overflowWrap: 'anywhere' }}>Folio {request.id}</Typography>
      </Stack>}</DialogContent>
      <DialogActions sx={{ p: 2, flexWrap: 'wrap', gap: 1 }}>
        <Button onClick={onClose}>Cerrar</Button>
        {request && ['pending', 'approved'].includes(request.status) && <Button color="inherit" onClick={() => setAction('cancel')}>Cancelar permiso</Button>}
        {request?.status === 'pending' && <><Button color="error" variant="outlined" onClick={() => setAction('reject')}>Rechazar</Button><Button variant="contained" onClick={() => setAction('approve')}>Aprobar</Button></>}
      </DialogActions>
    </Dialog>
    {action && request && <ResolutionDialog key={`${request.version}:${action}`} request={request} action={action} onClose={() => setAction(null)} />}
  </>
}

function ResolutionDialog({ request, action, onClose }: { request: LeaveRequest; action: Resolution; onClose: () => void }) {
  const [comments, setComments] = useState('')
  const [actor, setActor] = useState(request.managerId)
  const mutation = useOrganizationMutation(async () => resolveLeave(request.id, { action, actorEmployeeId: actor, comments, expectedVersion: request.version }))
  return <EditorDialog title={resolutionLabels[action]} onClose={onClose} onSave={() => mutation.mutateAsync(undefined)} saveLabel={resolutionLabels[action]}>
    <Typography variant="body2">{request.details.employeeName} · {leaveKindLabels[request.kind]} · {formatCardDate(request.from)} al {formatCardDate(request.to)}.</Typography>
    {action === 'cancel' ? <TextField select label="Cancelación a nombre de" value={actor} onChange={(event) => setActor(event.target.value)}>
      <MenuItem value={request.managerId}>{request.details.managerName} (jefe)</MenuItem><MenuItem value={request.employeeId}>{request.details.employeeName} (empleado)</MenuItem>
    </TextField> : <TextField label="Resolución a nombre de" value={request.details.managerName} slotProps={{ input: { readOnly: true } }} />}
    {request.useVacation && (action === 'approve' || action === 'cancel' && request.status === 'approved') && <Alert severity="info">
      {action === 'approve' ? 'Se descontarán' : 'Se devolverán'} {request.details.days.length} días de vacaciones.
    </Alert>}
    <TextField multiline minRows={3} required={action !== 'approve'} label={action === 'approve' ? 'Comentarios de aprobación' : 'Motivo'} value={comments} onChange={(event) => setComments(event.target.value)} slotProps={{ htmlInput: { maxLength: 2000 } }} />
  </EditorDialog>
}
