import { useQuery } from '@tanstack/react-query'
import Alert from '@mui/material/Alert'
import Button from '@mui/material/Button'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { httpClient } from '../../shared/api/http-client'
import { getApiErrorMessage } from '../../shared/api/api-error'
import PageLoading from '../../shared/ui/page-loading'
import type { Employee } from './types/employee'

export default function EmployeeHistoryDialog({ employee, onClose }: { employee: Employee; onClose: () => void }) {
  const history = useQuery({ queryKey: ['employee-history', employee.id], queryFn: async ({ signal }) => (await httpClient.get(`/employees/${employee.id}/history`, { signal })).data })
  return <Dialog open fullWidth maxWidth="md" onClose={onClose}>
    <DialogTitle>Historial y datos originales · {employee.name}</DialogTitle>
    <DialogContent dividers><Stack spacing={2}>
      <Typography variant="body2">Nombre completo original: {employee.originalName || employee.name}.</Typography>
      <details><summary>Datos laborales e importados conservados</summary>
        <Typography component="pre" variant="caption" sx={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>{JSON.stringify({ id: employee.id,
          reference: employee.employeeNumber, position: employee.position, managementCode: employee.managementCode,
          sectionCode: employee.sectionCode, companyCode: employee.companyCode, branchCode: employee.branchCode,
          scheduleTypeCode: employee.scheduleTypeCode, hireDate: employee.hireDate, terminationDate: employee.terminationDate }, null, 2)}</Typography>
      </details>
      {employee.clockRecords.map((record) => <details key={record.id}>
        <summary>{record.deviceName} · ID {record.userId} · {record.bindingStatus === 'active' ? 'Actual' : 'Histórico'}</summary>
        <Typography variant="body2">Nombre original: {record.name || 'Sin nombre'}. Tarjeta: {record.cardNumber || '—'}. Rol en reloj: {record.role ?? '—'}. Última sincronización: {record.syncedAt}.</Typography>
        <Typography component="pre" variant="caption" sx={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>{JSON.stringify(record.originalProfile, null, 2)}</Typography>
      </details>)}
      {history.isPending ? <PageLoading /> : history.isError ? <Alert severity="error">{getApiErrorMessage(history.error)}</Alert> : <>
        <Typography variant="h3" component="h3">Altas, bajas y reactivaciones</Typography>
        {(history.data.statusEvents ?? []).map((event: { id: string; eventType: string; isActive: boolean; localDate: string; timeZone: string; previousTerminationDate?: string; terminationDate?: string }) => <Typography key={event.id} variant="body2">
          {event.localDate}: {event.eventType === 'initial' ? `Estado original: ${event.isActive ? 'Activo' : 'Dado de baja'}` : event.isActive ? 'Reactivado' : 'Dado de baja'} ({event.timeZone}){event.eventType === 'reactivated' && event.previousTerminationDate ? `. Baja anterior: ${event.previousTerminationDate}` : ''}{event.eventType === 'initial' && !event.isActive && event.terminationDate ? `. Baja original: ${event.terminationDate}` : ''}.
        </Typography>)}
      <details>
        <summary>Respaldo original de la unificación y cambios de identificación</summary>
        <Typography component="pre" variant="caption" sx={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>{JSON.stringify(history.data, null, 2)}</Typography>
      </details></>}
    </Stack></DialogContent>
    <DialogActions><Button onClick={onClose}>Cerrar</Button></DialogActions>
  </Dialog>
}
