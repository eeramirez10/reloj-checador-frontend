import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Stack from '@mui/material/Stack'
import Tab from '@mui/material/Tab'
import Tabs from '@mui/material/Tabs'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import { useId, useState, type ReactNode } from 'react'
import { httpClient } from '../../shared/api/http-client'
import { getApiErrorMessage } from '../../shared/api/api-error'
import PageLoading from '../../shared/ui/page-loading'
import { useEmployees } from '../employees/hooks/use-employees'
import type { Employee } from '../employees/types/employee'
import EmployeeClockRoleFields from '../employees/employee-clock-role-fields'
import { useLeaveProfile } from '../leave/api'
import EmployeeLeaveFields from '../leave/employee-leave-fields'
import { employeeLeaveChanges, initialEmployeeLeaveValues } from '../leave/employee-leave-form'
import type { LeaveProfile } from '../leave/types'
import { getToday, useBranches, useOrganizationMutation, useSchedules } from './api'
import { employeeEditorErrorTab, employeeEditorTabs, employeeScheduleIssue, type EmployeeEditorTab } from './employee-editor-validation'
import EmployeeGeneralFields from './employee-general-fields'
import EmployeeMealFields from './employee-meal-fields'
import EmployeeOvertimeFields from './employee-overtime-fields'
import { getInitialEmployeeScheduling, useEmployeeScheduling, type EmployeeSchedulingView } from './employee-scheduling'
import EmployeeWorkHoursFields from './employee-work-hours-fields'
import EditorDialog from './editor-dialog'
import { getPersonalProfileChanges, type PersonalProfileValues } from './personal-profile'
import type { Branch, WorkSchedule } from './types'
import { usePermissions } from '../auth/auth-context'

export function EmployeeDialog({ employee, initialTab = 'general', onClose }: {
  employee?: Employee; initialTab?: EmployeeEditorTab; onClose: () => void
}) {
  const branches = useBranches()
  const schedules = useSchedules()
  const scheduling = useEmployeeScheduling(employee?.id)
  const profile = useLeaveProfile(employee?.identificationStatus === 'confirmed' ? employee.id : undefined)
  const employees = useEmployees({ limit: 500 })
  const queries = [branches, schedules, ...(employee ? [scheduling] : []), ...(employee?.identificationStatus === 'confirmed' ? [profile, employees] : [])]
  const failed = queries.find((query) => query.isError)
  if (queries.some((query) => query.isPending) || failed) return <EditorDialog title={employee ? 'Editar empleado' : 'Agregar empleado'}
    onClose={onClose} onSave={async () => {}} saveDisabled stableHeight>
    {failed ? <><Alert severity="error">{getApiErrorMessage(failed.error)}</Alert><Button onClick={() => void failed.refetch()}>Reintentar</Button></> : <PageLoading />}
  </EditorDialog>
  return <EmployeeEditor key={employee?.id ?? 'new'} employee={employee} initialTab={initialTab} onClose={onClose}
    branches={branches.data ?? []} schedules={schedules.data ?? []} schedulingView={scheduling.data} profile={profile.data} employees={employees.data ?? []} />
}

