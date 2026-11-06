import AccessTimeRoundedIcon from '@mui/icons-material/AccessTimeRounded'
import EventAvailableOutlinedIcon from '@mui/icons-material/EventAvailableOutlined'
import DevicesOtherOutlinedIcon from '@mui/icons-material/DevicesOtherOutlined'
import BadgeOutlinedIcon from '@mui/icons-material/BadgeOutlined'
import StoreOutlinedIcon from '@mui/icons-material/StoreOutlined'
import CalendarMonthOutlinedIcon from '@mui/icons-material/CalendarMonthOutlined'
import AssignmentIndOutlinedIcon from '@mui/icons-material/AssignmentIndOutlined'
import FactCheckOutlinedIcon from '@mui/icons-material/FactCheckOutlined'
import AssignmentOutlinedIcon from '@mui/icons-material/AssignmentOutlined'
import SyncAltRoundedIcon from '@mui/icons-material/SyncAltRounded'
import SpaceDashboardOutlinedIcon from '@mui/icons-material/SpaceDashboardOutlined'
import ManageAccountsOutlinedIcon from '@mui/icons-material/ManageAccountsOutlined'
import type { ReactNode } from 'react'

export interface NavigationItem {
  label: string
  path: string
  icon: ReactNode
}

export interface NavigationSection {
  label: string
  items: NavigationItem[]
}

export const navigationSections: NavigationSection[] = [
  {
    label: 'General',
    items: [{ label: 'Resumen', path: '/', icon: <SpaceDashboardOutlinedIcon fontSize="small" /> }],
  },
  {
    label: 'Administración',
    items: [
      { label: 'Sucursales', path: '/branches', icon: <StoreOutlinedIcon fontSize="small" /> },
      { label: 'Cuentas de acceso', path: '/accounts', icon: <ManageAccountsOutlinedIcon fontSize="small" /> },
      { label: 'Dispositivos', path: '/devices', icon: <DevicesOtherOutlinedIcon fontSize="small" /> },
      { label: 'Empleados', path: '/employees', icon: <BadgeOutlinedIcon fontSize="small" /> },
      { label: 'Horarios y reglas', path: '/schedules', icon: <CalendarMonthOutlinedIcon fontSize="small" /> },
      { label: 'Asignaciones', path: '/assignments', icon: <AssignmentIndOutlinedIcon fontSize="small" /> },
    ],
  },
  {
    label: 'Asistencia',
    items: [
      { label: 'Checadas', path: '/attendance', icon: <AccessTimeRoundedIcon fontSize="small" /> },
      { label: 'Asistencia diaria', path: '/daily-attendance', icon: <FactCheckOutlinedIcon fontSize="small" /> },
      { label: 'Tarjetas de asistencia', path: '/attendance-cards', icon: <AssignmentOutlinedIcon fontSize="small" /> },
      { label: 'Horas extras', path: '/overtime', icon: <AccessTimeRoundedIcon fontSize="small" /> },
      { label: 'Permisos', path: '/leave-requests', icon: <EventAvailableOutlinedIcon fontSize="small" /> },
      { label: 'Sincronización', path: '/synchronization', icon: <SyncAltRoundedIcon fontSize="small" /> },
    ],
  },
]
