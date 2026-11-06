import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import Typography from '@mui/material/Typography'
import { useState } from 'react'
import { formatCardDate } from '../employees/employee-attendance-format'
import EmployeeAttendanceDayDialog from '../employees/employee-attendance-day-dialog'
import type { EmployeeAttendanceDay } from '../employees/types/employee-attendance'
import { formatAttendanceTime } from '../organization/attendance-labels'
import { formatExactOvertime, formatOvertime, formatOvertimeMargins } from './overtime-format'
import OvertimeTotals from './overtime-totals'
import type { EmployeeOvertimeReport } from './types/overtime'

const labels = { calculated: 'Calculado', pending: 'Pendiente', no_records: 'Sin registros' }

export default function EmployeeOvertimeCard({ report }: { report: EmployeeOvertimeReport }) {
  const [detail, setDetail] = useState<EmployeeAttendanceDay | null>(null)
  return <>
    <Paper component="section" aria-label={`Horas extras de ${report.employee.name}`} variant="outlined" sx={{ overflow: 'hidden' }}>
      <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
        <Typography variant="h3" component="h3">{report.employee.name}</Typography>
        <Typography variant="body2" color="text.secondary">{report.employee.employeeNumber ? `Empleado ${report.employee.employeeNumber}` : 'Sin número de empleado'} · {report.employee.branchName || 'Sin sucursal'}</Typography>
      </Box>
      <TableContainer tabIndex={0} role="region" aria-label={`Desglose diario de ${report.employee.name}`}>
        <Table size="small" sx={{ minWidth: 1200, '& th, & td': { verticalAlign: 'top', fontVariantNumeric: 'tabular-nums' }, '& thead': { bgcolor: 'background.default' } }}>
          <TableHead><TableRow>
            {['Fecha', 'Jornada de sucursal', 'Entrada / salida', 'Antes', 'Después', 'Día de descanso', 'Extras brutas', 'Descanso diario', 'Descanso adicional', 'Extras netas', 'Estado'].map((label) => <TableCell key={label}>{label}</TableCell>)}
          </TableRow></TableHead>
          <TableBody>{report.days.map((day) => {
             const extra = day.overtime
             const margins = formatOvertimeMargins(extra)
            return <TableRow key={day.date}>
              <TableCell component="th" scope="row" sx={{ whiteSpace: 'nowrap' }}>{formatCardDate(day.date)}</TableCell>
               <TableCell><Stack><span style={{ whiteSpace: 'nowrap' }}>{extra.referenceEntryTime && extra.referenceExitTime ? `${extra.referenceEntryTime}–${extra.referenceExitTime}` : day.scheduleSettings ? `${day.scheduleSettings.entryTime}–${day.scheduleSettings.exitTime}` : 'Sin jornada'}</span><Typography variant="caption" color="text.secondary">{day.branchName}</Typography>
                 {margins && <Typography variant="caption" color="text.secondary" sx={{ minWidth: 150, maxWidth: 220 }}>{margins}</Typography>}</Stack></TableCell>
              <TableCell><Stack><span style={{ whiteSpace: 'nowrap' }}>{formatAttendanceTime(day.entry ?? undefined, day.timeZone)} / {formatAttendanceTime(day.exit ?? undefined, day.timeZone)}</span>
                {day.routes?.length ? <Typography variant="caption" color="text.secondary">{day.routes.length} tramo(s) de ruta</Typography> : null}
                {(day.punches.length > 0 || day.routes?.length) ? <Button size="small" sx={{ p: 0, alignSelf: 'flex-start' }} onClick={() => setDetail(day)}>Ver detalle</Button> : null}
              </Stack></TableCell>
              {[extra.beforeSeconds, extra.afterSeconds, extra.dayOffSeconds, extra.grossSeconds, extra.dailyRestSeconds, extra.additionalRestSeconds].map((value, index) => <TableCell key={index} title={formatExactOvertime(value)}>{formatOvertime(value)}</TableCell>)}
              <TableCell title={formatExactOvertime(extra.netSeconds)} sx={{ fontWeight: 600, color: 'primary.dark' }}>{formatOvertime(extra.netSeconds)}</TableCell>
              <TableCell><Stack spacing={0.5}><Chip size="small" variant="outlined" color={extra.status === 'pending' ? 'warning' : extra.status === 'calculated' ? 'success' : 'default'} label={labels[extra.status]} />
                {extra.issue && <Typography variant="caption" sx={{ maxWidth: 220 }}>{extra.issue}</Typography>}
              </Stack></TableCell>
            </TableRow>
          })}</TableBody>
        </Table>
      </TableContainer>
      <OvertimeTotals totals={report.totals} label="Total del empleado" />
    </Paper>
    {detail && <EmployeeAttendanceDayDialog day={detail} onClose={() => setDetail(null)} />}
  </>
}
