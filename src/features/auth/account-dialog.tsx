import Alert from '@mui/material/Alert'
import Autocomplete from '@mui/material/Autocomplete'
import FormControlLabel from '@mui/material/FormControlLabel'
import MenuItem from '@mui/material/MenuItem'
import Switch from '@mui/material/Switch'
import TextField from '@mui/material/TextField'
import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import EditorDialog from '../organization/editor-dialog'
import type { Branch } from '../organization/types'
import { saveAccount } from './api'
import { useAuth } from './auth-context'
import { roleLabels, type AccountRole, type AuthAccount } from './types'
import TemporaryPasswordField from './temporary-password-field'
import { useEmployees } from '../employees/hooks/use-employees'
import EmployeeSelect from '../leave/employee-select'
import { httpClient } from '../../shared/api/http-client'

export default function AccountDialog({ account, branches, onClose }: { account?: AuthAccount; branches: Branch[]; onClose: () => void }) {
  const auth = useAuth()
  const client = useQueryClient()
  const [username, setUsername] = useState(account?.username ?? '')
  const employees = useEmployees({ limit: 500 })
  const [employeeId,setEmployeeId] = useState(account?.employeeId ?? '')
  const [name, setName] = useState(account?.name ?? '')
  const [role, setRole] = useState<AccountRole>(account?.role ?? 'hr')
  const [branchIds, setBranchIds] = useState(account?.branchIds ?? [])
  const [isActive, setIsActive] = useState(account?.isActive ?? true)
  const [password, setPassword] = useState('')
  const [saving, setSaving] = useState(false)
  const ownAccount = auth.account?.id === account?.id

  async function save() {
    if (!['admin','employee'].includes(role) && !branchIds.length) throw new Error('Selecciona al menos una sucursal para esta cuenta.')
    if (role === 'employee' && !employeeId) throw new Error('Vincula un empleado con esta cuenta.')
    setSaving(true)
    try {
      if (role === 'employee' && !account) {
        await httpClient.post(`/employees/${employeeId}/access`,{ username })
        await client.invalidateQueries({ queryKey: ['auth-accounts'] })
        await client.invalidateQueries({ queryKey: ['employee-access',employeeId] })
        return
      }
      await saveAccount({ username, name, role, employeeId: employeeId || null, branchIds: ['admin','employee'].includes(role) ? [] : branchIds, isActive,
        ...(password ? { password } : {}), ...(account ? { expectedVersion: account.version } : {}) }, account?.id)
      await client.invalidateQueries({ queryKey: ['auth-accounts'] })
      await client.invalidateQueries({ queryKey: ['auth-audit'] })
    } finally { setSaving(false) }
  }
  return <EditorDialog title={account ? 'Editar cuenta de acceso' : 'Crear cuenta de acceso'} onClose={onClose} onSave={save}>
    <TextField required label="Nombre de la cuenta" value={name} onChange={event => setName(event.target.value)} slotProps={{ htmlInput: { maxLength: 120 } }} />
    <TextField required label="Usuario" autoComplete="off" value={username} onChange={event => setUsername(event.target.value.toLowerCase())}
      helperText="De 3 a 64 letras, números, puntos, guiones o guiones bajos."
      slotProps={{ htmlInput: { pattern: '[a-z0-9][a-z0-9._\\-]{2,63}', maxLength: 64 } }} />
    <TextField select label="Rol" value={role} disabled={ownAccount} onChange={event => setRole(event.target.value as AccountRole)}>
      {Object.entries(roleLabels).map(([value, label]) => <MenuItem key={value} value={value}>{label}</MenuItem>)}
    </TextField>
    {employees.isError && <Alert severity="error">No se pudo cargar el catálogo de empleados.</Alert>}
    <EmployeeSelect employees={(employees.data ?? []).filter(employee => employee.isActive && employee.identificationStatus === 'confirmed')} label="Empleado vinculado" value={employeeId} onChange={setEmployeeId} required={role === 'employee'} disabled={employees.isPending || employees.isError} />
    {role === 'employee' ? <Alert severity="info">El empleado consulta únicamente su asistencia, tarjeta y permisos. Puede resolver solicitudes cuando sea el jefe asignado.</Alert> : role === 'admin' ? <Alert severity="info">El administrador tiene acceso a todas las sucursales y a la administración de cuentas y dispositivos. No puede aprobar ni rechazar permisos.</Alert> : <>
      <Autocomplete multiple options={branches} getOptionLabel={branch => branch.name} isOptionEqualToValue={(left, right) => left.id === right.id}
        value={branches.filter(branch => branchIds.includes(branch.id))} onChange={(_, selected) => setBranchIds(selected.map(branch => branch.id))}
        renderInput={params => <TextField {...params} label="Sucursales autorizadas" helperText="Puedes asignar una o varias sucursales, independientemente de dónde trabaje la persona." />} />
      <Alert severity="info">{role === 'hr' ? 'RH puede gestionar empleados, horarios y vacaciones de sus sucursales. No puede aprobar ni rechazar permisos.' : 'El encargado puede consultar asistencia y reportes de sus sucursales. Solo puede resolver permisos si su empleado vinculado es el jefe asignado.'}</Alert>
    </>}
    <FormControlLabel control={<Switch checked={isActive} disabled={ownAccount} onChange={(_, checked) => setIsActive(checked)} />} label="Cuenta activa" />
    {role !== 'employee' && <TemporaryPasswordField value={password} onChange={setPassword} required={!account} disabled={saving} />}
    {role === 'employee' && <Alert severity="info">El acceso temporal se envía al correo registrado del empleado. Para regenerarlo, abre Acceso al sistema en su ficha.</Alert>}
    {account && <Alert severity="warning">Guardar los cambios cerrará las sesiones abiertas de esta cuenta{ownAccount ? ', incluida tu sesión actual' : ''}.</Alert>}
  </EditorDialog>
}
