import Avatar from '@mui/material/Avatar'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableFooter from '@mui/material/TableFooter'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import Typography from '@mui/material/Typography'
import { useState } from 'react'
import { formatAttendanceTime } from '../organization/attendance-labels'
import type { EmployeeAttendanceCard as AttendanceCard, EmployeeAttendanceDay } from './types/employee-attendance'
import { attendanceObservations, attendanceStatusLabels, formatCardDate, formatCardWeekday, formatWorkedTime } from './employee-attendance-format'
import EmployeeAttendanceDayDialog from './employee-attendance-day-dialog'

function DayStatus({ day }: { day: EmployeeAttendanceDay }) {
  const color = day.status === 'complete' ? 'success' : ['authorized_absence','authorized_work'].includes(day.status) ? 'info' : ['incomplete','ambiguous','unconfigured','no_records'].includes(day.status) ? 'warning' : 'default'
  return <Chip size="small" variant="outlined" color={color} label={attendanceStatusLabels[day.status]} />
}

export default function EmployeeAttendanceCard({ card }: { card: AttendanceCard }) {
  const [detail, setDetail] = useState<EmployeeAttendanceDay | null>(null)
  const { employee, period, summary } = card
  const statistics = [
    ['Jornadas completas', summary.completeDays], ['Por revisar', summary.incompleteDays],
    ['Sin registros', summary.daysWithoutRecords], ['Retardos de llegada', summary.arrivalTardies],
    ['Retardos de comida', summary.mealTardies], ['Salidas anticipadas', summary.earlyExits],
  ] as const
  return <>
    <Paper variant="outlined" sx={{ overflow: 'hidden', borderTop: 3, borderTopColor: 'primary.main' }}>
      <Box sx={{ p: { xs: 2, sm: 3 }, borderBottom: 1, borderColor: 'divider' }}>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ justifyContent: 'space-between', alignItems: { md: 'center' } }}>
          <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center', minWidth: 0 }}>
            <Avatar sx={{ width: 48, height: 48, bgcolor: 'primary.light', color: 'primary.dark' }}>{employee.name.slice(0,1)}</Avatar>
            <Stack sx={{ minWidth: 0 }}><Typography component="h2" variant="h3" sx={{ overflowWrap: 'anywhere' }}>{employee.name}</Typography>
              <Typography variant="body2" color="text.secondary">{employee.employeeNumber ? `Empleado ${employee.employeeNumber}` : 'Sin número de empleado'}{employee.position ? ` · ${employee.position}` : ''}</Typography></Stack>
          </Stack>
          <Typography variant="body2" sx={{ fontWeight: 500 }}>Del {formatCardDate(period.from)} al {formatCardDate(period.to)}</Typography>
        </Stack>
        <Box component="dl" sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(2, minmax(0, 1fr))', sm: 'repeat(3, minmax(0, 1fr))' }, gap: 2, mb: 0, mt: 2.5,
          '& > div:first-of-type': { gridColumn: { xs: '1 / -1', sm: 'auto' } },
          '& dt': { color: 'text.secondary', fontSize: '0.75rem' }, '& dd': { m: 0, mt: 0.5, fontSize: '0.875rem', overflowWrap: 'anywhere' } }}>
          <div><dt>Sucursal actual</dt><dd>{employee.branchName || 'Sin asignar'}</dd></div>
          <div><dt>Empresa actual</dt><dd>{employee.companyName || 'Sin empresa'}</dd></div>
          <div><dt>RFC</dt><dd>{employee.rfc || 'No registrado'}</dd></div>
          <div><dt>NSS</dt><dd>{employee.imss || 'No registrado'}</dd></div>
        </Box>
      </Box>
      <TableContainer tabIndex={0} role="region" aria-label="Calendario de asistencia desplazable" sx={{ '&:focus-visible': { outline: '2px solid', outlineColor: 'primary.main', outlineOffset: -2 } }}>
        <Table size="small" aria-label="Tarjeta de asistencia del empleado" sx={{ minWidth: 980, tableLayout: 'fixed',
          '& th, & td': { px: 1.25, py: 1.5, fontSize: '0.8125rem' }, '& thead th': { bgcolor: 'background.default', fontWeight: 600 },
          '& td': { fontVariantNumeric: 'tabular-nums', verticalAlign: 'top' } }}>
          <TableHead><TableRow>
            <TableCell sx={{ position: 'sticky', left: 0, zIndex: 2, width: 100 }}>Fecha</TableCell><TableCell sx={{ width: 45 }}>Día</TableCell><TableCell sx={{ width: 110 }}>Jornada</TableCell><TableCell sx={{ width: 70 }}>Entrada</TableCell>
            <TableCell sx={{ width: 95 }}>Salida a comer</TableCell><TableCell sx={{ width: 75 }}>Regreso</TableCell><TableCell sx={{ width: 95 }}>Salida laboral</TableCell>
            <TableCell sx={{ width: 65 }}>Horas</TableCell><TableCell sx={{ width: 105 }}>Estado</TableCell><TableCell sx={{ width: 220 }}>Observaciones</TableCell>
          </TableRow></TableHead>
          <TableBody>{card.days.map((day) => {
            const observations = attendanceObservations(day)
            const time = (value: string | null) => formatAttendanceTime(value ?? undefined, day.timeZone)
            return <TableRow key={day.date} sx={{ bgcolor: day.status === 'day_off' ? 'background.default' : 'background.paper' }}>
              <TableCell component="th" scope="row" sx={{ whiteSpace: 'nowrap', position: 'sticky', left: 0, zIndex: 1, bgcolor: 'inherit' }}>{formatCardDate(day.date)}</TableCell>
              <TableCell sx={{ textTransform: 'capitalize' }}>{formatCardWeekday(day.date)}</TableCell>
              <TableCell><Stack spacing={0.25}><Typography variant="inherit" sx={{ whiteSpace: 'nowrap' }}>{day.scheduleSettings ? `${day.scheduleSettings.entryTime}–${day.scheduleSettings.exitTime}` : 'Sin horario'}</Typography>
                <Typography variant="caption" color="text.secondary">{day.branchName || 'Sin sucursal'}</Typography></Stack></TableCell>
              <TableCell>{time(day.entry)}</TableCell><TableCell>{time(day.mealDeparture)}</TableCell>
              <TableCell><Stack><span>{time(day.mealReturn)}</span>{day.mealMinutes !== null && <Typography variant="caption" color="text.secondary">{day.mealMinutes} min</Typography>}</Stack></TableCell>
              <TableCell>{time(day.exit)}</TableCell><TableCell sx={{ fontWeight: day.workedMinutes !== null ? 600 : 400 }}>{formatWorkedTime(day.workedMinutes)}</TableCell>
              <TableCell><DayStatus day={day} /></TableCell>
              <TableCell sx={{ overflowWrap: 'anywhere' }}><Stack spacing={0.5}>
                {observations.map((message) => <Typography key={message} variant="caption">{message}</Typography>)}
                {!observations.length && <Typography variant="caption" color="text.secondary">{day.status === 'no_records' ? 'No hay checadas para este día.' : day.status === 'complete' ? 'Sin observaciones' : '—'}</Typography>}
                {(day.punches.length > 0 || day.routes?.length) ? <Button size="small" onClick={() => setDetail(day)} sx={{ alignSelf: 'flex-start', p: 0, minWidth: 0 }}>{day.routes?.length ? 'Ver detalle de ruta' : `Ver marcas (${day.punches.length})`}</Button> : null}
              </Stack></TableCell>
            </TableRow>
          })}</TableBody>
          <TableFooter><TableRow>
            <TableCell colSpan={7} sx={{ fontWeight: 600, color: 'text.primary' }}>Total de horas calculables</TableCell>
            <TableCell sx={{ fontWeight: 600, color: 'text.primary', whiteSpace: 'nowrap' }}>{formatWorkedTime(summary.calculableDays ? summary.workedMinutes : null)}</TableCell>
            <TableCell colSpan={2}>{summary.calculableDays} de {summary.recordedDays} días con registros</TableCell>
          </TableRow></TableFooter>
        </Table>
      </TableContainer>
      <Box component="dl" aria-label="Resumen del periodo" sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)', xl: 'repeat(6, 1fr)' },
        gap: 2, p: { xs: 2, sm: 3 }, m: 0, borderTop: 1, borderColor: 'divider', '& dt': { fontSize: '0.75rem', color: 'text.secondary' }, '& dd': { m: 0, mt: 0.5, fontSize: '1.25rem', fontWeight: 600 } }}>
        {statistics.map(([label,value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}
      </Box>
      <Typography component="p" variant="caption" color="text.secondary" sx={{ px: { xs: 2, sm: 3 }, mt: 0, mb: 2 }}>
        {summary.daysOff} días de descanso. {summary.authorizedAbsenceDays ? `${summary.authorizedAbsenceDays} días de ausencia autorizada. ` : ''}{summary.authorizedWorkDays?`${summary.authorizedWorkDays} días de trabajo fuera de oficina autorizado. `:''}Las horas corresponden solo a jornadas con tiempo calculable. Los movimientos y el horario se muestran en la zona local de cada sucursal.
      </Typography>
    </Paper>
    {detail && <EmployeeAttendanceDayDialog day={detail} onClose={() => setDetail(null)} />}
  </>
}
