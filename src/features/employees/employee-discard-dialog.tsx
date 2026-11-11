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
import { useOrganizationMutation } from '../organization/api'
import type { Employee } from './types/employee'

export default function EmployeeDiscardDialog({employee,onClose,onDiscarded}: {employee:Employee;onClose:()=>void;onDiscarded:()=>void}) {
  const mutation = useOrganizationMutation(() => httpClient.post(`/employees/${employee.id}/discard`,{}))
  async function discard() {
    try { await mutation.mutateAsync(undefined);onDiscarded();onClose() } catch { /* El error se muestra desde el estado de la operación. */ }
  }
  return <Dialog open fullWidth maxWidth="sm" onClose={mutation.isPending ? undefined : onClose}>
    <DialogTitle>Eliminar pendiente de la lista</DialogTitle>
    <DialogContent dividers><Stack spacing={2}>
      <Typography variant="h3">{employee.name}</Typography>
      <Typography variant="body2">{employee.branchName || 'Sin sucursal'} · {employee.clockRecords.map(record => `${record.deviceName}: ID ${record.userId}`).join(', ') || 'Sin reloj vinculado'}</Typography>
      <Typography variant="body2">Se quitará esta ficha pendiente del directorio. El usuario permanecerá en el reloj y no reaparecerá al sincronizar solo los usuarios.</Typography>
      <Alert severity="info">Solo se permite si no tiene checadas registradas. Si después llega una checada, se recuperará automáticamente la misma ficha como pendiente.</Alert>
      {mutation.isError && <Alert severity="error">{getApiErrorMessage(mutation.error)}</Alert>}
    </Stack></DialogContent>
    <DialogActions sx={{p:2}}><Button disabled={mutation.isPending} onClick={onClose}>Cancelar</Button>
      <Button color="error" variant="contained" disabled={mutation.isPending} onClick={() => void discard()}>{mutation.isPending ? 'Eliminando…' : 'Eliminar de la lista'}</Button>
    </DialogActions>
  </Dialog>
}
