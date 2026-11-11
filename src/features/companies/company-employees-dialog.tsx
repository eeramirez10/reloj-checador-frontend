import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Checkbox from '@mui/material/Checkbox'
import Chip from '@mui/material/Chip'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import MenuItem from '@mui/material/MenuItem'
import Pagination from '@mui/material/Pagination'
import Stack from '@mui/material/Stack'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import { useState } from 'react'
import { useBranches,useOrganizationMutation } from '../organization/api'
import CompanySelect from './company-select'
import { assignCompanyEmployees,useCompanyEmployees,type Company,type CompanyEmployee,type CompanyEmployeeFilters } from './api'
import PageLoading from '../../shared/ui/page-loading'
import { getApiErrorMessage } from '../../shared/api/api-error'

export default function CompanyEmployeesDialog({company,onClose}:{company:Company;onClose:()=>void}) {
  const branches=useBranches();
  const [filters,setFilters]=useState<CompanyEmployeeFilters>({sortBy:'name',sortOrder:'asc',page:1});
  const [selected,setSelected]=useState<Map<string,CompanyEmployee>>(()=>new Map());
  const candidates=useCompanyEmployees(company.id,filters);
  const mutation=useOrganizationMutation(()=>assignCompanyEmployees(company,[...selected.values()]));
  const [saved,setSaved]=useState<number|null>(null);
  const rows=candidates.data?.employees??[];
  const changes=[...selected.values()].filter(employee=>employee.companyId!==company.id).length;
  function update(next:Partial<CompanyEmployeeFilters>) {setFilters(current=>({...current,...next,page:1}));setSaved(null)}
  function toggle(employees:CompanyEmployee[],checked:boolean) {
    setSelected(current=>{const next=new Map(current);for(const employee of employees){if(!checked)next.delete(employee.id);else if(next.has(employee.id)||next.size<500)next.set(employee.id,employee)}return next});setSaved(null)
  }
  async function save() {try{const result=await mutation.mutateAsync(undefined);setSaved(result.data.assigned);setSelected(new Map())}catch{/* La operación muestra el error y conserva la selección para revisarla. */}}
  return <Dialog open fullWidth maxWidth="lg" onClose={mutation.isPending?undefined:onClose}>
    <DialogTitle>Asignar empleados · {company.name}</DialogTitle>
    <DialogContent dividers><Stack spacing={2}>
      <Typography variant="body2">Selecciona empleados de las sucursales autorizadas. Si pertenecen a otra empresa, se cambiarán a {company.name}. La selección se conserva al cambiar filtros o página.</Typography>
      <Box sx={{display:'grid',gap:2,gridTemplateColumns:{xs:'1fr',sm:'1fr 1fr',md:'repeat(3,minmax(0,1fr))'}}}>
        <TextField select label="Sucursal" value={filters.branchId??''} disabled={mutation.isPending||branches.isPending} onChange={event=>update({branchId:event.target.value||undefined})}>
          <MenuItem value="">Todas las sucursales autorizadas</MenuItem>{branches.data?.map(branch=><MenuItem key={branch.id} value={branch.id}>{branch.name}</MenuItem>)}
        </TextField>
        <CompanySelect value={filters.companyId??''} disabled={mutation.isPending} onChange={value=>update({companyId:value||undefined})} />
        <TextField label="Buscar empleado" value={filters.search??''} disabled={mutation.isPending} onChange={event=>update({search:event.target.value||undefined})} slotProps={{htmlInput:{maxLength:120}}} helperText="Nombre o ID del reloj." />
        <TextField select label="Ordenar por" value={filters.sortBy} disabled={mutation.isPending} onChange={event=>update({sortBy:event.target.value as CompanyEmployeeFilters['sortBy']})}>
          <MenuItem value="name">Nombre</MenuItem><MenuItem value="branch">Sucursal</MenuItem><MenuItem value="company">Empresa actual</MenuItem>
        </TextField>
        <TextField select label="Orden" value={filters.sortOrder} disabled={mutation.isPending} onChange={event=>update({sortOrder:event.target.value as CompanyEmployeeFilters['sortOrder']})}>
          <MenuItem value="asc">Ascendente</MenuItem><MenuItem value="desc">Descendente</MenuItem>
        </TextField>
      </Box>
      {branches.isError&&<Alert severity="error">{getApiErrorMessage(branches.error)}</Alert>}
      {candidates.isError&&<Alert severity="error">{getApiErrorMessage(candidates.error)}</Alert>}
      {mutation.isError&&<Alert severity="error">{getApiErrorMessage(mutation.error)}</Alert>}
      {saved!==null&&<Alert severity="success">Empleados asignados: {saved}.</Alert>}
      <Stack direction="row" spacing={2} sx={{alignItems:'center',flexWrap:'wrap'}}><Typography variant="body2">{candidates.data?.total??0} resultados · {selected.size} seleccionados · {changes} cambiarán de empresa</Typography>
        <Button disabled={!selected.size||mutation.isPending} onClick={()=>setSelected(new Map())}>Limpiar selección</Button></Stack>
      {candidates.isPending?<PageLoading />:<TableContainer sx={{maxHeight:380}}><Table size="small" stickyHeader aria-label="Empleados para asignar empresa" sx={{minWidth:720}}>
        <TableHead><TableRow><TableCell padding="checkbox"><Checkbox disabled={!rows.length||mutation.isPending} checked={rows.length>0&&rows.every(row=>selected.has(row.id))} indeterminate={rows.some(row=>selected.has(row.id))&&!rows.every(row=>selected.has(row.id))} onChange={event=>toggle(rows,event.target.checked)} slotProps={{input:{'aria-label':'Seleccionar página'}}} /></TableCell><TableCell>Empleado</TableCell><TableCell>Sucursal</TableCell><TableCell>Empresa actual</TableCell><TableCell>Estado</TableCell></TableRow></TableHead>
        <TableBody>{rows.map(employee=><TableRow key={employee.id} hover selected={selected.has(employee.id)}>
          <TableCell padding="checkbox"><Checkbox checked={selected.has(employee.id)} disabled={mutation.isPending||selected.size>=500&&!selected.has(employee.id)} onChange={event=>toggle([employee],event.target.checked)} slotProps={{input:{'aria-label':`Seleccionar ${employee.name}`}}} /></TableCell>
          <TableCell>{employee.name}</TableCell><TableCell>{employee.branchName??'Sin sucursal'}</TableCell><TableCell>{employee.companyName??'Sin empresa'}</TableCell><TableCell><Chip size="small" variant="outlined" label={employee.isActive?'Activo':'Inactivo'} /></TableCell>
        </TableRow>)}{rows.length===0&&<TableRow><TableCell colSpan={5}>No hay empleados para estos filtros.</TableCell></TableRow>}</TableBody>
      </Table></TableContainer>}
      {candidates.data&&candidates.data.totalPages>1&&<Pagination page={candidates.data.page} count={candidates.data.totalPages} disabled={mutation.isPending} onChange={(_,page)=>setFilters(current=>({...current,page}))} />}
      <Typography variant="caption" color="text.secondary">Máximo 500 empleados por operación. Guardar afecta únicamente a los seleccionados.</Typography>
    </Stack></DialogContent>
    <DialogActions sx={{p:2}}><Button disabled={mutation.isPending} onClick={onClose}>Cerrar</Button><Button variant="contained" disabled={!selected.size||mutation.isPending||!company.active} onClick={()=>void save()}>{mutation.isPending?'Asignando…':'Asignar seleccionados'}</Button></DialogActions>
  </Dialog>
}
