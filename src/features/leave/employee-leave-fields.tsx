import Box from '@mui/material/Box'
import Stack from '@mui/material/Stack'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import type { Employee } from '../employees/types/employee'
import Autocomplete from '@mui/material/Autocomplete'
import Alert from '@mui/material/Alert'
import { useManagerOptions } from '../portal/api'
import { getApiErrorMessage } from '../../shared/api/api-error'
import { formatLeaveTimestamp } from './leave-format'
import type { LeaveProfile } from './types'
import type { EmployeeLeaveValues } from './employee-leave-form'

export default function EmployeeLeaveFields({ employeeId, value, profile, onChange }: {
  employeeId: string; value: EmployeeLeaveValues; profile: LeaveProfile; employees: Employee[]
  onChange: (value: EmployeeLeaveValues) => void
}) {
  const managers = useManagerOptions()
  const available = (managers.data ?? []).filter(employee => employee.id !== employeeId)
  if (profile.managerId && !available.some(employee => employee.id === profile.managerId)) available.push({ id: profile.managerId,name: profile.managerName ?? 'Jefe registrado',branchName: null })
  const update = (changes: Partial<EmployeeLeaveValues>) => onChange({ ...value, ...changes })
  return <>
    {managers.isError && <Alert severity="error">{getApiErrorMessage(managers.error)}</Alert>}
    <Autocomplete options={available} value={available.find(employee => employee.id === value.managerId) ?? null} loading={managers.isPending}
      getOptionKey={employee => employee.id} getOptionLabel={employee => `${employee.name}${employee.branchName ? ` (${employee.branchName})` : ''}`}
      isOptionEqualToValue={(left,right) => left.id === right.id} onChange={(_,employee) => update({ managerId: employee?.id ?? '' })}
      renderInput={params => <TextField {...params} label="Jefe directo" helperText="Puede pertenecer a otra sucursal. El jefe necesita una cuenta vinculada para resolver permisos." />} />
    <Box sx={{ pt: 2, borderTop: 1, borderColor: 'divider' }}><Stack spacing={2}>
      <Typography variant="h3" component="h3">Vacaciones</Typography>
      <TextField required type="number" label="Saldo de vacaciones (días)" value={value.vacationBalance}
        onChange={(event) => update({ vacationBalance: event.target.value })} slotProps={{ htmlInput: { min: 0, max: 10000, step: 1 } }}
        helperText="Solo se descuentan días laborables al aprobar una solicitud a cuenta de vacaciones." />
      {Number(value.vacationBalance) !== profile.vacationBalance && <TextField required multiline minRows={2} label="Motivo del ajuste"
        value={value.adjustmentReason} onChange={(event) => update({ adjustmentReason: event.target.value })} slotProps={{ htmlInput: { maxLength: 2000 } }} />}
      <Typography variant="body2">Saldo registrado: <strong>{profile.vacationBalance} días</strong>.</Typography>
      {profile.movements.length ? <TableContainer tabIndex={0} role="region" aria-label="Historial de vacaciones desplazable"><Table size="small" aria-label="Historial de vacaciones" sx={{ minWidth: 480 }}>
        <TableHead><TableRow><TableCell>Fecha</TableCell><TableCell>Movimiento</TableCell><TableCell align="right">Días</TableCell><TableCell align="right">Saldo</TableCell></TableRow></TableHead>
        <TableBody>{profile.movements.map((movement) => <TableRow key={movement.id}><TableCell>{formatLeaveTimestamp(movement.createdAt)}</TableCell><TableCell>{movement.reason}</TableCell>
          <TableCell align="right">{movement.days > 0 ? '+' : ''}{movement.days}</TableCell><TableCell align="right">{movement.balanceAfter}</TableCell></TableRow>)}</TableBody>
      </Table></TableContainer> : <Typography variant="body2" color="text.secondary">Aún no hay movimientos de vacaciones.</Typography>}
    </Stack></Box>
  </>
}
