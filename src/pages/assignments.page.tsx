import Alert from '@mui/material/Alert'
import Button from '@mui/material/Button'
import Checkbox from '@mui/material/Checkbox'
import MenuItem from '@mui/material/MenuItem'
import Pagination from '@mui/material/Pagination'
import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import { useState } from 'react'
import { useEmployees } from '../features/employees/hooks/use-employees'
import { getToday, useBranches, useScheduleAssignments, useSchedules } from '../features/organization/api'
import AssignmentDialog from '../features/organization/assignment-dialog'
import type { AssignmentTargets } from '../features/organization/types'
import { getApiErrorMessage } from '../shared/api/api-error'
import PageHeader from '../shared/ui/page-header'
import PageLoading from '../shared/ui/page-loading'

export default function AssignmentsPage() {
  const employees = useEmployees({ limit: 500 })
  const branches = useBranches()
  const schedules = useSchedules()
  const assignments = useScheduleAssignments()
  const [search, setSearch] = useState('')
  const [branchId, setBranchId] = useState('')
  const [selected, setSelected] = useState<Set<string>>(() => new Set())
  const [page, setPage] = useState(1)
  const [targets, setTargets] = useState<AssignmentTargets | null>(null)
  const today = getToday()
  const people = (employees.data ?? []).map((employee) => ({ id: employee.id, name: employee.name, number: employee.employeeNumber,
    branchId: employee.branchId, identificationStatus: employee.identificationStatus,
    clockIds: employee.clockRecords.filter((record) => record.bindingStatus === 'active').map((record) => record.userId).join(', '),
  })).sort((a, b) => a.name.localeCompare(b.name, 'es-MX'))
  const normalized = search.trim().toLocaleLowerCase('es-MX')
  const filtered = people.filter((person) => (!branchId || (branchId === 'unassigned' ? !person.branchId : person.branchId === branchId))
    && (!normalized || `${person.name} ${person.number} ${person.clockIds}`.toLocaleLowerCase('es-MX').includes(normalized)))
  const visible = filtered.slice((page - 1) * 40, page * 40)
  const branchNames = new Map((branches.data ?? []).map((branch) => [branch.id, branch.name]))
  const scheduleMap = new Map((schedules.data ?? []).map((schedule) => [schedule.id, schedule]))
  const queries = [employees, branches, schedules, assignments]
  function openAssignment(ids: Set<string>) {
    setTargets({ employeeIds: people.filter((person) => ids.has(person.id)).map((person) => person.id) })
  }
  return (
    <>
      <PageHeader title="Asignaciones" description="Asigna sucursal y horario individual a una o varias fichas de empleado."
        action={<Button disabled={selected.size === 0} variant="contained" onClick={() => openAssignment(selected)}>Asignar a seleccionados ({selected.size})</Button>} />
      <Stack spacing={2}>
        {queries.filter((query) => query.isError).map((query, index) => <Alert key={index} severity="error">{getApiErrorMessage(query.error)}</Alert>)}
        <Paper variant="outlined" sx={{ p: 2 }}><Stack spacing={2} direction={{ xs: 'column', sm: 'row' }}>
          <TextField fullWidth size="small" label="Buscar persona" placeholder="Nombre, número de empleado o ID del reloj" value={search} onChange={(event) => { setSearch(event.target.value); setPage(1) }} />
          <TextField fullWidth size="small" select label="Sucursal" value={branchId} onChange={(event) => { setBranchId(event.target.value); setPage(1) }} sx={{ maxWidth: { sm: 300 } }}>
            <MenuItem value="">Todas</MenuItem><MenuItem value="unassigned">Sin asignar</MenuItem>
            {(branches.data ?? []).map((branch) => <MenuItem key={branch.id} value={branch.id}>{branch.name}</MenuItem>)}
          </TextField>
        </Stack></Paper>
        {queries.some((query) => query.isPending) ? <PageLoading /> : <>
          <Stack direction="row" sx={{ justifyContent: 'space-between' }}><Typography variant="body2" color="text.secondary">{filtered.length} personas</Typography><Button size="small" onClick={() => setSelected(new Set())}>Limpiar selección</Button></Stack>
          <TableContainer component={Paper} variant="outlined"><Table aria-label="Asignaciones de personas" sx={{ minWidth: 950 }}>
            <TableHead><TableRow>
              <TableCell padding="checkbox"><Checkbox slotProps={{ input: { 'aria-label': 'Seleccionar página' } }} checked={visible.length > 0 && visible.every((person) => selected.has(person.id))} indeterminate={visible.some((person) => selected.has(person.id)) && !visible.every((person) => selected.has(person.id))} onChange={(event) => setSelected((current) => { const next = new Set(current); for (const person of visible) { if (event.target.checked) next.add(person.id); else next.delete(person.id) } return next })} /></TableCell>
              <TableCell>Persona</TableCell><TableCell>IDs en relojes</TableCell><TableCell>Sucursal</TableCell><TableCell>Horario vigente</TableCell><TableCell>Acciones</TableCell>
            </TableRow></TableHead>
            <TableBody>{visible.map((person) => {
              const assignment = assignments.data?.find((item) => (item.employeeId === person.id || item.deviceUserId === person.id) && item.effectiveFrom <= today)
              const schedule = assignment?.scheduleId ? scheduleMap.get(assignment.scheduleId) : schedules.data?.find((item) => item.branchId === person.branchId && item.isDefault && item.effectiveFrom <= today)
              return <TableRow key={person.id} hover>
                <TableCell padding="checkbox"><Checkbox checked={selected.has(person.id)} slotProps={{ input: { 'aria-label': `Seleccionar ${person.name}` } }} onChange={(event) => setSelected((current) => { const next = new Set(current); if (event.target.checked) next.add(person.id); else next.delete(person.id); return next })} /></TableCell>
                <TableCell><Stack><Typography variant="body2" sx={{ fontWeight: 500 }}>{person.name}</Typography><Typography variant="caption" color="text.secondary">{person.identificationStatus === 'pending' ? 'Pendiente de identificar' : person.number || person.id}</Typography></Stack></TableCell>
                <TableCell>{person.clockIds || 'Sin reloj asignado'}</TableCell><TableCell>{branchNames.get(person.branchId ?? '') || 'Sin asignar'}</TableCell>
                <TableCell><Stack><Typography variant="body2">{schedule?.name || 'Sin horario'}</Typography>{assignment && <Typography variant="caption" color="text.secondary">Desde {assignment.effectiveFrom}</Typography>}</Stack></TableCell>
                <TableCell><Button size="small" onClick={() => openAssignment(new Set([person.id]))}>Asignar</Button></TableCell>
              </TableRow>
            })}{!visible.length && <TableRow><TableCell colSpan={6}>No hay personas con estos filtros.</TableCell></TableRow>}</TableBody>
          </Table></TableContainer>
          {filtered.length > 40 && <Pagination sx={{ alignSelf: 'center' }} count={Math.ceil(filtered.length / 40)} page={page} onChange={(_, value) => setPage(value)} />}
        </>}
      </Stack>
      {targets && <AssignmentDialog targets={targets} title="Asignar sucursal y horario" onClose={() => { setTargets(null); setSelected(new Set()) }} />}
    </>
  )
}
