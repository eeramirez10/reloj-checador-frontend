import Alert from '@mui/material/Alert'
import MenuItem from '@mui/material/MenuItem'
import TextField from '@mui/material/TextField'
import { useState } from 'react'
import { httpClient } from '../../shared/api/http-client'
import { useOrganizationMutation } from '../organization/api'
import EditorDialog from '../organization/editor-dialog'
import type { Employee } from './types/employee'

export default function EmployeeClockDialog({ employee, employees, onClose }: { employee: Employee; employees: Employee[]; onClose: () => void }) {
  const [clockId, setClockId] = useState(employee.clockRecords.find((record) => record.bindingStatus === 'active')?.id ?? '')
  const records = [
    ...employee.clockRecords,
    ...employees.filter((item) => item.id !== employee.id && item.identificationStatus === 'pending' && (!employee.branchId || item.branchId === employee.branchId)).flatMap((item) => item.clockRecords),
  ]
  const mutation = useOrganizationMutation<void>(async () => {
    if (!clockId) throw new Error('Selecciona un registro del reloj.')
    await httpClient.post(`/employees/${employee.id}/clock-record`, { clockRecordId: clockId })
  })
  return <EditorDialog title={`Reloj de ${employee.name}`} onClose={onClose} onSave={() => mutation.mutateAsync()}>
    <TextField required select label="Registro del reloj" value={clockId} onChange={(event) => setClockId(event.target.value)}>
      {records.map((record) => <MenuItem key={record.id} value={record.id}>{record.deviceName} · ID {record.userId} · {record.name || 'Sin nombre'}</MenuItem>)}
    </TextField>
    <Alert severity="info">Cada empleado tiene un reloj actual de su sucursal. Los registros anteriores se conservan como históricos. Sincroniza los empleados del reloj si todavía no aparece el ID.</Alert>
  </EditorDialog>
}
