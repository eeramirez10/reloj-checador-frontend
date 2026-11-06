import AccessTimeFilledRoundedIcon from '@mui/icons-material/AccessTimeFilledRounded'
import Box from '@mui/material/Box'
import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import type { PropsWithChildren } from 'react'

export default function AuthShell({ title, children }: PropsWithChildren<{ title: string }>) {
  return <Box sx={{ minHeight: '100dvh', display: 'grid', placeItems: 'center', p: { xs: 2, sm: 4 }, bgcolor: 'background.default' }}>
    <Stack spacing={3} sx={{ width: '100%', maxWidth: 440 }}>
      <Stack direction="row" spacing={1} sx={{ alignItems: 'center', justifyContent: 'center' }}><AccessTimeFilledRoundedIcon color="primary" /><Typography variant="h3">Reloj Checador</Typography></Stack>
      <Paper variant="outlined" sx={{ p: { xs: 3, sm: 4 } }}><Stack spacing={3}>
        <Typography component="h1" variant="h2">{title}</Typography>
        {children}
      </Stack></Paper>
      <Typography variant="caption" color="text.secondary" sx={{ textAlign: 'center' }}>Panel de administración · Acceso por sucursal</Typography>
    </Stack>
  </Box>
}
