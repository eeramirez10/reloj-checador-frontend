import Box from '@mui/material/Box'
import FormControlLabel from '@mui/material/FormControlLabel'
import MenuItem from '@mui/material/MenuItem'
import Switch from '@mui/material/Switch'
import TextField from '@mui/material/TextField'
import type { Employee } from '../employees/types/employee'
import { getToday } from './api'
import PersonalProfileFields from './personal-profile-fields'
import type { PersonalProfileValues } from './personal-profile'
import type { Branch } from './types'

export default function EmployeeGeneralFields({ employee, personal, branches, branchId, isActive, onPersonalChange, onBranchChange, onActiveChange }: {
  employee?: Employee; personal: PersonalProfileValues; branches: Branch[]; branchId: string; isActive: boolean
  onPersonalChange: (key: keyof PersonalProfileValues, value: string) => void
  onBranchChange: (id: string) => void; onActiveChange: (value: boolean) => void
}) {
  const branch = branches.find((item) => item.id === branchId)
  const clock = employee?.clockRecords.find((record) => record.bindingStatus === 'active')
  const hireDate = employee ? employee.hireDate?.slice(0,10) ?? '' : getToday(branch?.timeZone)
  const terminationDate = isActive ? '' : employee?.isActive === false ? employee.terminationDate?.slice(0,10) ?? '' : getToday(branch?.timeZone)
  return <>
    <PersonalProfileFields values={personal} requireFirstName={!employee} referenceName="" onChange={onPersonalChange} />
    <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' } }}>
      {employee ? <TextField label="Sucursal" value={employee.branchName || branch?.name || 'Sin asignar'} slotProps={{ input: { readOnly: true } }} />
        : <TextField required select label="Sucursal" value={branchId} onChange={(event) => onBranchChange(event.target.value)}>
          {branches.filter((item) => item.active).map((item) => <MenuItem key={item.id} value={item.id}>{item.name}</MenuItem>)}
        </TextField>}
      {employee && <TextField label="Reloj asignado" value={clock?.deviceName || 'Sin reloj asignado'} slotProps={{ input: { readOnly: true } }} />}
      {employee && <TextField label="ID en el reloj" value={clock?.userId || 'Sin ID asignado'} slotProps={{ input: { readOnly: true } }} />}
      <Box sx={{ display: 'flex', alignItems: 'center' }}><FormControlLabel label={isActive ? 'Activo' : 'Dado de baja'} control={<Switch checked={isActive} disabled={!employee}
        slotProps={{ input: { role: 'switch', 'aria-label': 'Empleado activo' } }} onChange={(_, checked) => onActiveChange(checked)} />} /></Box>
      <TextField type="date" label="Fecha de alta" value={hireDate} slotProps={{ input: { readOnly: true }, inputLabel: { shrink: true } }} helperText={employee ? 'Alta original, solo consulta.' : 'Se registra automáticamente al crear la ficha.'} />
      <TextField type="date" label="Fecha de baja" value={terminationDate} slotProps={{ input: { readOnly: true }, inputLabel: { shrink: true } }} helperText="Se registra al dar de baja; la reactivación conserva el historial." />
    </Box>
  </>
}
