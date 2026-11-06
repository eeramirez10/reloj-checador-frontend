import Alert from '@mui/material/Alert'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import type { RouteDaySegment } from './types/overtime'
import { formatRouteDate } from './overtime-format'

export default function RouteDetails({ routes }: { routes?: RouteDaySegment[] }) {
  if (!routes?.length) return null
  return <Stack spacing={1}>
    <Alert severity="info">Los tramos diarios se calculan entre la entrada y el regreso de la ruta. No son checadas adicionales.</Alert>
    {routes.map((route) => <Stack key={route.id} spacing={0.5}>
      <Typography variant="body2">Entrada de ruta: {formatRouteDate(route.enteredAt, route.timeZone)}.</Typography>
      <Typography variant="body2">Regreso de ruta: {formatRouteDate(route.exitedAt, route.timeZone)}.</Typography>
      <Typography variant="caption" color="text.secondary">Tramo de este día: {formatRouteDate(route.segmentStart, route.timeZone)} — {formatRouteDate(route.segmentEnd, route.timeZone)} ({route.timeZone}).</Typography>
    </Stack>)}
  </Stack>
}
