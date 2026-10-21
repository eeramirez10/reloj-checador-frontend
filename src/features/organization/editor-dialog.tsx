import Alert from '@mui/material/Alert'
import Button from '@mui/material/Button'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import Stack from '@mui/material/Stack'
import { useState, type ReactNode } from 'react'
import { getApiErrorMessage } from '../../shared/api/api-error'

export default function EditorDialog({ title, children, onClose, onSave, saveLabel = 'Guardar', saveDisabled = false }: {
  title: string; children: ReactNode; onClose: () => void; onSave: () => Promise<unknown>; saveLabel?: string; saveDisabled?: boolean
}) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  async function save() {
    setBusy(true)
    setError('')
    try { await onSave(); onClose() } catch (cause) { setError(getApiErrorMessage(cause)) } finally { setBusy(false) }
  }
  return (
    <Dialog fullWidth maxWidth="md" open onClose={busy ? undefined : onClose}>
      <form onSubmit={(event) => { event.preventDefault(); void save() }} style={{ display: 'flex', flexDirection: 'column', flex: '1 1 auto', minHeight: 0, overflow: 'hidden' }}>
        <DialogTitle>{title}</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2.5}>{error && <Alert severity="error">{error}</Alert>}{children}</Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button disabled={busy} onClick={onClose}>Cancelar</Button>
          <Button disabled={busy || saveDisabled} type="submit" variant="contained">{busy ? 'Guardando…' : saveLabel}</Button>
        </DialogActions>
      </form>
    </Dialog>
  )
}
