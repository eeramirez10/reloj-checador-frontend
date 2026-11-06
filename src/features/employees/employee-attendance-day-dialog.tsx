import Alert from '@mui/material/Alert'
import Button from '@mui/material/Button'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import Stack from '@mui/material/Stack'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import Typography from '@mui/material/Typography'
import { movementLabels } from '../organization/attendance-labels'
import type { EmployeeAttendanceDay } from './types/employee-attendance'
import { attendanceObservations, formatCardDate, formatWorkedTime } from './employee-attendance-format'
import RouteDetails from '../attendance/route-details'

export default function EmployeeAttendanceDayDialog({ day, onClose }: { day: EmployeeAttendanceDay; onClose: () => void }) {
  return <Dialog open fullWidth maxWidth="sm" onClose={onClose}>
    <DialogTitle>Movimientos del {formatCardDate(day.date)}</DialogTitle>
    <DialogContent dividers>
      <Stack spacing={2}>
        <Typography variant="body2">{day.branchName || 'Sin sucursal'} · {day.timeZone}</Typography>
        <RouteDetails routes={day.routes} />
        {attendanceObservations(day).map((message) => <Alert key={message} severity="info">{message}</Alert>)}
        <TableContainer><Table size="small" aria-label="Marcas originales del día">
          <TableHead><TableRow><TableCell>Fecha y hora local</TableCell><TableCell>Movimiento</TableCell></TableRow></TableHead>
          <TableBody>{!day.punches.length && <TableRow><TableCell colSpan={2}>No hay checadas originales en esta fecha.</TableCell></TableRow>}{day.punches.map((punch) => <TableRow key={punch.id}>
            <TableCell sx={{ whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums' }}>{punch.localTime}</TableCell>
            <TableCell>{movementLabels[punch.movement]}</TableCell>
          </TableRow>)}</TableBody>
        </Table></TableContainer>
        <Typography variant="body2">Tiempo trabajado: {day.workedMinutes === null ? 'Pendiente de completar movimientos' : formatWorkedTime(day.workedMinutes)}.</Typography>
      </Stack>
    </DialogContent>
    <DialogActions><Button onClick={onClose}>Cerrar</Button></DialogActions>
  </Dialog>
}
