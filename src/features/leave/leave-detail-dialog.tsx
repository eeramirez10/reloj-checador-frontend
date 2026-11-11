import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
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
import LeaveCorrectionDialog from './leave-correction-dialog'

type Resolution = 'approve' | 'reject' | 'cancel'
const resolutionLabels: Record<Resolution, string> = { approve: 'Aprobar permiso', reject: 'Rechazar permiso', cancel: 'Cancelar permiso' }

export default function LeaveDetailDialog({ id, onClose,onCreated }: { id: string; onClose: () => void;onCreated?:(id:string)=>void }) {
  const detail = useLeaveDetail(id)
  const [action, setAction] = useState<Resolution | null>(null)
  const [correcting,setCorrecting]=useState(false)
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
          {['late_arrival','early_exit'].includes(request.kind) && <div><dt>Hora autorizada, local de cada sucursal</dt><dd>{request.authorizedTime || 'Sin hora definida'}</dd></div>}
          {request.kind==='client_visit' && <><div><dt>Cliente</dt><dd>{request.clientName || 'Sin registrar'}</dd></div><div><dt>Modalidad</dt><dd>{request.fullDay===false?'Visita abierta, sin horario fijo':'Día completo'}</dd></div></>}
          {request.kind==='home_office' && <div><dt>Modalidad</dt><dd>Día completo</dd></div>}
          {request.replacesRequestId && <div><dt>Corrige la solicitud cancelada</dt><dd style={{overflowWrap:'anywhere'}}>{request.replacesRequestId}</dd></div>}
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
            {event.actorEmployeeName && <Typography variant="caption" color="text.secondary">Empleado vinculado: {event.actorEmployeeName}.</Typography>}
            {event.kind==='cancelled' && event.actorRole && ['admin','hr'].includes(event.actorRole) && <Typography component="p" variant="caption" color="text.secondary">Cancelación administrativa{event.previousStatus?` · Estado anterior: ${leaveStatusLabels[event.previousStatus]}`:''}.</Typography>}
            <Typography component="p" variant="caption" color="text.secondary" sx={{ mb: 0 }}>{event.emailStatus ? `Correo: ${{ pending: 'en cola',sending: 'enviando',accepted: 'aceptado por Microsoft',failed: 'falló el envío',uncertain: 'requiere revisión',expired: 'vencido' }[event.emailStatus] ?? event.emailStatus}${event.recipientEmail ? ` · ${event.recipientEmail}` : ''}` : 'Correo pendiente de configuración.'}</Typography>
          </Box>)}
        </Stack>
        <Typography variant="caption" color="text.secondary" sx={{ overflowWrap: 'anywhere' }}>Folio {request.id}</Typography>
      </Stack>}</DialogContent>
      <DialogActions sx={{ p: 2, flexWrap: 'wrap', gap: 1 }}>
        <Button onClick={onClose}>Cerrar</Button>
        {detail.data?.capabilities.canCancel && <Button color="inherit" onClick={() => setAction('cancel')}>{request?.status==='approved'?'Cancelar autorización':'Retirar / cancelar solicitud'}</Button>}
        {detail.data?.capabilities.canCorrect && <Button variant="outlined" onClick={()=>setCorrecting(true)}>Crear solicitud corregida</Button>}
        {detail.data?.capabilities.canReject && <Button color="error" variant="outlined" onClick={() => setAction('reject')}>Rechazar</Button>}
        {detail.data?.capabilities.canApprove && <Button variant="contained" onClick={() => setAction('approve')}>Aprobar</Button>}
      </DialogActions>
    </Dialog>
    {action && request && <ResolutionDialog key={`${request.version}:${action}`} request={request} action={action} onClose={() => setAction(null)} />}
    {correcting && request && <LeaveCorrectionDialog request={request} onClose={()=>setCorrecting(false)} onCreated={next=>{setCorrecting(false);if(onCreated)onCreated(next);else onClose()}} />}
  </>
}

function ResolutionDialog({ request, action, onClose }: { request: LeaveRequest; action: Resolution; onClose: () => void }) {
  const [comments, setComments] = useState('')
  const mutation = useOrganizationMutation(async () => resolveLeave(request.id, { action, comments, expectedVersion: request.version }))
  return <EditorDialog title={resolutionLabels[action]} onClose={onClose} onSave={() => mutation.mutateAsync(undefined)} saveLabel={resolutionLabels[action]}>
    <Typography variant="body2">{request.details.employeeName} · {leaveKindLabels[request.kind]} · {formatCardDate(request.from)} al {formatCardDate(request.to)}.</Typography>
    <Typography variant="body2" color="text.secondary">La acción quedará registrada con tu cuenta de acceso.</Typography>
    {action==='cancel' && request.status==='approved' && <Alert severity="info">Se conservará la aprobación en el historial y se recalculará la asistencia sin esta justificación. Las incidencias y descuentos que correspondan podrán volver a aplicar.</Alert>}
    {request.useVacation && (action === 'approve' || action === 'cancel' && request.status === 'approved') && <Alert severity="info">
      {action === 'approve' ? 'Se descontarán' : 'Se devolverán'} {request.details.days.length} días de vacaciones.
    </Alert>}
    <TextField multiline minRows={3} required={action !== 'approve'} label={action === 'approve' ? 'Comentarios de aprobación' : 'Motivo'} value={comments} onChange={(event) => setComments(event.target.value)} slotProps={{ htmlInput: { maxLength: 2000 } }} />
  </EditorDialog>
}
