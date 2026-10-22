import HelpOutlineRoundedIcon from '@mui/icons-material/HelpOutlineRounded'
import MenuOpenRoundedIcon from '@mui/icons-material/MenuOpenRounded'
import MenuRoundedIcon from '@mui/icons-material/MenuRounded'
import Avatar from '@mui/material/Avatar'
import Box from '@mui/material/Box'
import IconButton from '@mui/material/IconButton'
import Stack from '@mui/material/Stack'
import Toolbar from '@mui/material/Toolbar'
import Tooltip from '@mui/material/Tooltip'
import Typography from '@mui/material/Typography'
import AppBar from '@mui/material/AppBar'
import { matchPath, useLocation } from 'react-router-dom'
import { useServiceHealth } from '../../features/system/hooks/use-service-health'
import { navigationSections } from './navigation'

type HeaderProps = {
  collapsed: boolean
  sidebarWidth: number
  onToggleSidebar: () => void
  onOpenMobileMenu: () => void
}

function Header({ collapsed, sidebarWidth, onToggleSidebar, onOpenMobileMenu }: HeaderProps) {
  const location = useLocation()
  const serviceHealth = useServiceHealth()
  const page = navigationSections.flatMap((section) => section.items).find((item) => item.path === location.pathname)
  const pageTitle = matchPath('/employees/:id/attendance', location.pathname) ? 'Tarjeta de asistencia' : page?.label ?? 'Página no encontrada'
  const serviceStatus = serviceHealth.isPending
    ? 'Conectando con el servicio'
    : serviceHealth.isError
      ? 'Servicio sin conexión'
      : 'Servicio conectado'

  return (
    <AppBar
      color="inherit"
      position="fixed"
      sx={{
        bgcolor: 'background.paper',
        borderBottom: 1,
        borderColor: 'divider',
        borderTop: '3px solid #3d3d3d',
        boxShadow: 'none',
        ml: { xs: 0, md: `${sidebarWidth}px` },
        width: { xs: '100%', md: `calc(100% - ${sidebarWidth}px)` },
        transition: 'width 160ms ease, margin 160ms ease',
        '@media (prefers-reduced-motion: reduce)': { transition: 'none' },
      }}
    >
      <Toolbar disableGutters sx={{ minHeight: '64px !important', px: { xs: 1.5, sm: 2.5 } }}>
        <IconButton
          aria-label="Abrir menú"
          onClick={onOpenMobileMenu}
          sx={{ display: { xs: 'inline-flex', md: 'none' }, mr: 1 }}
        >
          <MenuRoundedIcon />
        </IconButton>
        <IconButton
          aria-label={collapsed ? 'Expandir menú' : 'Contraer menú'}
          onClick={onToggleSidebar}
          sx={{ display: { xs: 'none', md: 'inline-flex' }, mr: 1.5 }}
        >
          {collapsed ? <MenuRoundedIcon /> : <MenuOpenRoundedIcon />}
        </IconButton>
        <Typography color="text.primary" noWrap sx={{ fontSize: 14, fontWeight: 500 }}>
          {pageTitle}
        </Typography>

        <Box sx={{ flexGrow: 1 }} />
        <Stack direction="row" spacing={{ xs: 1, sm: 2 }} sx={{ alignItems: 'center' }}>
          <Stack direction="row" spacing={0.75} sx={{ alignItems: 'center' }} title={serviceStatus}>
            <Box
              aria-hidden="true"
              sx={{
                bgcolor: serviceHealth.isPending ? 'warning.main' : serviceHealth.isError ? 'error.main' : 'success.main',
                borderRadius: '50%',
                height: 8,
                width: 8,
              }}
            />
            <Typography color="text.secondary" sx={{ display: { xs: 'none', sm: 'block' } }} variant="caption">
              {serviceStatus}
            </Typography>
          </Stack>
          <Tooltip title="Documentación de la API">
            <IconButton
              aria-label="Abrir documentación de la API"
              component="a"
              href="http://127.0.0.1:3005/docs"
              rel="noreferrer"
              size="small"
              target="_blank"
            >
              <HelpOutlineRoundedIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Avatar
            aria-label="Reloj Checador"
            sx={{ bgcolor: 'primary.light', color: 'primary.dark', fontSize: 12, fontWeight: 600, width: 32, height: 32 }}
          >
            RC
          </Avatar>
        </Stack>
      </Toolbar>
    </AppBar>
  )
}

export default Header
