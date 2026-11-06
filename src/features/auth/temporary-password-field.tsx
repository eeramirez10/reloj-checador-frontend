import ContentCopyRoundedIcon from '@mui/icons-material/ContentCopyRounded'
import PasswordRoundedIcon from '@mui/icons-material/PasswordRounded'
import VisibilityOffRoundedIcon from '@mui/icons-material/VisibilityOffRounded'
import VisibilityRoundedIcon from '@mui/icons-material/VisibilityRounded'
import Alert from '@mui/material/Alert'
import Button from '@mui/material/Button'
import IconButton from '@mui/material/IconButton'
import InputAdornment from '@mui/material/InputAdornment'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import { useRef, useState } from 'react'
import { generateTemporaryPassword } from './temporary-password'

interface TemporaryPasswordFieldProps {
  value: string
  onChange: (value: string) => void
  required: boolean
  disabled: boolean
}

export default function TemporaryPasswordField({ value, onChange, required, disabled }: TemporaryPasswordFieldProps) {
  const input = useRef<HTMLInputElement>(null)
  const [visible, setVisible] = useState(false)
  const [feedback, setFeedback] = useState<{ value: string; message: string; error: boolean } | null>(null)
  const currentFeedback = feedback?.value === value ? feedback : null

  function change(password: string) { setFeedback(null); onChange(password) }
  function generate() {
    try { change(generateTemporaryPassword()); setVisible(true) }
    catch { setFeedback({ value, error: true, message: 'No se pudo generar la contraseña. Puedes escribirla manualmente.' }) }
  }
  async function copy() {
    setFeedback(null)
    try {
      await navigator.clipboard.writeText(value)
      setFeedback({ value, error: false, message: 'Contraseña copiada.' })
    } catch {
      setVisible(true)
      input.current?.focus()
      input.current?.select()
      setFeedback({ value, error: true, message: 'No se pudo copiar automáticamente. Copia la contraseña seleccionada manualmente.' })
    }
  }

  return <Stack spacing={1}>
    <TextField required={required} disabled={disabled} fullWidth inputRef={input} type={visible ? 'text' : 'password'}
      label={required ? 'Contraseña temporal' : 'Nueva contraseña temporal (opcional)'} autoComplete="new-password" value={value}
      onChange={event => change(event.target.value)} helperText="De 8 a 128 caracteres. El generador crea 16. Se solicitará cambiarla al iniciar sesión."
      slotProps={{
        htmlInput: { minLength: 8, maxLength: 128, spellCheck: false },
        input: { endAdornment: <InputAdornment position="end"><IconButton type="button" edge="end" disabled={disabled || !value}
          aria-label={visible ? 'Ocultar contraseña temporal' : 'Mostrar contraseña temporal'} onClick={() => setVisible(current => !current)}>
          {visible ? <VisibilityOffRoundedIcon /> : <VisibilityRoundedIcon />}
        </IconButton></InputAdornment> },
      }} />
    <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: 'wrap' }}>
      <Button type="button" variant="outlined" disabled={disabled} startIcon={<PasswordRoundedIcon />} onClick={generate}>Generar contraseña</Button>
      <Button type="button" disabled={disabled || !value} startIcon={<ContentCopyRoundedIcon />} onClick={() => void copy()}>Copiar</Button>
    </Stack>
    {currentFeedback && (currentFeedback.error ? <Alert severity="error">{currentFeedback.message}</Alert>
      : <Typography role="status" variant="caption" color="success.main">{currentFeedback.message}</Typography>)}
  </Stack>
}
