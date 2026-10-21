import AddRoundedIcon from '@mui/icons-material/AddRounded'
import Alert from '@mui/material/Alert'
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
import { Link as RouterLink } from 'react-router-dom'
import { getToday, useBranches, usePolicies, useSchedules } from '../features/organization/api'
import PolicyDialog from '../features/organization/policy-dialog'
import ScheduleDialog from '../features/organization/schedule-dialog'
import type { Branch, WorkSchedule } from '../features/organization/types'
import { getApiErrorMessage } from '../shared/api/api-error'
import PageHeader from '../shared/ui/page-header'
import PageLoading from '../shared/ui/page-loading'

export default function SchedulesPage() {
  const branches = useBranches()
  const policies = usePolicies()
  const schedules = useSchedules()
  const [policyBranch, setPolicyBranch] = useState<Branch | null>(null)
  const [editing, setEditing] = useState<WorkSchedule | 'new' | null>(null)
  const today = getToday()
  const branchNames = new Map((branches.data ?? []).map((branch) => [branch.id, branch.name]))
  const errors = [branches, policies, schedules].filter((query) => query.isError)
  return (
    <>
      <PageHeader title="Horarios y reglas" description="Define jornadas, comida y políticas de retardos con fecha de vigencia."
        action={<Stack direction="row" spacing={1}><Button component={RouterLink} to="/assignments" variant="outlined">Asignar a personas</Button><Button startIcon={<AddRoundedIcon />} variant="contained" onClick={() => setEditing('new')}>Crear horario</Button></Stack>} />
      <Stack spacing={3}>
        {errors.map((query, index) => <Alert key={index} severity="error">{getApiErrorMessage(query.error)}</Alert>)}
        {(branches.isPending || policies.isPending || schedules.isPending) ? <PageLoading /> : <>
          <Stack spacing={1.5}>
            <Typography component="h2" variant="h3">Reglas por sucursal</Typography>
            <TableContainer component={Paper} variant="outlined"><Table sx={{ minWidth: 900 }} aria-label="Reglas por sucursal">
              <TableHead><TableRow><TableCell>Sucursal</TableCell><TableCell>Tolerancia entrada</TableCell><TableCell>Tolerancia comida</TableCell><TableCell>Permitidos llegada / comida</TableCell><TableCell>Acumulación</TableCell><TableCell>Vigencia</TableCell><TableCell>Acciones</TableCell></TableRow></TableHead>
              <TableBody>{(branches.data ?? []).map((branch) => {
                const current = policies.data?.find((policy) => policy.branchId === branch.id && policy.effectiveFrom <= today)
                return <TableRow key={branch.id}>
                  <TableCell>{branch.name}</TableCell>
                  <TableCell>{current ? current.settings.entryToleranceMinutes === 0 ? 'Sin tolerancia' : `${current.settings.entryToleranceMinutes} min` : 'Pendiente'}</TableCell>
                  <TableCell>{current ? current.settings.mealToleranceMinutes === 0 ? 'Sin tolerancia' : `${current.settings.mealToleranceMinutes} min` : 'Pendiente'}</TableCell>
                  <TableCell>{current ? `${current.settings.entryAllowedTardies} / ${current.settings.mealAllowedTardies}` : '—'}</TableCell>
                  <TableCell>{current ? current.settings.accumulationMode === 'calendar_month' ? 'Mes calendario' : `${current.settings.accumulationDays} días desde el primer retardo` : '—'}</TableCell>
                  <TableCell>{current?.effectiveFrom ?? '—'}</TableCell>
                  <TableCell><Button size="small" onClick={() => setPolicyBranch(branch)}>Configurar</Button></TableCell>
                </TableRow>
              })}</TableBody>
            </Table></TableContainer>
          </Stack>
          <Stack spacing={1.5}>
            <Typography component="h2" variant="h3">Roles de horario y versiones</Typography>
            <TableContainer component={Paper} variant="outlined"><Table sx={{ minWidth: 950 }} aria-label="Roles de horario">
              <TableHead><TableRow><TableCell>Horario</TableCell><TableCell>Sucursal</TableCell><TableCell>Jornada</TableCell><TableCell>Comida</TableCell><TableCell>Días</TableCell><TableCell>Vigencia</TableCell><TableCell>Acciones</TableCell></TableRow></TableHead>
              <TableBody>{(schedules.data ?? []).map((schedule) => <TableRow key={schedule.id}>
                <TableCell><Stack spacing={0.5}><Typography variant="body2">{schedule.name}</Typography>{schedule.isDefault && <Chip label={schedule.supersededFrom && schedule.supersededFrom <= today ? 'Versión histórica' : 'Base de sucursal'} size="small" variant="outlined" sx={{ alignSelf: 'flex-start' }} />}</Stack></TableCell>
                <TableCell>{branchNames.get(schedule.branchId)}</TableCell>
                <TableCell sx={{ whiteSpace: 'nowrap' }}>{schedule.settings.entryTime}–{schedule.settings.exitTime}</TableCell>
                <TableCell>{schedule.settings.mealMode === 'individual' ? 'Configurable en cada empleado' : schedule.settings.mealEnabled ? <Stack><Typography variant="body2">Salir {schedule.settings.mealStart}–{schedule.settings.mealEnd}</Typography><Typography color="text.secondary" variant="caption">{schedule.settings.mealDurationMinutes} min desde la salida real</Typography></Stack> : 'Sin movimientos de comida'}</TableCell>
                <TableCell>{schedule.settings.workDays.map((day) => ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'][day - 1]).join(', ')}</TableCell>
                <TableCell>{schedule.effectiveFrom}</TableCell>
                <TableCell><Button size="small" onClick={() => setEditing(schedule)}>Nueva versión</Button></TableCell>
              </TableRow>)}{!schedules.data?.length && <TableRow><TableCell colSpan={7}>Crea el primer horario y asígnalo a una sucursal o persona.</TableCell></TableRow>}</TableBody>
            </Table></TableContainer>
          </Stack>
          <Typography color="text.secondary" variant="body2">Las versiones nuevas conservan las anteriores. Los contadores de llegada y comida se calculan por persona; cambiar una tolerancia no borra los retardos previos.</Typography>
        </>}
      </Stack>
      {policyBranch && <PolicyDialog branch={policyBranch} policy={policies.data?.find((policy) => policy.branchId === policyBranch.id && policy.effectiveFrom <= today)} onClose={() => setPolicyBranch(null)} />}
      {editing && <ScheduleDialog schedule={editing === 'new' ? undefined : editing} onClose={() => setEditing(null)} />}
    </>
  )
}
