import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import type { CreateDeviceInput } from '../types/device'
import DeviceForm from './device-form'

type CreateDeviceDialogProps = {
  open: boolean
  onClose: () => void
  onSubmit: (input: CreateDeviceInput) => Promise<void>
  submitting: boolean
  submissionError?: string
}

function CreateDeviceDialog({
  open,
  onClose,
  onSubmit,
  submitting,
  submissionError,
}: CreateDeviceDialogProps) {
  function handleClose() {
    if (!submitting) onClose()
  }

  return (
    <Dialog aria-labelledby="create-device-title" fullWidth maxWidth="sm" onClose={handleClose} open={open}>
      <DialogTitle id="create-device-title">Agregar reloj</DialogTitle>
      <DeviceForm
        onCancel={handleClose}
        onSubmit={onSubmit}
        submitting={submitting}
        submissionError={submissionError}
      />
    </Dialog>
  )
}

export default CreateDeviceDialog
