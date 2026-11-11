import Alert from '@mui/material/Alert'
import Button from '@mui/material/Button'
import Stack from '@mui/material/Stack'
import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useMyProfile } from '../features/portal/api'
import type { EmployeeAttendanceCard as AttendanceCard } from '../features/employees/types/employee-attendance'
import EmployeeAttendanceCard from '../features/employees/employee-attendance-card'
import EmployeeAttendancePeriod from '../features/employees/employee-attendance-period'
import { validateAttendancePeriod } from '../features/employees/employee-attendance-format'
import AttendancePdfActions from '../features/attendance/pdf/attendance-pdf-actions'
import { useAttendancePdfExport } from '../features/attendance/pdf/use-attendance-pdf-export'
import { getToday } from '../features/organization/api'
import { httpClient } from '../shared/api/http-client'
import { getApiErrorMessage } from '../shared/api/api-error'
import PageHeader from '../shared/ui/page-header'
import PageLoading from '../shared/ui/page-loading'

export function MyTodayPage() { return <MyAttendancePage today /> }

export default function MyAttendancePage({ today = false }: { today?: boolean }) {
  const profile = useMyProfile()
  if (profile.isPending) return <PageLoading />
  if (profile.isError) return <Alert severity="error">{getApiErrorMessage(profile.error)}</Alert>
  return <MyAttendance key={`${today}:${profile.data.employeeId}`} today={today} timeZone={profile.data.timeZone} />
}
function MyAttendance({ today,timeZone }: { today: boolean; timeZone: string }) {
  const [params,setParams] = useSearchParams()
  const [defaults] = useState(() => { const date = getToday(timeZone); return { from: `${date.slice(0,7)}-01`,to: date } })
  const period = { from: params.get('from') ?? defaults.from,to: params.get('to') ?? defaults.to }
  const invalid = today ? null : validateAttendancePeriod(period)
  const report = useQuery({ queryKey: ['my-attendance',today ? 'today' : period],enabled: !invalid,
    queryFn: async ({ signal }) => (await httpClient.get<AttendanceCard>(today ? '/me/attendance/today' : '/me/attendance/card',{ signal,params: today ? undefined : period })).data,
    refetchInterval: today ? 60_000 : false })
  const pdf = useAttendancePdfExport(`self:${period.from}:${period.to}`)
  function exportPdf() {
    const card = report.data
    if (!card || invalid || report.isFetching) return
    void pdf.run(async options => {
      const { exportAttendancePdf,attendancePdfFilename } = await import('../features/attendance/pdf/attendance-pdf')
      return exportAttendancePdf({ cards: [card],scopeLabel: 'Mi tarjeta de asistencia',timeZone },attendancePdfFilename(card.employee.employeeNumber || card.employee.name,card.period.from,card.period.to),options)
    })
  }
  return <><PageHeader title={today ? 'Mi asistencia de hoy' : 'Mi tarjeta de asistencia'} description={today ? 'Tus movimientos y el estado de tu jornada. Se actualiza cada minuto.' : 'Consulta tu asistencia por periodo y descarga tu tarjeta.'}
    action={today ? <Button variant="outlined" disabled={report.isFetching} onClick={() => void report.refetch()}>Actualizar</Button> : <AttendancePdfActions pdf={pdf} disabled={!report.data || report.isFetching || Boolean(invalid)} onExport={exportPdf} />} />
    <Stack spacing={3}>
      {!today && <EmployeeAttendancePeriod key={`${period.from}:${period.to}`} period={period} busy={report.isFetching} onSubmit={next => { pdf.cancel(); setParams({ from: next.from,to: next.to }) }} />}
      {invalid && <Alert severity="error">{invalid}</Alert>}
      {report.isError && <Alert severity="error">{getApiErrorMessage(report.error)}</Alert>}
      {report.isPending && !invalid && <PageLoading />}
      {report.data && !invalid && <EmployeeAttendanceCard card={report.data} />}
    </Stack>
  </>
}
