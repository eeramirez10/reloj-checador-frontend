import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded'
import Button from '@mui/material/Button'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { Link as RouterLink } from 'react-router-dom'

function NotFoundPage() {
  return (
    <Stack spacing={2} sx={{ alignItems: 'flex-start', py: 5 }}>
      <Typography component="h1" variant="h1">No encontramos esta página</Typography>
      <Typography color="text.secondary">Revisa la dirección o vuelve al resumen.</Typography>
      <Button component={RouterLink} startIcon={<ArrowBackRoundedIcon />} to="/" variant="outlined">
        Volver al resumen
      </Button>
    </Stack>
  )
}

export default NotFoundPage
