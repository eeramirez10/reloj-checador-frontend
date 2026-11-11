import { useQuery } from '@tanstack/react-query'
import { httpClient } from '../../shared/api/http-client'

export interface Company { id: string; name: string; code: string | null; active: boolean; notes: string; version: number }
export interface CompanySelection { id: string | null; name: string }
export interface CompanyEmployee {id:string;name:string;branchId:string|null;branchName:string|null;companyId:string|null;companyName:string|null;isActive:boolean}
export interface CompanyEmployeeFilters {branchId?:string;companyId?:string;search?:string;sortBy:'name'|'branch'|'company';sortOrder:'asc'|'desc';page:number}
export function useCompanyEmployees(companyId:string,filters:CompanyEmployeeFilters) {
  return useQuery({queryKey:['company-employee-candidates',companyId,filters],queryFn:async({signal})=>(await httpClient.get<{employees:CompanyEmployee[];total:number;page:number;totalPages:number}>(`/companies/${companyId}/employees`,{params:{...filters,limit:25},signal})).data})
}
export function assignCompanyEmployees(company:Company,employees:CompanyEmployee[]) {
  return httpClient.post<{assigned:number}>(`/companies/${company.id}/employees`,{expectedVersion:company.version,assignments:employees.map(employee=>({employeeId:employee.id,expectedCompanyId:employee.companyId}))},{timeout:60_000})
}
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
