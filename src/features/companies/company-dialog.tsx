import FormControlLabel from '@mui/material/FormControlLabel'
import Switch from '@mui/material/Switch'
import TextField from '@mui/material/TextField'
import { useState } from 'react'
import EditorDialog from '../organization/editor-dialog'
import { useOrganizationMutation } from '../organization/api'
import { saveCompany,type Company } from './api'

export default function CompanyDialog({ company,onClose }: { company?: Company; onClose: () => void }) {
  const [name,setName] = useState(company?.name ?? '')
  const [code,setCode] = useState(company?.code ?? '')
  const [active,setActive] = useState(company?.active ?? true)
  const [notes,setNotes] = useState(company?.notes ?? '')
  const mutation = useOrganizationMutation(() => saveCompany({ name: name.trim(),code: code.trim() || null,active,notes: notes.trim() },company))
  return <EditorDialog title={company ? 'Editar empresa' : 'Agregar empresa'} onClose={onClose} onSave={() => mutation.mutateAsync(undefined)}>
    <TextField required label="Nombre de la empresa" autoFocus value={name} onChange={event => setName(event.target.value)} slotProps={{ htmlInput: { maxLength: 200 } }} />
    <TextField label="Código interno (opcional)" value={code} onChange={event => setCode(event.target.value)} slotProps={{ htmlInput: { maxLength: 50 } }} />
    <TextField label="Observaciones" multiline minRows={3} value={notes} onChange={event => setNotes(event.target.value)} slotProps={{ htmlInput: { maxLength: 2000 } }} />
    <FormControlLabel control={<Switch checked={active} onChange={(_,checked) => setActive(checked)} />} label="Empresa activa" />
  </EditorDialog>
}
