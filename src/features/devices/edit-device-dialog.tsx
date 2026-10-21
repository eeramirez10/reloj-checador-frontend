import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import { useState } from 'react'
import { getApiErrorMessage } from '../../shared/api/api-error'
import DeviceForm from './create-device-dialog/device-form'
import { useUpdateDevice } from './hooks/use-device-mutations'
import type { CreateDeviceInput, Device } from './types/device'

export default function EditDeviceDialog({ device, onClose, onSaved }: { device: Device; onClose: () => void; onSaved: () => void }) {
  const mutation = useUpdateDevice()
  const [error, setError] = useState<string>()
  async function save(values: CreateDeviceInput) {
    setError(undefined)
    try {
      await mutation.mutateAsync({ id: device.id, input: { name: values.name, ipAddress: values.ipAddress,
        tcpPort: values.tcpPort, syncIntervalSeconds: values.syncIntervalSeconds, enabled: values.enabled } })
      onSaved()
      onClose()
    } catch (cause) { setError(getApiErrorMessage(cause)) }
  }
  const close = () => { if (!mutation.isPending) onClose() }
  return <Dialog open fullWidth maxWidth="sm" aria-labelledby="edit-device-title" onClose={close}>
    <DialogTitle id="edit-device-title">Editar reloj</DialogTitle>
    <DeviceForm device={device} onCancel={close} onSubmit={save} submitting={mutation.isPending} submissionError={error} />
  </Dialog>
}
