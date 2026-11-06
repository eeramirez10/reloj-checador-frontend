import AccessTimeRoundedIcon from '@mui/icons-material/AccessTimeRounded'
import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded'
import DevicesOtherOutlinedIcon from '@mui/icons-material/DevicesOtherOutlined'
import GroupsOutlinedIcon from '@mui/icons-material/GroupsOutlined'
import SyncAltRoundedIcon from '@mui/icons-material/SyncAltRounded'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardActionArea from '@mui/material/CardActionArea'
import CardContent from '@mui/material/CardContent'
import CircularProgress from '@mui/material/CircularProgress'
import Grid from '@mui/material/Grid'
import Paper from '@mui/material/Paper'
import Skeleton from '@mui/material/Skeleton'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { Link as RouterLink } from 'react-router-dom'
import { useDevices } from '../features/devices/hooks/use-devices'
import { useSyncRuns } from '../features/synchronization/hooks/use-sync-runs'
import type { ReactNode } from 'react'
import { usePermissions } from '../features/auth/auth-context'

const dateFormatter = new Intl.DateTimeFormat('es-MX', {
  dateStyle: 'medium',
  timeStyle: 'short',
})

const syncStatusLabel = {
  running: 'En curso',
  succeeded: 'Completada',
  failed: 'Fallida',
} as const

function formatSyncDate(value: string): string {
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? 'Fecha no disponible' : dateFormatter.format(date)
}

type MetricCardProps = {
  title: string
  value: string
  detail: string
  loading: boolean
  icon: ReactNode
}

function MetricCard({ title, value, detail, loading, icon }: MetricCardProps) {
  return (
    <Paper variant="outlined" sx={{ minHeight: 138, p: 2.5 }}>
      <Stack direction="row" spacing={2} sx={{ justifyContent: 'space-between' }}>
        <Stack spacing={1}>
          <Typography color="text.secondary" variant="body2">{title}</Typography>
          {loading ? <Skeleton height={36} width={100} /> : <Typography variant="h2">{value}</Typography>}
          <Typography color="text.secondary" variant="caption">{detail}</Typography>
        </Stack>
        <Stack
          sx={{ alignItems: 'center', alignSelf: 'flex-start', bgcolor: 'primary.light', borderRadius: 1, color: 'primary.main', display: 'flex', height: 40, justifyContent: 'center', width: 40 }}
        >
          {icon}
        </Stack>
      </Stack>
    </Paper>
  )
}

type ShortcutCardProps = {
  title: string
  description: string
  to: string
  icon: ReactNode
}

function ShortcutCard({ title, description, to, icon }: ShortcutCardProps) {
  return (
    <Card variant="outlined" sx={{ height: '100%' }}>
      <CardActionArea component={RouterLink} to={to} sx={{ height: '100%' }}>
        <CardContent sx={{ alignItems: 'flex-start', display: 'flex', gap: 2, p: 2.5 }}>
          <Stack
            sx={{ alignItems: 'center', bgcolor: 'primary.light', borderRadius: 1, color: 'primary.main', display: 'flex', flexShrink: 0, height: 40, justifyContent: 'center', width: 40 }}
          >
            {icon}
          </Stack>
          <Stack spacing={0.5} sx={{ minWidth: 0, flexGrow: 1 }}>
            <Typography sx={{ fontWeight: 500 }}>{title}</Typography>
            <Typography color="text.secondary" variant="body2">{description}</Typography>
          </Stack>
          <ArrowForwardRoundedIcon color="action" fontSize="small" />
        </CardContent>
      </CardActionArea>
    </Card>
  )
}

