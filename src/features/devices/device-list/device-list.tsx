import DevicesOtherOutlinedIcon from '@mui/icons-material/DevicesOtherOutlined'
import LinkRoundedIcon from '@mui/icons-material/LinkRounded'
import AccessTimeRoundedIcon from '@mui/icons-material/AccessTimeRounded'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import CircularProgress from '@mui/material/CircularProgress'
import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import Typography from '@mui/material/Typography'
import type { Device } from '../types/device'

type DeviceListProps = {
  devices: Device[]
  testingDeviceId?: string
  onTestConnection: (device: Device) => void
  onAssign: (device: Device) => void
  onEdit: (device: Device) => void
  onManageClock: (device: Device) => void
  branchNames: Map<string, string>
}

function getDriverLabel(device: Device): string {
  return device.driver === 'node' ? 'TCP/IP directo' : 'Puente SDK'
}

function ConnectionButton({ device, testing, onTestConnection }: {
  device: Device
  testing: boolean
  onTestConnection: () => void
}) {
  return (
    <Button
      aria-label={`Probar conexión con ${device.name}`}
      disabled={testing}
      onClick={onTestConnection}
      size="small"
      startIcon={testing ? <CircularProgress color="inherit" size={15} /> : <LinkRoundedIcon />}
      variant="outlined"
    >
      {testing ? 'Probando…' : 'Probar conexión'}
    </Button>
  )
}

function DeviceList({ devices, testingDeviceId, onTestConnection, onAssign, onEdit, onManageClock, branchNames }: DeviceListProps) {
  return (
    <>
      <TableContainer component={Paper} sx={{ display: { xs: 'none', md: 'block' } }} variant="outlined">
        <Table aria-label="Dispositivos registrados">
          <TableHead>
            <TableRow sx={{ bgcolor: 'background.default' }}>
              <TableCell>Dispositivo</TableCell>
              <TableCell>Conexión</TableCell>
              <TableCell>Sincronización</TableCell>
              <TableCell>Sucursal</TableCell>
              <TableCell>Intervalo</TableCell>
              <TableCell align="right">Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {devices.map((device) => (
              <TableRow hover key={device.id}>
                <TableCell>
                  <Stack spacing={0.4}>
                    <Typography sx={{ fontWeight: 500 }} variant="body2">{device.name}</Typography>
                    <Typography color="text.secondary" variant="caption">{device.ipAddress}</Typography>
                  </Stack>
                </TableCell>
                <TableCell>
                  <Stack spacing={0.4}>
                    <Typography variant="body2">{getDriverLabel(device)}</Typography>
                    <Typography color="text.secondary" variant="caption">Puerto {device.tcpPort}</Typography>
                  </Stack>
                </TableCell>
                <TableCell>
                  <Chip
                    color={device.enabled ? 'success' : 'default'}
                    label={device.enabled ? 'Activa' : 'Pausada'}
                    size="small"
                    variant="outlined"
                  />
                </TableCell>
                <TableCell>{branchNames.get(device.branchId ?? '') || 'Sin asignar'}</TableCell>
                <TableCell>{device.syncIntervalSeconds} s</TableCell>
                <TableCell align="right">
                  <Button size="small" startIcon={<AccessTimeRoundedIcon />} onClick={() => onManageClock(device)}>Fecha y hora</Button>
                  <Button size="small" onClick={() => onEdit(device)}>Editar</Button>
                  <Button size="small" onClick={() => onAssign(device)}>Asignar sucursal</Button>
                  <ConnectionButton
                    device={device}
                    onTestConnection={() => onTestConnection(device)}
                    testing={testingDeviceId === device.id}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Stack spacing={1.5} sx={{ display: { xs: 'flex', md: 'none' } }}>
        {devices.map((device) => (
          <Paper key={device.id} sx={{ p: 2 }} variant="outlined">
            <Stack spacing={1.75}>
              <Stack direction="row" spacing={1.25} sx={{ alignItems: 'flex-start' }}>
                <DevicesOtherOutlinedIcon color="primary" fontSize="small" sx={{ mt: 0.25 }} />
                <Stack spacing={0.4} sx={{ flexGrow: 1, minWidth: 0 }}>
                  <Typography sx={{ fontWeight: 500 }} variant="body2">{device.name}</Typography>
                  <Typography color="text.secondary" variant="body2">{device.ipAddress}:{device.tcpPort}</Typography>
                </Stack>
                <Chip
                  color={device.enabled ? 'success' : 'default'}
                  label={device.enabled ? 'Activa' : 'Pausada'}
                  size="small"
                  variant="outlined"
                />
              </Stack>
              <Typography color="text.secondary" variant="caption">
                {branchNames.get(device.branchId ?? '') || 'Sin sucursal'} · {getDriverLabel(device)} · sincronización cada {device.syncIntervalSeconds} segundos
              </Typography>
              <Button size="small" onClick={() => onAssign(device)}>Asignar sucursal</Button>
              <Button size="small" onClick={() => onEdit(device)}>Editar reloj</Button>
              <Button size="small" startIcon={<AccessTimeRoundedIcon />} onClick={() => onManageClock(device)}>Fecha y hora</Button>
              <ConnectionButton
                device={device}
                onTestConnection={() => onTestConnection(device)}
                testing={testingDeviceId === device.id}
              />
            </Stack>
          </Paper>
        ))}
      </Stack>
    </>
  )
}

export default DeviceList
