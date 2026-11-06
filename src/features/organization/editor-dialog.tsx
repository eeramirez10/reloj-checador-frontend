import Alert from '@mui/material/Alert'
import Button from '@mui/material/Button'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import Stack from '@mui/material/Stack'
import { useState, type ReactNode } from 'react'
import { getApiErrorMessage } from '../../shared/api/api-error'

export default function EditorDialog({ title, children, header, onClose, onSave, onValidate, saveLabel = 'Guardar', saveDisabled = false, stableHeight = false, operationBusy = false }: {
  title: string; children: ReactNode; header?: ReactNode; onClose: () => void; onSave: () => Promise<unknown>
  onValidate?: (form: HTMLFormElement) => Promise<boolean>; saveLabel?: string; saveDisabled?: boolean; stableHeight?: boolean; operationBusy?: boolean
}) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  async function save(form: HTMLFormElement) {
    if (operationBusy || saveDisabled || busy) return
    setBusy(true)
    setError('')
    try {
      if (onValidate && !await onValidate(form)) return
      await onSave(); onClose()
    } catch (cause) { setError(getApiErrorMessage(cause)) } finally { setBusy(false) }
  }
  return (
    <Dialog fullWidth maxWidth="md" open onClose={busy || operationBusy ? undefined : onClose}
      slotProps={{ paper: { sx: stableHeight ? { height: 'min(760px, calc(100dvh - 64px))' } : undefined } }}>
      <form noValidate={Boolean(onValidate)} onSubmit={(event) => { event.preventDefault(); void save(event.currentTarget) }} style={{ display: 'flex', flexDirection: 'column', flex: '1 1 auto', minHeight: 0, overflow: 'hidden' }}>
        <DialogTitle>{title}</DialogTitle>
        {header}
        <DialogContent dividers>
          <Stack spacing={2.5}>{error && <Alert severity="error">{error}</Alert>}{children}</Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button disabled={busy || operationBusy} onClick={onClose}>Cancelar</Button>
          <Button disabled={busy || saveDisabled || operationBusy} type="submit" variant="contained">{busy ? 'Guardando…' : saveLabel}</Button>
        </DialogActions>
      </form>
    </Dialog>
  )
}
