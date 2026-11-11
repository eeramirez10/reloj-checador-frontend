import Alert from '@mui/material/Alert'
import Button from '@mui/material/Button'
import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { useState, type FormEvent } from 'react'
import { useMutation,useQueryClient } from '@tanstack/react-query'
import { useMyProfile,contactValues,contactInput,type PortalProfile,type EmployeeContact } from '../features/portal/api'
import EmployeeContactFields from '../features/employees/employee-contact-fields'
import { httpClient } from '../shared/api/http-client'
import { getApiErrorMessage } from '../shared/api/api-error'
import PageHeader from '../shared/ui/page-header'
import PageLoading from '../shared/ui/page-loading'

export default function MyProfilePage() {
  const profile = useMyProfile()
  return <><PageHeader title="Mi perfil" description="Mantén actualizados tus teléfonos y tipo de sangre." />
    {profile.isPending ? <PageLoading /> : profile.isError ? <Alert severity="error">{getApiErrorMessage(profile.error)}</Alert>
      : <ProfileForm key={profile.data.employeeId} profile={profile.data} />}
  </>
}
function ProfileForm({ profile }: { profile: PortalProfile }) {
  const client = useQueryClient()
  const [value,setValue] = useState(() => contactValues(profile.contact))
  const [saved,setSaved] = useState(false)
  const mutation = useMutation({ mutationFn: () => httpClient.put<EmployeeContact>('/me/contact',contactInput(value,profile.contact.version,false)),
    onSuccess: async response => { setValue(contactValues(response.data)); setSaved(true); await client.invalidateQueries({ queryKey: ['my-profile'] }) } })
  function submit(event: FormEvent) { event.preventDefault(); mutation.mutate() }
  return <Paper variant="outlined" sx={{ p: { xs: 2,sm: 3 },maxWidth: 680 }}><Stack component="form" spacing={3} onSubmit={submit}>
    <Stack spacing={0.5}><Typography variant="h2">{profile.name}</Typography><Typography variant="body2" color="text.secondary">{profile.branchName ?? 'Sin sucursal'}{profile.employeeNumber ? ` · Nómina ${profile.employeeNumber}` : ''}</Typography>
      <Typography variant="body2">Empresa: {profile.companyName ?? 'Sin empresa'}</Typography>
      <Typography variant="body2">Jefe directo: {profile.managerName ?? 'Sin asignar'}</Typography></Stack>
    {saved && <Alert severity="success">Datos actualizados.</Alert>}
    {mutation.isError && <Alert severity="error">{getApiErrorMessage(mutation.error)}</Alert>}
    <EmployeeContactFields value={value} onChange={next => { setSaved(false); setValue(next) }} canEditEmail={false} disabled={mutation.isPending} />
    <Button type="submit" variant="contained" disabled={mutation.isPending} sx={{ alignSelf: 'flex-start' }}>{mutation.isPending ? 'Guardando…' : 'Guardar mis datos'}</Button>
  </Stack></Paper>
}
