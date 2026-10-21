import OpenInNewRoundedIcon from '@mui/icons-material/OpenInNewRounded'
import Button from '@mui/material/Button'
import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import type { ReactNode } from 'react'

type EmptyStateProps = {
  icon: ReactNode
  title: string
  description: string
}

function EmptyState({ icon, title, description }: EmptyStateProps) {
  return (
    <Paper variant="outlined" sx={{ minHeight: 320, display: 'grid', placeItems: 'center', p: 3 }}>
      <Stack spacing={2} sx={{ alignItems: 'center', maxWidth: 440, textAlign: 'center' }}>
        <Stack
          aria-hidden="true"
          sx={{ alignItems: 'center', bgcolor: 'primary.light', borderRadius: '50%', color: 'primary.main', display: 'flex', height: 56, justifyContent: 'center', width: 56 }}
        >
          {icon}
        </Stack>
        <Typography component="h2" variant="h3">{title}</Typography>
        <Typography color="text.secondary" variant="body2">{description}</Typography>
        <Button
          component="a"
          endIcon={<OpenInNewRoundedIcon />}
          href="http://127.0.0.1:3005/docs"
          rel="noreferrer"
          target="_blank"
          variant="outlined"
        >
          Consultar la API
        </Button>
      </Stack>
    </Paper>
  )
}

export default EmptyState
