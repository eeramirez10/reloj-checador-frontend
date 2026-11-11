import MenuItem from '@mui/material/MenuItem'
import TextField from '@mui/material/TextField'
import { useCompanies } from './api'

export default function CompanySelect({ value,onChange,assignment = false,retainedId,disabled = false }: {
  value: string; onChange: (value: string) => void; assignment?: boolean; retainedId?: string | null; disabled?: boolean
}) {
  const companies = useCompanies()
  const options = (companies.data ?? []).filter(company => !assignment || company.active || company.id === (retainedId ?? value))
  return <TextField fullWidth select size="small" label="Empresa" value={value} onChange={event => onChange(event.target.value)}
    slotProps={{ select: { displayEmpty: true },inputLabel: { shrink: true } }}
    disabled={disabled || companies.isPending || companies.isError} error={companies.isError}
    helperText={companies.isError ? 'No se pudo cargar el catálogo de empresas. Actualiza la página.' : assignment ? 'Empresa actual del empleado para clasificar consultas y reportes.' : undefined}>
    <MenuItem value="">{assignment ? 'Sin empresa' : 'Todas las empresas'}</MenuItem>
    {!assignment && <MenuItem value="unassigned">Sin empresa</MenuItem>}
    {options.map(company => <MenuItem key={company.id} value={company.id}>{company.name}{company.active ? '' : ' (inactiva)'}</MenuItem>)}
  </TextField>
}
