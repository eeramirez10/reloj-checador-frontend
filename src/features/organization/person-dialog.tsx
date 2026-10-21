import Box from '@mui/material/Box'
import Alert from '@mui/material/Alert'
import Button from '@mui/material/Button'
import FormControlLabel from '@mui/material/FormControlLabel'
import MenuItem from '@mui/material/MenuItem'
import Switch from '@mui/material/Switch'
import TextField from '@mui/material/TextField'
import { useState } from 'react'
import { httpClient } from '../../shared/api/http-client'
import type { Employee } from '../employees/types/employee'
import { getToday, useBranches, useOrganizationMutation, useSchedules } from './api'
import EditorDialog from './editor-dialog'
import PersonalProfileFields from './personal-profile-fields'
import { getPersonalProfileChanges, type PersonalProfileValues } from './personal-profile'
import { getInitialEmployeeScheduling, useEmployeeScheduling, type EmployeeSchedulingView } from './employee-scheduling'
import EmployeeSchedulingFields from './employee-scheduling-fields'
import type { Branch, WorkSchedule } from './types'
import PageLoading from '../../shared/ui/page-loading'
import { getApiErrorMessage } from '../../shared/api/api-error'

export function EmployeeDialog({ employee, onClose }: { employee?: Employee; onClose: () => void }) {
  const branches = useBranches()
  const schedules = useSchedules()
  const scheduling = useEmployeeScheduling(employee?.id)
  const queries = employee ? [branches, schedules, scheduling] : [branches, schedules]
  const failed = queries.find((query) => query.isError)
  if (queries.some((query) => query.isPending) || failed) return <EditorDialog title={employee ? 'Editar empleado' : 'Agregar empleado'}
    onClose={onClose} onSave={async () => {}} saveDisabled>
    {failed ? <><Alert severity="error">{getApiErrorMessage(failed.error)}</Alert><Button onClick={() => void failed.refetch()}>Reintentar</Button></> : <PageLoading />}
  </EditorDialog>
  return <EmployeeEditor key={employee?.id ?? 'new'} employee={employee} onClose={onClose}
    branches={branches.data ?? []} schedules={schedules.data ?? []} schedulingView={scheduling.data} />
}

function EmployeeEditor({ employee, onClose, branches, schedules, schedulingView }: {
  employee?: Employee; onClose: () => void; branches: Branch[]; schedules: WorkSchedule[]; schedulingView?: EmployeeSchedulingView
}) {
  const [branchId, setBranchId] = useState(employee?.branchId ?? '')
  const [isActive, setIsActive] = useState(employee?.isActive ?? true)
  const initial: PersonalProfileValues = {
    firstName: employee?.firstName ?? '', lastName: employee?.lastName ?? '',
    rfc: employee?.rfc ?? '', socialSecurityNumber: employee?.imss ?? '',
  }
  const [personal, setPersonal] = useState(initial)
  const branch = branches.find((item) => item.id === branchId)
  const [initialScheduling] = useState(() => getInitialEmployeeScheduling(schedulingView, getToday(branch?.timeZone)))
  const [scheduling, setScheduling] = useState(initialScheduling)
  const schedulingChanged = JSON.stringify(scheduling) !== JSON.stringify(initialScheduling)
  const baseSchedule = schedules.find((schedule) => schedule.branchId === branchId && schedule.isDefault
    && schedule.effectiveFrom <= scheduling.effectiveFrom && (!schedule.supersededFrom || scheduling.effectiveFrom < schedule.supersededFrom))
  const clock = employee?.clockRecords.find((record) => record.bindingStatus === 'active')
  const hireDate = employee ? employee.hireDate?.slice(0, 10) ?? '' : getToday(branch?.timeZone)
  const terminationDate = isActive ? '' : employee?.isActive === false
    ? employee.terminationDate?.slice(0, 10) ?? '' : getToday(branch?.timeZone)
  const mutation = useOrganizationMutation<void>(async () => {
    if (!employee) {
      if (!personal.firstName.trim()) throw new Error('Completa Nombre(s) para crear al empleado.')
      await httpClient.post('/employees', { ...personal, branchId, ...(schedulingChanged ? { scheduling } : {}) })
      return
    }
    const changes: Record<string, unknown> = getPersonalProfileChanges(personal, initial)
    if (isActive !== employee.isActive) changes.isActive = isActive
    if (schedulingChanged) changes.scheduling = scheduling
    if (Object.keys(changes).length) await httpClient.patch(`/employees/${employee.id}`, changes)
  })
  return <EditorDialog title={employee ? 'Editar empleado' : 'Agregar empleado'} onClose={onClose} onSave={() => mutation.mutateAsync()}>
    <PersonalProfileFields values={personal} requireFirstName={!employee} referenceName="" onChange={(key, value) => setPersonal((current) => ({ ...current, [key]: value }))} />
    <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' } }}>
      {employee ? <TextField label="Sucursal" value={employee.branchName || branch?.name || 'Sin asignar'} slotProps={{ input: { readOnly: true } }} />
        : <TextField required select label="Sucursal" value={branchId} onChange={(event) => setBranchId(event.target.value)}>
          {branches.filter((item) => item.active).map((item) => <MenuItem key={item.id} value={item.id}>{item.name}</MenuItem>)}
        </TextField>}
      {employee && <TextField label="Reloj asignado" value={clock?.deviceName || 'Sin reloj asignado'} slotProps={{ input: { readOnly: true } }} />}
      {employee && <TextField label="ID en el reloj" value={clock?.userId || 'Sin ID asignado'} slotProps={{ input: { readOnly: true } }} />}
      <Box sx={{ display: 'flex', alignItems: 'center' }}>
        <FormControlLabel label={isActive ? 'Activo' : 'Dado de baja'} control={<Switch checked={isActive} disabled={!employee}
          slotProps={{ input: { role: 'switch', 'aria-label': 'Empleado activo' } }} onChange={(event) => setIsActive(event.target.checked)} />} />
      </Box>
      <TextField type="date" label="Fecha de alta" value={hireDate} slotProps={{ input: { readOnly: true }, inputLabel: { shrink: true } }} helperText={employee ? 'Alta original, solo consulta.' : 'Se registra automáticamente al crear la ficha.'} />
      <TextField type="date" label="Fecha de baja" value={terminationDate} slotProps={{ input: { readOnly: true }, inputLabel: { shrink: true } }} helperText="Se registra al dar de baja; la reactivación conserva el historial." />
    </Box>
    <EmployeeSchedulingFields value={scheduling} base={baseSchedule} firstAttendanceDate={schedulingView?.firstAttendanceDate} onChange={setScheduling} />
  </EditorDialog>
}
