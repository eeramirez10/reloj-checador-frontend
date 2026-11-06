import AddRoundedIcon from '@mui/icons-material/AddRounded'
import DevicesOtherOutlinedIcon from '@mui/icons-material/DevicesOtherOutlined'
import Alert from '@mui/material/Alert'
import AlertTitle from '@mui/material/AlertTitle'
import Button from '@mui/material/Button'
import Paper from '@mui/material/Paper'
import Snackbar from '@mui/material/Snackbar'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { useRef, useState } from 'react'
import { CreateDeviceDialog } from '../features/devices/create-device-dialog'
import DeviceList from '../features/devices/device-list/device-list'
import { useCreateDevice, useTestDeviceConnection } from '../features/devices/hooks/use-device-mutations'
import { useDevices } from '../features/devices/hooks/use-devices'
import type { CreateDeviceInput, Device } from '../features/devices/types/device'
import { getApiErrorMessage } from '../shared/api/api-error'
import PageHeader from '../shared/ui/page-header'
import PageLoading from '../shared/ui/page-loading'
import { useBranches } from '../features/organization/api'
import AssignmentDialog from '../features/organization/assignment-dialog'
import EditDeviceDialog from '../features/devices/edit-device-dialog'
import DeviceClockDialog from '../features/devices/device-clock-dialog'

type Notice = {
  severity: 'success' | 'error'
  message: string
}