function EmployeeEditor({ employee, initialTab, onClose, branches, schedules, schedulingView, profile, employees }: {
  employee?: Employee; initialTab: EmployeeEditorTab; onClose: () => void; branches: Branch[]; schedules: WorkSchedule[]
  schedulingView?: EmployeeSchedulingView; profile?: LeaveProfile; employees: Employee[]
}) {
  const id = useId()
  const { isAdmin } = usePermissions()
  const [tab, setTab] = useState<EmployeeEditorTab>(initialTab === 'leave' && !profile ? 'general' : initialTab)
  const [branchId, setBranchId] = useState(employee?.branchId ?? '')
  const [isActive, setIsActive] = useState(employee?.isActive ?? true)
  const [initialPersonal] = useState<PersonalProfileValues>(() => ({ firstName: employee?.firstName ?? '', lastName: employee?.lastName ?? '', rfc: employee?.rfc ?? '', socialSecurityNumber: employee?.imss ?? '' }))
  const [personal, setPersonal] = useState(initialPersonal)
  const branch = branches.find((item) => item.id === branchId)
  const [initialScheduling] = useState(() => getInitialEmployeeScheduling(schedulingView, getToday(branch?.timeZone)))
  const [scheduling, setScheduling] = useState(initialScheduling)
  const [initialProfile] = useState(profile)
  const [leave, setLeave] = useState(() => initialEmployeeLeaveValues(profile))
  const [validationError, setValidationError] = useState('')
  const [clockBusy,setClockBusy] = useState(false)
  const schedulingChanged = JSON.stringify(scheduling) !== JSON.stringify(initialScheduling)
  const baseSchedule = schedules.find((schedule) => schedule.branchId === branchId && schedule.isDefault
    && schedule.effectiveFrom <= scheduling.effectiveFrom && (!schedule.supersededFrom || scheduling.effectiveFrom < schedule.supersededFrom))
  const schedulingTab = tab === 'schedule' || tab === 'meal' || tab === 'overtime'

  const mutation = useOrganizationMutation<void>(async () => {
    try {
      if (!employee) {
        if (!personal.firstName.trim()) throw new Error('Completa Nombre(s) para crear al empleado.')
        await httpClient.post('/employees', { ...personal, branchId, ...(schedulingChanged ? { scheduling } : {}) })
        return
      }
      const changes: Record<string, unknown> = getPersonalProfileChanges(personal, initialPersonal)
      if (isActive !== employee.isActive) changes.isActive = isActive
      if (schedulingChanged) changes.scheduling = scheduling
      const leaveProfile = initialProfile && employeeLeaveChanges(leave, initialProfile)
      if (leaveProfile) changes.leaveProfile = leaveProfile
      if (Object.keys(changes).length) await httpClient.patch(`/employees/${employee.id}`, changes)
    } catch (error) {
      const errorTab = employeeEditorErrorTab(error)
      if (errorTab) setTab(errorTab)
      throw error
    }
  })

  async function validate(form: HTMLFormElement): Promise<boolean> {
    setValidationError('')
    const invalid = Array.from(form.elements).find((element): element is HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement =>
      (element instanceof HTMLInputElement || element instanceof HTMLSelectElement || element instanceof HTMLTextAreaElement)
      && element.willValidate && !element.validity.valid)
    if (invalid) {
      const target = invalid.closest<HTMLElement>('[data-editor-tab]')?.dataset.editorTab as EmployeeEditorTab | undefined
      if (target) setTab(target)
      await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()))
      invalid.focus(); invalid.reportValidity()
      return false
    }
    const issue = schedulingChanged ? employeeScheduleIssue(scheduling, baseSchedule) : undefined
    if (issue) { setTab(issue.tab); setValidationError(issue.message); return false }
    return true
  }

  function panel(value: EmployeeEditorTab, children: ReactNode) {
    return <Box role="tabpanel" id={`${id}-${value}-panel`} aria-labelledby={`${id}-${value}-tab`} hidden={tab !== value} data-editor-tab={value}>
      <Stack spacing={2.5}>{children}</Stack>
    </Box>
  }

  return <EditorDialog title={employee ? 'Editar empleado' : 'Agregar empleado'} onClose={onClose} onSave={() => mutation.mutateAsync()}
    onValidate={validate} stableHeight operationBusy={clockBusy} saveDisabled={tab === 'clock'} header={<Box sx={{ px: { xs: 2, sm: 3 }, minWidth: 0 }}>
      {employee && <Typography variant="body2" color="text.secondary" sx={{ mb: 1, overflowWrap: 'anywhere' }}>{employee.name}</Typography>}
      <Tabs value={tab} onChange={(_, value: EmployeeEditorTab) => setTab(value)} variant="scrollable" scrollButtons="auto" allowScrollButtonsMobile aria-label="Secciones del empleado">
        {employeeEditorTabs.filter((item) => (item.value !== 'leave' || Boolean(initialProfile)) && (item.value !== 'clock' || Boolean(employee && isAdmin))).map((item) => <Tab key={item.value} value={item.value} label={item.label} disabled={clockBusy}
          id={`${id}-${item.value}-tab`} aria-controls={`${id}-${item.value}-panel`} sx={{ minWidth: 'auto', px: 2 }} />)}
      </Tabs>
    </Box>}>
    {validationError && <Alert severity="error">{validationError}</Alert>}
    <Box hidden={!schedulingTab} data-editor-tab="schedule"><TextField required fullWidth type="date" label="Aplicar desde" value={scheduling.effectiveFrom}
      onChange={(event) => setScheduling((current) => ({ ...current, effectiveFrom: event.target.value }))} slotProps={{ inputLabel: { shrink: true } }}
      helperText={`Fecha compartida por Jornada, Comida y Horas extras.${schedulingView?.firstAttendanceDate ? ` Primera checada: ${schedulingView.firstAttendanceDate}.` : ''} Las versiones anteriores se conservan.`} /></Box>
    {panel('general', <EmployeeGeneralFields employee={employee} personal={personal} branches={branches} branchId={branchId} isActive={isActive}
      onPersonalChange={(key, value) => setPersonal((current) => ({ ...current, [key]: value }))} onBranchChange={setBranchId} onActiveChange={setIsActive} />)}
    {panel('schedule', <EmployeeWorkHoursFields value={scheduling} base={baseSchedule} onChange={setScheduling} />)}
    {panel('meal', <EmployeeMealFields value={scheduling} base={baseSchedule} onChange={setScheduling} />)}
    {panel('overtime', <EmployeeOvertimeFields value={scheduling.overtime} onChange={(overtime) => setScheduling((current) => ({ ...current, overtime }))} />)}
    {initialProfile && employee && panel('leave', <EmployeeLeaveFields employeeId={employee.id} value={leave} profile={initialProfile} employees={employees} onChange={setLeave} />)}
    {employee && isAdmin && panel('clock', <EmployeeClockRoleFields key={employee.clockRecords.find((record) => record.bindingStatus === 'active')?.id ?? 'unassigned'} employee={employee} active={tab === 'clock'} onBusyChange={setClockBusy} />)}
  </EditorDialog>
}
