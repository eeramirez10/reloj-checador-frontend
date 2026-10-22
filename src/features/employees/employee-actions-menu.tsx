import CalendarMonthRoundedIcon from '@mui/icons-material/CalendarMonthRounded'
import EditOutlinedIcon from '@mui/icons-material/EditOutlined'
import HistoryRoundedIcon from '@mui/icons-material/HistoryRounded'
import MoreHorizRoundedIcon from '@mui/icons-material/MoreHorizRounded'
import PersonSearchOutlinedIcon from '@mui/icons-material/PersonSearchOutlined'
import ScheduleRoundedIcon from '@mui/icons-material/ScheduleRounded'
import SwapHorizRoundedIcon from '@mui/icons-material/SwapHorizRounded'
import Button from '@mui/material/Button'
import Divider from '@mui/material/Divider'
import ListItemIcon from '@mui/material/ListItemIcon'
import Menu from '@mui/material/Menu'
import MenuItem from '@mui/material/MenuItem'
import { useId, useState } from 'react'
import { Link as RouterLink } from 'react-router-dom'
import type { Employee } from './types/employee'

export type EmployeeActions = Record<'edit' | 'identify' | 'clock' | 'assign' | 'history', (employee: Employee) => void>

export default function EmployeeActionsMenu({ employee, actions }: { employee: Employee; actions: EmployeeActions }) {
  const id = useId()
  const [anchor, setAnchor] = useState<HTMLElement | null>(null)
  const open = Boolean(anchor)
  function select(action: keyof EmployeeActions) { setAnchor(null); actions[action](employee) }
  return <>
    <Button id={`${id}-button`} size="small" endIcon={<MoreHorizRoundedIcon />} aria-label={`Opciones de ${employee.name}`}
      aria-haspopup="menu" aria-controls={open ? `${id}-menu` : undefined} aria-expanded={open ? true : undefined}
      onClick={(event) => setAnchor(event.currentTarget)}>Opciones</Button>
    <Menu id={`${id}-menu`} anchorEl={anchor} open={open} onClose={() => setAnchor(null)}
      slotProps={{ list: { 'aria-labelledby': `${id}-button` } }}>
      <MenuItem component={RouterLink} to={`/employees/${employee.id}/attendance`} onClick={() => setAnchor(null)}>
        <ListItemIcon><CalendarMonthRoundedIcon fontSize="small" /></ListItemIcon>Asistencia
      </MenuItem>
      <Divider />
      <MenuItem onClick={() => select('edit')}><ListItemIcon><EditOutlinedIcon fontSize="small" /></ListItemIcon>Editar</MenuItem>
      {employee.identificationStatus === 'pending' && <MenuItem onClick={() => select('identify')}><ListItemIcon><PersonSearchOutlinedIcon fontSize="small" /></ListItemIcon>Identificar</MenuItem>}
      {employee.identificationStatus === 'confirmed' && <MenuItem onClick={() => select('clock')}><ListItemIcon><ScheduleRoundedIcon fontSize="small" /></ListItemIcon>Reloj</MenuItem>}
      <MenuItem onClick={() => select('assign')}><ListItemIcon><SwapHorizRoundedIcon fontSize="small" /></ListItemIcon>Asignar</MenuItem>
      <MenuItem onClick={() => select('history')}><ListItemIcon><HistoryRoundedIcon fontSize="small" /></ListItemIcon>Historial</MenuItem>
    </Menu>
  </>
}
