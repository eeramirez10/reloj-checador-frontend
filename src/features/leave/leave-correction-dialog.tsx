import { useQuery } from '@tanstack/react-query'
import Alert from '@mui/material/Alert'
import Dialog from '@mui/material/Dialog'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import Button from '@mui/material/Button'
import { useAuth } from '../auth/auth-context'
import { useMyProfile } from '../portal/api'
import type { Employee } from '../employees/types/employee'
import type { LeaveRequest } from './types'
import LeaveRequestDialog from './leave-request-dialog'
import { httpClient } from '../../shared/api/http-client'
import PageLoading from '../../shared/ui/page-loading'
import { getApiErrorMessage } from '../../shared/api/api-error'

export default function LeaveCorrectionDialog({request,onClose,onCreated}:{request:LeaveRequest;onClose:()=>void;onCreated:(id:string)=>void}) {
  const {account}=useAuth();const self=account?.employeeId===request.employeeId;
  const profile=useMyProfile(self);
  const person=useQuery({queryKey:['correction-employee',request.employeeId],enabled:!self,queryFn:async({signal})=>(await httpClient.get<Employee>(`/employees/${request.employeeId}`,{signal})).data});
  const error=self?profile.error:person.error;
  if(error || (self?!profile.data:!person.data)) return <Dialog open fullWidth maxWidth="sm" onClose={onClose}><DialogTitle>Corregir solicitud</DialogTitle><DialogContent>
    {error?<Alert severity="error">{getApiErrorMessage(error)}</Alert>:<PageLoading />}<Button onClick={onClose}>Cerrar</Button>
  </DialogContent></Dialog>;
  return <LeaveRequestDialog initialRequest={request} selfProfile={self?profile.data:undefined} employees={self?[]:[person.data!]} onClose={onClose} onCreated={onCreated} />;
}
