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
import EmployeeSelect from './employee-select'
import { formatLeaveTimestamp } from './leave-format'
import type { LeaveProfile } from './types'
import type { EmployeeLeaveValues } from './employee-leave-form'

export default function EmployeeLeaveFields({ employeeId, value, profile, employees, onChange }: {
  employeeId: string; value: EmployeeLeaveValues; profile: LeaveProfile; employees: Employee[]
  onChange: (value: EmployeeLeaveValues) => void
}) {
  const available = employees.filter((employee) => employee.id !== employeeId
    && (employee.isActive && employee.identificationStatus === 'confirmed' || employee.id === profile.managerId))
  const update = (changes: Partial<EmployeeLeaveValues>) => onChange({ ...value, ...changes })
  return <>
    <EmployeeSelect employees={available} value={value.managerId} onChange={(managerId) => update({ managerId })} label="Jefe directo" />
    <TextField label="WhatsApp del empleado" type="tel" value={value.whatsappPhone} onChange={(event) => update({ whatsappPhone: event.target.value })}
      placeholder="+525512345678" helperText="Incluye + y código de país. El WhatsApp del jefe se configura en su propia ficha."
      slotProps={{ htmlInput: { pattern: '\\+[1-9][0-9]{7,14}', maxLength: 16 } }} />
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
