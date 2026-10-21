import { httpClient } from '../../../shared/api/http-client'
import type { Employee, EmployeeFilters } from '../types/employee'

export const employeeQueryKeys = {
  all: ['employees'] as const,
  lists: () => [...employeeQueryKeys.all, 'list'] as const,
  list: (filters: EmployeeFilters) => [...employeeQueryKeys.lists(), filters] as const,
}

export async function getEmployees(
  filters: EmployeeFilters = {},
  signal?: AbortSignal,
): Promise<Employee[]> {
  const response = await httpClient.get<Employee[]>('/employees', { params: filters, signal })
  if (!Array.isArray(response.data)) {
    throw new Error('La API devolvió un catálogo de empleados con formato inválido.')
  }
  return response.data
}
