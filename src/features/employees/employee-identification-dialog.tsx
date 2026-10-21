import Alert from '@mui/material/Alert'
import Checkbox from '@mui/material/Checkbox'
import FormControlLabel from '@mui/material/FormControlLabel'
import MenuItem from '@mui/material/MenuItem'
import Radio from '@mui/material/Radio'
import RadioGroup from '@mui/material/RadioGroup'
import TextField from '@mui/material/TextField'
import { useState } from 'react'
import { httpClient } from '../../shared/api/http-client'
import { useOrganizationMutation } from '../organization/api'
import EditorDialog from '../organization/editor-dialog'
import PersonalProfileFields from '../organization/personal-profile-fields'
import { getPersonalProfileChanges } from '../organization/personal-profile'
import type { Employee } from './types/employee'

export default function EmployeeIdentificationDialog({ employee, employees, onClose }: { employee: Employee; employees: Employee[]; onClose: () => void }) {
  const [mode, setMode] = useState('confirm')
  const [targetId, setTargetId] = useState('')
  const [replaceClock, setReplaceClock] = useState(false)
  const initial = { firstName: employee.firstName ?? '', lastName: employee.lastName ?? '', rfc: employee.rfc ?? '', socialSecurityNumber: employee.imss ?? '' }
  const [personal, setPersonal] = useState(initial)
  const mutation = useOrganizationMutation<void>(async () => {
    if (mode === 'associate' && !targetId) throw new Error('Selecciona el empleado al que pertenece este registro.')
    await httpClient.post(`/employees/${employee.id}/identify`, mode === 'confirm' ? getPersonalProfileChanges(personal, initial)
      : { targetEmployeeId: targetId, useAsAssignedClock: replaceClock })
  })
  return <EditorDialog title="Identificar empleado pendiente" onClose={onClose} onSave={() => mutation.mutateAsync()} saveLabel="Guardar identificación">
    <Alert severity="info">{employee.clockRecords.map((record) => `${record.deviceName}: ID ${record.userId}, nombre original ${record.name || 'sin nombre'}`).join('. ')}</Alert>
    <RadioGroup value={mode} onChange={(event) => setMode(event.target.value)}>
      <FormControlLabel value="confirm" control={<Radio />} label="Completar y confirmar esta ficha" />
      <FormControlLabel value="associate" control={<Radio />} label="Pertenece a un empleado que ya existe" />
    </RadioGroup>
    {mode === 'confirm' ? <PersonalProfileFields values={personal} requireFirstName referenceName={employee.originalName || employee.name} onChange={(key, value) => setPersonal((current) => ({ ...current, [key]: value }))} />
      : <>
        <TextField required select label="Empleado existente" value={targetId} onChange={(event) => setTargetId(event.target.value)}>
          {employees.filter((item) => item.id !== employee.id && item.identificationStatus === 'confirmed' && (!item.branchId || item.branchId === employee.branchId))
            .map((item) => <MenuItem key={item.id} value={item.id}>{item.name}{item.employeeNumber ? ` · ${item.employeeNumber}` : ''}</MenuItem>)}
        </TextField>
        <FormControlLabel control={<Checkbox checked={replaceClock} onChange={(event) => setReplaceClock(event.target.checked)} />} label="Usar este registro como su reloj actual" />
        <Alert severity="info">Se conservarán las checadas, fotos, datos originales y la ficha anterior en el historial. Los datos ya capturados del empleado tienen prioridad.</Alert>
      </>}
  </EditorDialog>
}
