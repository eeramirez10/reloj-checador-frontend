import Alert from '@mui/material/Alert'
import Button from '@mui/material/Button'
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
import { branchMealLabel, useBranchConfigurations, type BranchConfigurationView } from '../features/organization/branch-configuration'
import BranchConfigurationDialog from '../features/organization/branch-configuration-dialog'
import BranchConfigurationHistory from '../features/organization/branch-configuration-history'
import { getApiErrorMessage } from '../shared/api/api-error'
import PageHeader from '../shared/ui/page-header'
import PageLoading from '../shared/ui/page-loading'

const weekdays = ['Lun','Mar','Mié','Jue','Vie','Sáb','Dom']

export default function SchedulesPage() {
  const configurations = useBranchConfigurations()
  const [editing, setEditing] = useState<BranchConfigurationView | null>(null)
  const [history, setHistory] = useState<BranchConfigurationView | null>(null)
  return <>
    <PageHeader title="Horarios y reglas" description="Configura la jornada, comida, tolerancias y retardos de cada sucursal en un solo lugar." />
    <Stack spacing={2}>
      {configurations.isError && <Alert severity="error">{getApiErrorMessage(configurations.error)}</Alert>}
      {configurations.isPending ? <PageLoading /> : <TableContainer component={Paper} variant="outlined">
        <Table aria-label="Configuración por sucursal" sx={{ minWidth: 1150 }}>
          <TableHead><TableRow><TableCell>Sucursal</TableCell><TableCell>Jornada</TableCell><TableCell>Comida</TableCell><TableCell>Entradas repetidas</TableCell>
            <TableCell>Tolerancias entrada / comida</TableCell><TableCell>Retardos permitidos llegada / comida</TableCell><TableCell>Vigencia</TableCell><TableCell>Acciones</TableCell></TableRow></TableHead>
          <TableBody>{(configurations.data ?? []).map((view) => <TableRow key={view.branch.id}>
            <TableCell sx={{ fontWeight: 600 }}>{view.branch.name}</TableCell>
            <TableCell>{view.schedule ? <Stack><Typography variant="body2" sx={{ whiteSpace: 'nowrap' }}>{view.schedule.settings.entryTime}–{view.schedule.settings.exitTime}</Typography>
              <Typography variant="caption" color="text.secondary">{view.schedule.settings.workDays.map((day) => weekdays[day - 1]).join(', ')}</Typography></Stack>
              : <Typography variant="body2" color="warning.main">Sin jornada</Typography>}</TableCell>
            <TableCell>{view.schedule ? branchMealLabel(view.schedule.settings.branchMeal) : 'Pendiente'}</TableCell>
            <TableCell>{view.policy?.settings.entryRepeatWindowMinutes ?? 20} min</TableCell>
            <TableCell>{view.policy ? `${view.policy.settings.entryToleranceMinutes} / ${view.policy.settings.mealToleranceMinutes} min` : 'Pendientes'}</TableCell>
            <TableCell>{view.policy ? <Stack><Typography variant="body2">{view.policy.settings.entryAllowedTardies} / {view.policy.settings.mealAllowedTardies}</Typography>
              <Typography variant="caption" color="text.secondary">{view.policy.settings.accumulationMode === 'calendar_month' ? 'Mes calendario' : `${view.policy.settings.accumulationDays} días desde el primer retardo`}</Typography></Stack> : 'Pendientes'}</TableCell>
            <TableCell sx={{ whiteSpace: 'nowrap' }}>{view.schedule?.effectiveFrom && view.schedule.effectiveFrom === view.policy?.effectiveFrom ? view.schedule.effectiveFrom : <Stack>
              <Typography variant="caption">Jornada: {view.schedule?.effectiveFrom ?? '—'}</Typography><Typography variant="caption">Reglas: {view.policy?.effectiveFrom ?? '—'}</Typography></Stack>}</TableCell>
            <TableCell><Stack direction="row" spacing={0.5}><Button size="small" onClick={() => setEditing(view)}>Configurar</Button><Button size="small" onClick={() => setHistory(view)}>Historial</Button></Stack></TableCell>
          </TableRow>)}{!configurations.data?.length && <TableRow><TableCell colSpan={8}>Agrega una sucursal para configurar su jornada y reglas.</TableCell></TableRow>}</TableBody>
        </Table>
      </TableContainer>}
      <Typography variant="body2" color="text.secondary">Los empleados heredan la configuración de su sucursal. Sus horarios y comidas individuales tienen prioridad. Las versiones y su eliminación se administran desde Historial.</Typography>
    </Stack>
    {editing && <BranchConfigurationDialog key={editing.branch.id} view={editing} onClose={() => setEditing(null)} />}
    {history && <BranchConfigurationHistory branchId={history.branch.id} name={history.branch.name} onClose={() => setHistory(null)} />}
  </>
}
