import Box from '@mui/material/Box'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import type { PersonalProfileValues } from './personal-profile'

export default function PersonalProfileFields({ values, referenceName, onChange, requireFirstName = false }: {
  values: PersonalProfileValues; referenceName: string; onChange: (key: keyof PersonalProfileValues, value: string) => void; requireFirstName?: boolean
}) {
  return <>
    {referenceName && <Typography color="text.secondary" variant="body2">Nombre completo de referencia: {referenceName}.</Typography>}
    <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' } }}>
      <TextField label="Nombre(s)" required={requireFirstName || Boolean(values.lastName)} value={values.firstName} onChange={(event) => onChange('firstName', event.target.value)} slotProps={{ htmlInput: { maxLength: 150 } }} autoComplete="given-name" />
      <TextField label="Apellidos" value={values.lastName} onChange={(event) => onChange('lastName', event.target.value)} slotProps={{ htmlInput: { maxLength: 150 } }} autoComplete="family-name" />
      <TextField label="RFC" value={values.rfc} onChange={(event) => onChange('rfc', event.target.value.toUpperCase())} helperText="12 o 13 caracteres; se guarda en mayúsculas." />
      <TextField label="Número de Seguro Social (NSS)" value={values.socialSecurityNumber} onChange={(event) => onChange('socialSecurityNumber', event.target.value)} helperText="11 dígitos, incluyendo los ceros iniciales." slotProps={{ htmlInput: { inputMode: 'numeric', maxLength: 11 } }} />
    </Box>
  </>
}
