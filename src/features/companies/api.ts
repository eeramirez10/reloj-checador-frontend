import { useQuery } from '@tanstack/react-query'
import { httpClient } from '../../shared/api/http-client'

export interface Company { id: string; name: string; code: string | null; active: boolean; notes: string; version: number }
export interface CompanySelection { id: string | null; name: string }
export function useCompanies() {
  return useQuery({ queryKey: ['companies'],queryFn: async ({ signal }) => (await httpClient.get<Company[]>('/companies',{ signal })).data })
}
export async function saveCompany(input: Omit<Company,'id' | 'version'>,company?: Company) {
  return company ? httpClient.patch(`/companies/${company.id}`,{ ...input,expectedVersion: company.version }) : httpClient.post('/companies',input)
}
export function companyFilterMatches(filter: CompanySelection | undefined, companyId?: string): boolean {
  if (!companyId) return !filter
  return companyId === 'unassigned' ? filter?.id === null : filter?.id === companyId
}
