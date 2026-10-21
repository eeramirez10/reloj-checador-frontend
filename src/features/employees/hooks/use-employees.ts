import { useQuery } from '@tanstack/react-query'
import { employeeQueryKeys, getEmployees } from '../api/employees.api'
import type { EmployeeFilters } from '../types/employee'

export function useEmployees(filters: EmployeeFilters = {}) {
  return useQuery({
    queryKey: employeeQueryKeys.list(filters),
    queryFn: ({ signal }) => getEmployees(filters, signal),
  })
}
