import Alert from '@mui/material/Alert'
import Button from '@mui/material/Button'
import Checkbox from '@mui/material/Checkbox'
import Chip from '@mui/material/Chip'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import FormControlLabel from '@mui/material/FormControlLabel'
import Stack from '@mui/material/Stack'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import Typography from '@mui/material/Typography'
import { useState } from 'react'
import { getApiErrorMessage } from '../../shared/api/api-error'
import PageLoading from '../../shared/ui/page-loading'
import { useOrganizationMutation } from './api'
import { branchMealLabel, deleteBranchConfiguration, useBranchConfiguration, type BranchConfigurationVersion } from './branch-configuration'

export default function BranchConfigurationHistory({ branchId, name, onClose }: { branchId: string; name: string; onClose: () => void }) {
  const query = useBranchConfiguration(branchId)
  const mutation = useOrganizationMutation(deleteBranchConfiguration)
  const [showDeleted, setShowDeleted] = useState(false)
  const [deleting, setDeleting] = useState<BranchConfigurationVersion | null>(null)
  const versions = (query.data?.history ?? []).filter((version) => showDeleted || !version.deletedAt)
  return <>
    <Dialog open fullWidth maxWidth="lg" onClose={onClose}>
      <DialogTitle>Historial de configuración · {name}</DialogTitle>
      <DialogContent dividers><Stack spacing={2}>
        {query.isError && <Alert severity="error">{getApiErrorMessage(query.error)}</Alert>}
        <FormControlLabel label="Mostrar eliminadas" control={<Checkbox checked={showDeleted} onChange={(event) => setShowDeleted(event.target.checked)} />} />
        {query.isPending ? <PageLoading /> : <TableContainer><Table size="small" aria-label="Versiones de configuración" sx={{ minWidth: 850 }}>
          <TableHead><TableRow><TableCell>Versión</TableCell><TableCell>Desde</TableCell><TableCell>Jornada / comida</TableCell><TableCell>Reglas</TableCell><TableCell>Estado</TableCell><TableCell>Acciones</TableCell></TableRow></TableHead>
          <TableBody>{versions.map((version) => {
            const settings = version.schedule?.settings
            const meal = settings && !settings.branchMeal && settings.mealEnabled
              ? `Histórica: ${settings.mealStart}–${settings.mealEnd} · ${settings.mealDurationMinutes} min` : branchMealLabel(settings?.branchMeal)
            const current = Boolean(version.schedule && query.data?.schedule?.id === version.schedule.id) || Boolean(version.policy && query.data?.policy?.id === version.policy.id)
            const state = version.deletedAt ? 'Eliminada' : current ? 'Vigente' : version.effectiveFrom > (query.data?.date ?? '') ? 'Programada' : 'Histórica'
            return <TableRow key={version.id}>
              <TableCell><Stack><Typography variant="body2">{version.kind === 'configuration' ? 'Configuración de sucursal' : version.kind === 'schedule' ? version.schedule?.name : 'Reglas anteriores'}</Typography>
                <Typography variant="caption" color="text.secondary">{new Intl.DateTimeFormat('es-MX', { dateStyle: 'short', timeStyle: 'short', timeZone: query.data?.branch.timeZone }).format(new Date(version.createdAt))}</Typography></Stack></TableCell>
              <TableCell sx={{ whiteSpace: 'nowrap' }}>{version.effectiveFrom}</TableCell>
              <TableCell>{version.schedule ? <Stack><Typography variant="body2">{version.schedule.settings.entryTime}–{version.schedule.settings.exitTime}</Typography>
                <Typography variant="caption">Comida: {meal}</Typography></Stack> : '—'}</TableCell>
              <TableCell>{version.policy ? <Stack><Typography variant="caption">Tolerancia entrada / comida: {version.policy.settings.entryToleranceMinutes} / {version.policy.settings.mealToleranceMinutes} min</Typography>
                <Typography variant="caption">Entradas repetidas: {version.policy.settings.entryRepeatWindowMinutes ?? 20} min</Typography></Stack> : '—'}</TableCell>
              <TableCell><Chip size="small" variant="outlined" color={state === 'Vigente' ? 'success' : 'default'} label={state} /></TableCell>
              <TableCell>{!version.deletedAt && <Button size="small" color="error" onClick={() => { mutation.reset(); setDeleting(version) }}>Eliminar</Button>}</TableCell>
            </TableRow>
          })}{!versions.length && <TableRow><TableCell colSpan={6}>No hay versiones para mostrar.</TableCell></TableRow>}</TableBody>
        </Table></TableContainer>}
      </Stack></DialogContent>
      <DialogActions><Button onClick={onClose}>Cerrar</Button></DialogActions>
    </Dialog>
    {deleting && <Dialog open fullWidth maxWidth="sm" onClose={mutation.isPending ? undefined : () => setDeleting(null)}>
      <DialogTitle>Eliminar versión del {deleting.effectiveFrom}</DialogTitle>
      <DialogContent><Stack spacing={2}>
        <Typography>Se retirará esta configuración y se recalculará la asistencia con la jornada individual o de sucursal que quede disponible.</Typography>
        <Typography variant="body2">Las checadas, imágenes, datos de empleados y referencias históricas se conservan. Si no queda una jornada aplicable, las marcas se mostrarán sin configuración.</Typography>
        {mutation.isError && <Alert severity="error">{getApiErrorMessage(mutation.error)}</Alert>}
      </Stack></DialogContent>
      <DialogActions><Button disabled={mutation.isPending} onClick={() => setDeleting(null)}>Cancelar</Button>
        <Button color="error" variant="contained" disabled={mutation.isPending || !query.data} onClick={async () => {
          try { await mutation.mutateAsync({ branchId, versionId: deleting.id, expectedVersionId: query.data!.latestVersionId }); setDeleting(null) }
          catch { await query.refetch() }
        }}>{mutation.isPending ? 'Eliminando…' : 'Eliminar y recalcular'}</Button></DialogActions>
    </Dialog>}
  </>
}