function DevicesPage() {
  const branches = useBranches()
  const [assigning, setAssigning] = useState<Device | null>(null)
  const [editing, setEditing] = useState<Device | null>(null)
  const [managingClock, setManagingClock] = useState<Device | null>(null)
  const devicesQuery = useDevices()
  const createDevice = useCreateDevice()
  const testConnection = useTestDeviceConnection()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [submissionError, setSubmissionError] = useState<string>()
  const [notice, setNotice] = useState<Notice | null>(null)
  const [connectionError, setConnectionError] = useState<{ device: Device; message: string } | null>(null)
  const connectionErrorRef = useRef<HTMLDivElement>(null)
  const devices = devicesQuery.data ?? []

  function openCreateDialog() {
    setSubmissionError(undefined)
    setDialogOpen(true)
  }

  async function handleCreate(input: CreateDeviceInput) {
    const duplicate = devices.find((device) => device.ipAddress === input.ipAddress && device.tcpPort === (input.tcpPort ?? 4370))
    if (duplicate) {
      setSubmissionError(`Ya existe un reloj registrado con la IP ${duplicate.ipAddress} y puerto ${duplicate.tcpPort}.`)
      return
    }

    setSubmissionError(undefined)
    try {
      await createDevice.mutateAsync(input)
      setDialogOpen(false)
      setNotice({ severity: 'success', message: 'El reloj quedó registrado.' })
    } catch (error) {
      setSubmissionError(getApiErrorMessage(error))
    }
  }

  async function handleTestConnection(device: Device) {
    setConnectionError(null)
    setNotice(null)
    try {
      await testConnection.mutateAsync(device.id)
      setNotice({ severity: 'success', message: `Conexión establecida con ${device.name}.` })
    } catch (error) {
      setConnectionError({ device, message: getApiErrorMessage(error) })
      requestAnimationFrame(() => connectionErrorRef.current?.scrollIntoView({ block: 'nearest' }))
    }
  }

  return (
    <>
      <PageHeader
        action={
          <Button onClick={openCreateDialog} startIcon={<AddRoundedIcon />} variant="contained">
            Agregar reloj
          </Button>
        }
        description="Administra los relojes, su conectividad y el intervalo de sincronización."
        title="Dispositivos"
      />

      <Stack spacing={2}>
        {connectionError && <Alert ref={connectionErrorRef} severity="error" onClose={() => setConnectionError(null)} sx={{ overflowWrap: 'anywhere', scrollMarginTop: 88 }}>
          <AlertTitle>No se pudo conectar con {connectionError.device.name}</AlertTitle>
          <Typography variant="body2">{connectionError.device.ipAddress}:{connectionError.device.tcpPort} · {connectionError.device.driver === 'node' ? 'TCP/IP directo' : 'Puente SDK'}</Typography>
          <Typography variant="body2">{connectionError.message}</Typography>
        </Alert>}
        {devicesQuery.isError && devicesQuery.data && (
          <Alert
            action={<Button color="inherit" onClick={() => void devicesQuery.refetch()} size="small">Reintentar</Button>}
            severity="warning"
          >
            No se pudo actualizar la lista. Se muestran los últimos datos disponibles.
          </Alert>
        )}

        {!devicesQuery.isPending && !devicesQuery.isError && devices.length > 0 && (
          <Typography color="text.secondary" variant="body2">
            {devices.length} {devices.length === 1 ? 'reloj registrado' : 'relojes registrados'}
          </Typography>
        )}

        {devicesQuery.isPending ? (
          <PageLoading />
        ) : devicesQuery.isError && !devicesQuery.data ? (
          <Alert
            action={<Button color="inherit" onClick={() => void devicesQuery.refetch()} size="small">Reintentar</Button>}
            severity="error"
          >
            {getApiErrorMessage(devicesQuery.error)}
          </Alert>
        ) : devices.length === 0 ? (
          <Paper variant="outlined" sx={{ display: 'grid', minHeight: 300, placeItems: 'center', p: 3 }}>
            <Stack spacing={1.5} sx={{ alignItems: 'center', maxWidth: 420, textAlign: 'center' }}>
              <DevicesOtherOutlinedIcon color="primary" sx={{ fontSize: 38 }} />
              <Typography component="h2" variant="h3">Agrega tu primer reloj</Typography>
              <Typography color="text.secondary" variant="body2">
                Registra la dirección IP del SilkBio-100TC para probar la conexión y empezar a sincronizar.
              </Typography>
              <Button onClick={openCreateDialog} startIcon={<AddRoundedIcon />} variant="outlined">
                Agregar reloj
              </Button>
            </Stack>
          </Paper>
        ) : (
          <DeviceList
            devices={devices}
            branchNames={new Map((branches.data ?? []).map((branch) => [branch.id, branch.name]))}
            onAssign={setAssigning}
            onEdit={setEditing}
            onManageClock={setManagingClock}
            onTestConnection={(device) => void handleTestConnection(device)}
            testingDeviceId={testConnection.isPending ? testConnection.variables : undefined}
          />
        )}
      </Stack>

      {dialogOpen && <CreateDeviceDialog
        onClose={() => setDialogOpen(false)}
        onSubmit={handleCreate}
        open={dialogOpen}
        submissionError={submissionError}
        submitting={createDevice.isPending}
      />}
      {editing && <EditDeviceDialog key={editing.id} device={editing} onClose={() => setEditing(null)} onSaved={() => {
        if (connectionError?.device.id === editing.id) setConnectionError(null)
        setNotice({ severity: 'success', message: 'Se actualizó la configuración del reloj.' })
      }} />}
      {managingClock && <DeviceClockDialog key={managingClock.id} device={managingClock} branchName={(branches.data ?? []).find((branch) => branch.id === managingClock.branchId)?.name ?? 'Sin sucursal'} onClose={() => setManagingClock(null)} />}
      {assigning && <AssignmentDialog title={`Sucursal de ${assigning.name}`} targets={{ deviceIds: [assigning.id] }} onClose={() => setAssigning(null)} />}

      <Snackbar
        autoHideDuration={5000}
        onClose={() => setNotice(null)}
        open={notice !== null}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        {notice ? (
          <Alert onClose={() => setNotice(null)} severity={notice.severity} variant="filled">
            {notice.message}
          </Alert>
        ) : <span />}
      </Snackbar>
    </>
  )
}

export default DevicesPage
