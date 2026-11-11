import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import MenuItem from '@mui/material/MenuItem'
import Pagination from '@mui/material/Pagination'
import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import { useRef, useState } from 'react'
import { getOvertimeReportExport, useOvertimeReport } from '../features/attendance/api/overtime.api'
import EmployeeOvertimeCard from '../features/attendance/employee-overtime-card'
import OvertimeTotals from '../features/attendance/overtime-totals'
import type { BranchAttendanceFilters, BranchAttendanceRequest } from '../features/attendance/types/branch-attendance'
import { formatCardDate, validateAttendancePeriod } from '../features/employees/employee-attendance-format'
import { useBranches } from '../features/organization/api'
import { getApiErrorMessage } from '../shared/api/api-error'
import PageHeader from '../shared/ui/page-header'
import PageLoading from '../shared/ui/page-loading'
import AttendancePdfActions from '../features/attendance/pdf/attendance-pdf-actions'
import { useAttendancePdfExport } from '../features/attendance/pdf/use-attendance-pdf-export'
import CompanySelect from '../features/companies/company-select'

type FilterDraft = Omit<BranchAttendanceFilters, 'employeeStatus'> & { employeeStatus: BranchAttendanceFilters['employeeStatus'] | '' }

export default function OvertimePage() {
  const branches = useBranches()
  const [filters, setFilters] = useState<FilterDraft>({ branchId: '', employeeStatus: '', from: '', to: '' })
  const [request, setRequest] = useState<BranchAttendanceRequest | null>(null)
  const sequence = useRef(0)
  const results = useRef<HTMLDivElement>(null)
  const report = useOvertimeReport(request)
  const pdf = useAttendancePdfExport(request ? `overtime:${request.branchId}:${request.companyId ?? 'all'}:${request.employeeStatus}:${request.from}:${request.to}` : 'empty')
  const dateError = filters.from && filters.to ? validateAttendancePeriod(filters) : null
  const ready = Boolean(filters.branchId && filters.employeeStatus && filters.from && filters.to && !dateError)

  function update<Key extends keyof FilterDraft>(key: Key, value: FilterDraft[Key]) {
    pdf.cancel()
    setFilters((current) => ({ ...current, [key]: value }))
    setRequest(null)
  }
  function consult(page = 1) {
    if (!ready || !filters.employeeStatus || pdf.busy) return
    setRequest({ branchId: filters.branchId,companyId: filters.companyId || undefined, employeeStatus: filters.employeeStatus, from: filters.from, to: filters.to, page, sequence: ++sequence.current })
  }
  function exportPdf() {
    if (!request || report.isFetching || !report.data?.totalEmployees) return
    const selected = request
    void pdf.run(async (options) => {
      const [source, module] = await Promise.all([
        getOvertimeReportExport(selected, options.signal),
        import('../features/attendance/pdf/overtime-pdf'),
      ])
      return module.exportOvertimePdf(source, options)
    })
  }
  return <>
    <PageHeader title="Horas extras" description="Consulta horas extras por sucursal, empresa y estado actuales del empleado." />
    <Stack spacing={3}>
      {branches.isError && <Alert severity="error">{getApiErrorMessage(branches.error)}</Alert>}
      <Paper component="form" variant="outlined" sx={{ p: 2 }} onSubmit={(event) => { event.preventDefault(); if (pdf.busy) return; pdf.cancel(); consult() }}>
        <Box sx={{ display: 'grid', gap: 2, alignItems: 'start', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', lg: '1.2fr 1.2fr 1fr 1fr 1fr auto' } }}>
          <TextField fullWidth required select size="small" label="Sucursal" value={filters.branchId} disabled={branches.isPending}
            onChange={(event) => update('branchId', event.target.value)} slotProps={{ select: { displayEmpty: true }, inputLabel: { shrink: true } }}>
            <MenuItem value="" disabled>Selecciona sucursal</MenuItem>{(branches.data ?? []).map((branch) => <MenuItem key={branch.id} value={branch.id}>{branch.name}</MenuItem>)}
          </TextField>
          <CompanySelect value={filters.companyId ?? ''} onChange={value => update('companyId',value)} />
          <TextField fullWidth required select size="small" label="Estado del empleado" value={filters.employeeStatus}
            onChange={(event) => update('employeeStatus', event.target.value as FilterDraft['employeeStatus'])} slotProps={{ select: { displayEmpty: true }, inputLabel: { shrink: true } }}>
            <MenuItem value="" disabled>Selecciona estado</MenuItem><MenuItem value="active">Activos</MenuItem><MenuItem value="inactive">Inactivos</MenuItem>
          </TextField>
          <TextField fullWidth required size="small" type="date" label="Desde" value={filters.from} onChange={(event) => update('from', event.target.value)} slotProps={{ inputLabel: { shrink: true } }} />
          <TextField fullWidth required size="small" type="date" label="Hasta" value={filters.to} onChange={(event) => update('to', event.target.value)} slotProps={{ inputLabel: { shrink: true } }} />
          <Button type="submit" variant="contained" disabled={!ready || report.isFetching || pdf.busy}>{report.isFetching ? 'Consultando…' : 'Consultar'}</Button>
        </Box>
        {dateError && <Alert severity="error" sx={{ mt: 2 }}>{dateError}</Alert>}
      </Paper>
      {!request && <Paper variant="outlined" sx={{ p: { xs: 3, sm: 4 } }}>
        <Typography component="h2" variant="h3" sx={{ mb: 1 }}>Selecciona los filtros para consultar</Typography>
        <Typography variant="body2" color="text.secondary">Elige sucursal, estado y fechas Desde / Hasta. Pulsa Consultar para ver el desglose diario y los totales.</Typography>
      </Paper>}
      {request && <Box ref={results} sx={{ scrollMarginTop: '84px' }}>
        {report.isFetching ? <PageLoading /> : report.isError ? <Alert severity="error">{getApiErrorMessage(report.error)}</Alert> : report.data && <Stack spacing={3}>
          {!report.data.totalEmployees ? <Alert severity="info">No hay empleados con horas extras habilitadas para estos filtros.</Alert> : <>
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ justifyContent: 'space-between', alignItems: { md: 'center' } }}>
              <Stack spacing={0.5}>
                <Typography component="h2" variant="h3">{report.data.branch.name} · {report.data.totalEmployees} empleados {report.data.employeeStatus === 'active' ? 'activos' : 'inactivos'}</Typography>
                <Typography variant="body2">Empresa: {report.data.companyFilter?.name ?? 'Todas las empresas'}</Typography>
                <Typography variant="body2" color="text.secondary">Del {formatCardDate(report.data.period.from)} al {formatCardDate(report.data.period.to)} · Página {report.data.page} de {report.data.totalPages}</Typography>
              </Stack>
              <AttendancePdfActions pdf={pdf} disabled={report.isFetching} onExport={exportPdf} title="Reporte imprimible en carta horizontal, con todos los empleados y totales de los filtros consultados, incluidas las demás páginas." />
            </Stack>
            <Paper variant="outlined" sx={{ overflow: 'hidden' }}><OvertimeTotals totals={report.data.totals} label="Total del periodo · todos los empleados" /></Paper>
             <Typography variant="caption" color="text.secondary">Tiempos en horas:minutos, sin redondear cada día para sumar. Antes y después ya descuentan los márgenes de extras de la sucursal, sin compensar retardos. En días de descanso, todo el tiempo trabajado es extra. Las fechas conservan la jornada y reglas de sucursal vigentes.</Typography>
            {report.data.employees.map((employee) => <EmployeeOvertimeCard key={`${request.sequence}:${employee.employee.id}`} report={employee} />)}
            {report.data.totalPages > 1 && <Pagination aria-label="Páginas de horas extras" disabled={pdf.busy} sx={{ alignSelf: 'center' }} count={report.data.totalPages} page={report.data.page}
              onChange={(_, page) => { consult(page); results.current?.scrollIntoView({ block: 'start' }) }} />}
          </>}
        </Stack>}
      </Box>}
    </Stack>
  </>
}
