import Box from '@mui/material/Box'
import { useState } from 'react'
import { Outlet, useNavigation } from 'react-router-dom'
import Header from './header'
import Sidebar from './sidebar'
import PageLoading from '../../shared/ui/page-loading'

function ApplicationLayout() {
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const navigation = useNavigation()
  const sidebarWidth = collapsed ? 76 : 254

  return (
    <Box sx={{ bgcolor: 'background.default', display: 'flex', minHeight: '100vh' }}>
      <Sidebar
        collapsed={collapsed}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
        onNavigate={() => setMobileOpen(false)}
      />
      <Header
        collapsed={collapsed}
        sidebarWidth={sidebarWidth}
        onOpenMobileMenu={() => setMobileOpen(true)}
        onToggleSidebar={() => setCollapsed((current) => !current)}
      />
      <Box component="main" sx={{ flexGrow: 1, minWidth: 0, pt: '67px' }}>
        <Box sx={{ maxWidth: 1600, mx: 'auto', px: { xs: 2, sm: 3, lg: 5 }, py: { xs: 3, sm: 4 } }}>
          {navigation.state === 'loading' ? <PageLoading /> : <Outlet />}
        </Box>
      </Box>
    </Box>
  )
}

export default ApplicationLayout