function DashboardPage() {
  const { isAdmin, canManagePersonnel } = usePermissions()
  const devices = useDevices()
  const syncRuns = useSyncRuns()
  const latestSync = syncRuns.data?.[0]
  const latestSyncValue = latestSync
    ? syncStatusLabel[latestSync.status]
    : syncRuns.isPending
      ? 'Cargando'
      : syncRuns.isError
        ? 'No disponible'
        : 'Sin registros'
  const latestSyncDetail = latestSync
    ? formatSyncDate(latestSync.startedAt)
    : syncRuns.isError
      ? 'No se pudo consultar el servicio'
      : 'El historial aparecerá al sincronizar un reloj'

  return (
    <Stack spacing={3}>
      <Stack spacing={0.75}>
        <Typography component="h1" variant="h1">Resumen</Typography>
        <Typography color="text.secondary" variant="body2">
          Administra los relojes y consulta las asistencias de tu instalación.
        </Typography>
      </Stack>

      <Paper
        variant="outlined"
        sx={{
          alignItems: 'center',
          bgcolor: '#eff6ff',
          display: 'grid',
          gap: { xs: 3, md: 5 },
          gridTemplateColumns: { xs: '1fr', md: 'minmax(0, 1fr) auto' },
          p: { xs: 2.5, sm: 4 },
        }}
      >
        <Stack spacing={2} sx={{ alignItems: 'flex-start' }}>
          <Typography component="h2" variant="h2">De la checada al registro.</Typography>
          <Typography color="text.secondary" sx={{ maxWidth: 520 }} variant="body2">
            Centraliza los dispositivos ZKTeco, sincroniza sus registros y revisa la actividad de tu equipo.
          </Typography>
          <Button component={RouterLink} endIcon={<ArrowForwardRoundedIcon />} to={isAdmin ? '/devices' : '/employees'} variant="contained">
            {isAdmin ? 'Ver dispositivos' : 'Ver empleados'}
          </Button>
        </Stack>

        <Stack
          direction={{ xs: 'row', md: 'column' }}
          spacing={{ xs: 1.5, md: 1 }}
          sx={{ alignItems: 'center', justifyContent: 'center', minWidth: { md: 180 } }}
        >
          <Paper variant="outlined" sx={{ alignItems: 'center', display: 'flex', gap: 1.25, p: 1.5, width: { xs: 'auto', md: '100%' } }}>
            <AccessTimeRoundedIcon color="primary" />
            <Typography variant="body2">Reloj ZKTeco</Typography>
          </Paper>
          <ArrowForwardRoundedIcon color="action" sx={{ display: { xs: 'none', md: 'block' }, transform: 'rotate(90deg)' }} />
          <Paper variant="outlined" sx={{ alignItems: 'center', display: 'flex', gap: 1.25, p: 1.5, width: { xs: 'auto', md: '100%' } }}>
            <SyncAltRoundedIcon color="primary" />
            <Typography variant="body2">Asistencias</Typography>
          </Paper>
        </Stack>
      </Paper>

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, md: 6 }}>
          <MetricCard
            detail={devices.isError ? 'No se pudo consultar el servicio' : 'Registrados en el sistema'}
            icon={<DevicesOtherOutlinedIcon fontSize="small" />}
            loading={devices.isPending}
            title="Dispositivos"
            value={devices.isError ? '—' : String(devices.data?.length ?? 0)}
          />
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <MetricCard
            detail={latestSyncDetail}
            icon={syncRuns.isPending ? <CircularProgress size={17} /> : <SyncAltRoundedIcon fontSize="small" />}
            loading={false}
            title="Última sincronización"
            value={latestSyncValue}
          />
        </Grid>
      </Grid>

      <Stack spacing={1.5}>
        <Typography component="h2" variant="h3">Accesos directos</Typography>
        <Grid container spacing={2}>
          {isAdmin && <Grid size={{ xs: 12, sm: 6 }}>
            <ShortcutCard
              description="Configura relojes y revisa su conectividad."
              icon={<DevicesOtherOutlinedIcon fontSize="small" />}
              title="Dispositivos"
              to="/devices"
            />
          </Grid>}
          <Grid size={{ xs: 12, sm: 6 }}>
            <ShortcutCard
              description="Administra las fichas, relojes y datos de tu personal."
              icon={<GroupsOutlinedIcon fontSize="small" />}
              title="Empleados"
              to="/employees"
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <ShortcutCard
              description="Revisa las checadas almacenadas y sus horarios."
              icon={<AccessTimeRoundedIcon fontSize="small" />}
              title="Checadas"
              to="/attendance"
            />
          </Grid>
          {canManagePersonnel && <Grid size={{ xs: 12, sm: 6 }}>
            <ShortcutCard
              description="Consulta resultados y errores de sincronización."
              icon={<SyncAltRoundedIcon fontSize="small" />}
              title="Sincronización"
              to="/synchronization"
            />
          </Grid>}
        </Grid>
      </Stack>
    </Stack>
  )
}

export default DashboardPage
