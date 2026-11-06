import AccessTimeFilledRoundedIcon from '@mui/icons-material/AccessTimeFilledRounded'
import Box from '@mui/material/Box'
import Divider from '@mui/material/Divider'
import Drawer from '@mui/material/Drawer'
import List from '@mui/material/List'
import ListItemButton from '@mui/material/ListItemButton'
import ListItemIcon from '@mui/material/ListItemIcon'
import ListItemText from '@mui/material/ListItemText'
import Tooltip from '@mui/material/Tooltip'
import Typography from '@mui/material/Typography'
import { NavLink, useLocation } from 'react-router-dom'
import { navigationSections } from './navigation'
import { useAuth } from '../../features/auth/auth-context'
import { canOpenPage, roleLabels } from '../../features/auth/types'

type SidebarProps = {
  collapsed: boolean
  mobileOpen: boolean
  onCloseMobile: () => void
  onNavigate: () => void
}

type SidebarContentProps = {
  collapsed: boolean
  onNavigate: () => void
}

function SidebarContent({ collapsed, onNavigate }: SidebarContentProps) {
  const { pathname } = useLocation()
  const { account } = useAuth()
  const sections = navigationSections.map(section => ({ ...section, items: section.items.filter(item => account && canOpenPage(account.role, item.path)) })).filter(section => section.items.length)

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Box
        component={NavLink}
        to="/"
        onClick={onNavigate}
        sx={{
          alignItems: 'center',
          color: 'text.primary',
          display: 'flex',
          gap: 1.25,
          height: 64,
          justifyContent: collapsed ? 'center' : 'flex-start',
          px: collapsed ? 1 : 2.5,
          textDecoration: 'none',
          whiteSpace: 'nowrap',
        }}
      >
        <AccessTimeFilledRoundedIcon color="primary" sx={{ fontSize: 30 }} />
        {!collapsed && (
          <Typography noWrap sx={{ fontSize: 17, fontWeight: 600 }}>
            Reloj Checador
          </Typography>
        )}
      </Box>
      <Divider />

      <Box component="nav" aria-label="Navegación principal" sx={{ flex: 1, overflowY: 'auto', py: 1.5 }}>
        {sections.map((section) => (
          <Box key={section.label} sx={{ mb: 1.5 }}>
            {!collapsed && (
              <Typography color="text.secondary" sx={{ px: 2.5, py: 1 }} variant="caption">
                {section.label}
              </Typography>
            )}
            <List disablePadding>
              {section.items.map((item) => {
                const isActive = item.path === '/'
                  ? pathname === '/'
                  : pathname === item.path || pathname.startsWith(`${item.path}/`)
                const link = (
                  <ListItemButton
                    component={NavLink}
                    end={item.path === '/'}
                    key={item.path}
                    onClick={onNavigate}
                    selected={isActive}
                    to={item.path}
                    sx={{
                      borderLeft: '3px solid transparent',
                      color: 'text.primary',
                      justifyContent: collapsed ? 'center' : 'flex-start',
                      minHeight: 44,
                      mx: 0,
                      px: collapsed ? 1 : 2.25,
                      '&.Mui-selected': {
                        bgcolor: 'primary.light',
                        borderLeftColor: 'primary.main',
                        color: 'primary.main',
                      },
                      '&:hover': { bgcolor: 'action.hover' },
                      '&.Mui-selected:hover': { bgcolor: 'primary.light' },
                    }}
                  >
                    <ListItemIcon
                      sx={{
                        color: 'inherit',
                        minWidth: 32,
                        justifyContent: 'center',
                      }}
                    >
                      {item.icon}
                    </ListItemIcon>
                    {!collapsed && <ListItemText primary={item.label} sx={{ '& .MuiListItemText-primary': { fontSize: 14 } }} />}
                  </ListItemButton>
                )

                return collapsed ? (
                  <Tooltip key={item.path} placement="right" title={item.label}>
                    {link}
                  </Tooltip>
                ) : (
                  link
                )
              })}
            </List>
          </Box>
        ))}
      </Box>

      {!collapsed && (
        <Box sx={{ borderTop: 1, borderColor: 'divider', px: 2.5, py: 1.75 }}>
          <Typography color="text.secondary" variant="caption">
            {account ? `${roleLabels[account.role]} · ${account.role === 'admin' ? 'Todas las sucursales' : `${account.branchIds.length} sucursales autorizadas`}` : 'Asistencia local'}
          </Typography>
        </Box>
      )}
    </Box>
  )
}

function Sidebar({ collapsed, mobileOpen, onCloseMobile, onNavigate }: SidebarProps) {
  const desktopWidth = collapsed ? 76 : 254

  return (
    <>
      <Drawer
        variant="permanent"
        sx={{
          display: { xs: 'none', md: 'block' },
          flexShrink: 0,
          width: desktopWidth,
          '& .MuiDrawer-paper': {
            boxSizing: 'border-box',
            width: desktopWidth,
            borderRight: 1,
            borderColor: 'divider',
            overflowX: 'hidden',
            transition: 'width 160ms ease',
            '@media (prefers-reduced-motion: reduce)': { transition: 'none' },
          },
        }}
      >
        <SidebarContent collapsed={collapsed} onNavigate={onNavigate} />
      </Drawer>
      <Drawer
        open={mobileOpen}
        onClose={onCloseMobile}
        variant="temporary"
        sx={{
          display: { xs: 'block', md: 'none' },
          '& .MuiDrawer-paper': { boxSizing: 'border-box', width: 254 },
        }}
      >
        <SidebarContent collapsed={false} onNavigate={onNavigate} />
      </Drawer>
    </>
  )
}

export default Sidebar
