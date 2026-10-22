import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded'
import Alert from '@mui/material/Alert'
import Button from '@mui/material/Button'
import Stack from '@mui/material/Stack'
import { useState } from 'react'
import { Link as RouterLink, useParams, useSearchParams } from 'react-router-dom'
import { useEmployeeAttendance } from '../features/employees/api/employee-attendance.api'
import EmployeeAttendanceCard from '../features/employees/employee-attendance-card'
import EmployeeAttendancePeriod from '../features/employees/employee-attendance-period'
import { validateAttendancePeriod } from '../features/employees/employee-attendance-format'
import { getToday } from '../features/organization/api'
import { getApiErrorMessage } from '../shared/api/api-error'
import PageHeader from '../shared/ui/page-header'
import PageLoading from '../shared/ui/page-loading'
import AttendancePdfActions from '../features/attendance/pdf/attendance-pdf-actions'
import { useAttendancePdfExport } from '../features/attendance/pdf/use-attendance-pdf-export'

export default function EmployeeAttendancePage() {
  const { id = '' } = useParams()
  const [params, setParams] = useSearchParams()
  const [defaults] = useState(() => { const today = getToday(); return { from: `${today.slice(0,7)}-01`, to: today } })
  const period = { from: params.get('from') ?? defaults.from, to: params.get('to') ?? defaults.to }
  const invalid = validateAttendancePeriod(period)
  const report = useEmployeeAttendance(id, period)
  const pdf = useAttendancePdfExport(`${id}:${period.from}:${period.to}`)
  function exportPdf() {
    const card = report.data
    if (!card || invalid || report.isFetching || report.isError) return
    void pdf.run(async (options) => {
      const { exportAttendancePdf, attendancePdfFilename } = await import('../features/attendance/pdf/attendance-pdf')
      return exportAttendancePdf({ cards: [card], scopeLabel: 'Reporte individual',
        timeZone: card.days.at(-1)?.timeZone ?? 'America/Mexico_City' },
      attendancePdfFilename(card.employee.employeeNumber || card.employee.name,card.period.from,card.period.to),options)
    })
  }
  return <>
    <PageHeader title="Tarjeta de asistencia" description="Revisa las horas registradas y el cumplimiento del horario de cada día."
      action={<Stack spacing={1} sx={{ alignItems: { sm: 'flex-end' } }}>
        <Button component={RouterLink} to="/employees" variant="outlined" startIcon={<ArrowBackRoundedIcon />}>Volver a empleados</Button>
        <AttendancePdfActions pdf={pdf} disabled={!report.data || Boolean(invalid) || report.isFetching || report.isError} onExport={exportPdf} />
      </Stack>} />
    <Stack spacing={3}>
      <EmployeeAttendancePeriod key={`period:${id}:${period.from}:${period.to}`} period={period} busy={report.isFetching} onSubmit={(next) => {
        pdf.cancel()
        if (next.from === period.from && next.to === period.to) void report.refetch()
        else setParams({ from: next.from, to: next.to })
      }} />
      {invalid && <Alert severity="error">{invalid}</Alert>}
      {report.isError && <Alert severity="error" action={<Button color="inherit" onClick={() => void report.refetch()}>Reintentar</Button>}>{getApiErrorMessage(report.error)}</Alert>}
      {!invalid && report.isPending && <PageLoading />}
      {!invalid && report.data && <EmployeeAttendanceCard key={`card:${id}:${period.from}:${period.to}`} card={report.data} />}
    </Stack>
  </>
}
