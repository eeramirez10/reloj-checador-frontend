import MenuItem from '@mui/material/MenuItem'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'

export default function ToleranceField({ label, value, onChange }: { label: string; value: number; onChange: (value: number) => void }) {
  return <Stack spacing={1.5}>
    <TextField select label={label} value={value === 0 ? 'none' : 'minutes'} onChange={(event) => onChange(event.target.value === 'none' ? 0 : 5)}>
      <MenuItem value="none">Sin tolerancia (0 minutos)</MenuItem>
      <MenuItem value="minutes">Con minutos de tolerancia</MenuItem>
    </TextField>
    {value > 0 && <TextField required type="number" label="Minutos permitidos" value={value} onChange={(event) => onChange(Number(event.target.value))} slotProps={{ htmlInput: { min: 1, max: 120 } }} />}
  </Stack>
}
