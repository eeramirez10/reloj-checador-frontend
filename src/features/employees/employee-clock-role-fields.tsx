import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import MenuItem from '@mui/material/MenuItem'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import { useRef,useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useDevices } from '../devices/hooks/use-devices'
import { getApiErrorMessage } from '../../shared/api/api-error'
import type { Employee } from './types/employee'
import type { DeviceUserRoleSnapshot } from './types/device-user-role'
import { changeDeviceUserRole,readDeviceUserRole,useDeviceUserRoleHistory } from './api/device-user-role.api'

const statusLabels = { running: 'En proceso',succeeded: 'Verificado',blocked: 'Bloqueado',failed: 'Fallido',unconfirmed: 'No confirmado' }
function roleLabel(role: number | null | undefined) { return role === 14 ? 'Administrador' : role === 0 ? 'Usuario normal' : role === null || role === undefined ? 'Sin consultar' : `Rol especial (${role})` }
function timestamp(value: string) { return new Intl.DateTimeFormat('es-MX',{ dateStyle: 'short',timeStyle: 'short' }).format(new Date(value)) }

export default function EmployeeClockRoleFields({ employee,active,onBusyChange }: { employee: Employee; active: boolean; onBusyChange: (value: boolean) => void }) {
  const clock = employee.clockRecords.find((record) => record.bindingStatus === 'active')
  const devices = useDevices()
  const device = devices.data?.find((item) => item.id === clock?.deviceId)
  const history = useDeviceUserRoleHistory(employee.id,active)
  const client = useQueryClient()
  const [snapshot,setSnapshot] = useState<DeviceUserRoleSnapshot | null>(null)
  const [lastObserved,setLastObserved] = useState<DeviceUserRoleSnapshot | null>(null)
  const [role,setRole] = useState<0 | 14 | ''>('')
  const [busy,setBusy] = useState(false)
  const [notice,setNotice] = useState<{ severity: 'success' | 'error' | 'warning'; message: string } | null>(null)
  const noticeRef = useRef<HTMLDivElement>(null)
  function showNotice(value: NonNullable<typeof notice>) {
    setNotice(value)
    requestAnimationFrame(() => noticeRef.current?.scrollIntoView({ block: 'nearest' }))
  }
  const supported = device?.driver === 'node' && employee.identificationStatus === 'confirmed'
  async function refreshCaches() {
    await Promise.all(['employees','device-users','device-user-role-history'].map((key) => client.invalidateQueries({ queryKey: [key] })))
  }
  async function operate(change: boolean) {
    if (!clock || busy) return
    setBusy(true); onBusyChange(true); setNotice(null)
    try {
      if (!change) {
        const result = await readDeviceUserRole(employee.id,clock.id)
        setSnapshot(result.snapshot); setLastObserved(result.snapshot); setRole(result.snapshot.role === 0 || result.snapshot.role === 14 ? result.snapshot.role : '')
      } else {
        if (!snapshot || role === '') return
        const result = await changeDeviceUserRole(employee.id,{ clockRecordId: clock.id,uid: snapshot.uid,expectedRole: snapshot.role,role })
        const verified = result.status === 'succeeded' && result.after
        setSnapshot(verified ? result.after : null); setRole(verified ? result.after!.role as 0 | 14 : '')
        if (verified) setLastObserved(result.after)
        showNotice({ severity: verified ? 'success' : result.status === 'blocked' ? 'warning' : 'error',
          message: verified ? `Permiso verificado en el reloj: ${roleLabel(result.after!.role)}.` : result.error || 'El resultado no se confirmó. Consulta el rol nuevamente.' })
      }
      await refreshCaches()
    } catch (error) { setSnapshot(null); setRole(''); showNotice({ severity: 'error',message: getApiErrorMessage(error) }); await history.refetch() }
    finally { setBusy(false); onBusyChange(false) }
  }
  if (!clock) return <Alert severity="info">Asigna un reloj desde Empleados → Opciones → Reloj para administrar sus permisos.</Alert>
  const lastAdmin = snapshot?.role === 14 && snapshot.administratorCount <= 1
  return <>
    <Box component="dl" sx={{ display: 'grid',gridTemplateColumns: { xs: '1fr',sm: '1fr 1fr' },gap: 2,m: 0,'& dt': { fontSize: '0.75rem',color: 'text.secondary' },'& dd': { m: 0,mt: 0.5,fontSize: '0.875rem' } }}>
      <div><dt>Reloj asignado</dt><dd>{clock.deviceName}</dd></div><div><dt>ID en el reloj</dt><dd>{clock.userId}</dd></div>
      <div><dt>UID interno</dt><dd>{lastObserved?.uid ?? clock.uid ?? 'Sin sincronizar'}</dd></div><div><dt>Último rol registrado</dt><dd>{roleLabel(lastObserved?.role ?? clock.role)}</dd></div>
      <div><dt>Última consulta registrada</dt><dd>{timestamp(lastObserved?.measuredAt ?? clock.roleObservedAt ?? clock.syncedAt)}</dd></div>
    </Box>
    {notice && <Alert ref={noticeRef} severity={notice.severity}>{notice.message}</Alert>}
    {devices.isError && <Alert severity="error">{getApiErrorMessage(devices.error)} <Button type="button" onClick={() => void devices.refetch()}>Reintentar</Button></Alert>}
    {device && !supported && <Alert severity="info">La ficha debe estar identificada y el reloj debe usar TCP/IP directo para administrar permisos.</Alert>}
    <Button type="button" variant="outlined" disabled={busy || !supported || !clock.uid} onClick={() => void operate(false)} sx={{ alignSelf: 'flex-start' }}>{busy ? 'Comunicando con el reloj…' : 'Consultar rol actual'}</Button>
    {snapshot && <Typography variant="body2">Administradores en este reloj: <strong>{snapshot.administratorCount}</strong>. Usuarios consultados: {snapshot.totalUsers}.</Typography>}
    {lastAdmin && <Alert severity="info">Es el último administrador de este reloj. Asigna otro antes de quitarle el permiso.</Alert>}
    <TextField select label="Permiso en el reloj" value={role} disabled={busy || !snapshot || !supported} onChange={(event) => setRole(Number(event.target.value) as 0 | 14)}>
      <MenuItem value="" disabled>Consulta el rol actual</MenuItem><MenuItem value={0} disabled={lastAdmin}>Usuario normal</MenuItem><MenuItem value={14}>Administrador</MenuItem>
    </TextField>
    <Button type="button" variant="contained" disabled={busy || !supported || !snapshot || role === '' || role === snapshot.role || Boolean(lastAdmin && role === 0)}
      onClick={() => void operate(true)} sx={{ alignSelf: 'flex-start' }}>Aplicar en el reloj</Button>
    <Typography variant="caption" color="text.secondary">Se permiten varios administradores por sucursal y por reloj. El cambio es inmediato y se aplica con este botón, independientemente de Guardar. Cerrar el editor conserva los cambios ya aplicados al equipo.</Typography>
    <Stack spacing={1.5} sx={{ pt: 2,borderTop: 1,borderColor: 'divider' }}>
      <Typography variant="h3" component="h3">Historial de permisos</Typography>
      {history.isError && <Alert severity="error">{getApiErrorMessage(history.error)} <Button type="button" onClick={() => void history.refetch()}>Reintentar</Button></Alert>}
      {history.isPending && active ? <Typography variant="body2">Consultando historial…</Typography> : history.data?.length ? history.data.map((item) => <Box key={item.id} sx={{ pl: 1.5,borderLeft: 2,borderColor: 'divider' }}>
        <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap',alignItems: 'center' }}><Typography variant="body2">{timestamp(item.startedAt)}</Typography>
          <Chip size="small" variant="outlined" label={statusLabels[item.status]} color={item.status === 'succeeded' ? 'success' : item.status === 'running' ? 'default' : 'warning'} /></Stack>
        <Typography variant="body2">{roleLabel(item.before?.role)} → {roleLabel(item.requestedRole)} · ID {item.userId}</Typography>
        {item.error && <Typography variant="caption" color="text.secondary">{item.error}</Typography>}
      </Box>) : !history.isError && <Typography variant="body2" color="text.secondary">Aún no hay cambios registrados.</Typography>}
    </Stack>
  </>
}
