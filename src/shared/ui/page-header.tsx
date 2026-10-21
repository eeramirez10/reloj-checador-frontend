import Breadcrumbs from '@mui/material/Breadcrumbs'
import Link from '@mui/material/Link'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { Link as RouterLink } from 'react-router-dom'
import type { ReactNode } from 'react'

type PageHeaderProps = {
  title: string
  description: string
  action?: ReactNode
}

function PageHeader({ title, description, action }: PageHeaderProps) {
  return (
    <Stack
      direction={{ xs: 'column', sm: 'row' }}
      spacing={2}
      sx={{ alignItems: { xs: 'stretch', sm: 'flex-end' }, justifyContent: 'space-between', mb: 3 }}
    >
      <Stack spacing={1}>
        <Breadcrumbs aria-label="Ruta de navegación" separator="/">
          <Link color="text.secondary" component={RouterLink} underline="hover" to="/">
            Inicio
          </Link>
          <Typography color="text.primary" variant="body2">{title}</Typography>
        </Breadcrumbs>
        <Typography component="h1" variant="h1">{title}</Typography>
        <Typography color="text.secondary" variant="body2">{description}</Typography>
      </Stack>
      {action}
    </Stack>
  )
}

export default PageHeader
