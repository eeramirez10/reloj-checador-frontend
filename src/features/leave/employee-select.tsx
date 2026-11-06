import Autocomplete from '@mui/material/Autocomplete'
import TextField from '@mui/material/TextField'
import type { Employee } from '../employees/types/employee'

export default function EmployeeSelect({ employees, value, onChange, label = 'Empleado', required = false, disabled = false }: {
  employees: Employee[]; value: string; onChange: (id: string) => void; label?: string; required?: boolean; disabled?: boolean
}) {
  return <Autocomplete fullWidth size="small" options={employees} value={employees.find((employee) => employee.id === value) ?? null}
    disabled={disabled} getOptionKey={(employee) => employee.id} isOptionEqualToValue={(left, right) => left.id === right.id}
    getOptionLabel={(employee) => `${employee.name}${employee.employeeNumber ? ` (${employee.employeeNumber})` : ''}`}
    onChange={(_, employee) => onChange(employee?.id ?? '')}
    renderInput={(params) => <TextField {...params} required={required} label={label} />} />
}
