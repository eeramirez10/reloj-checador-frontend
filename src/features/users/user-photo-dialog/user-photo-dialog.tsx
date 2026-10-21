import CloseRoundedIcon from '@mui/icons-material/CloseRounded'
import Alert from '@mui/material/Alert'
import Avatar from '@mui/material/Avatar'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import ButtonBase from '@mui/material/ButtonBase'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import IconButton from '@mui/material/IconButton'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { useState } from 'react'
import { getDeviceUserPhotoUrl } from '../api/users.api'
import type { UserPhotoReference } from '../types/user-photo-reference'

type UserPhotoDialogProps = {
  user: UserPhotoReference | null
  onClose: () => void
}

function getInitials(user: UserPhotoReference): string {
  if (!user.name?.trim()) return user.userId.slice(0, 2).toUpperCase()
  return user.name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase()
}

export function UserPhotoAvatar({ user, onClick }: { user: UserPhotoReference; onClick: () => void }) {
  const label = user.name || `Usuario ${user.userId}`
  const avatar = (
    <Avatar
      alt={label}
      slotProps={{ img: { loading: 'lazy' } }}
      src={user.hasPhoto ? getDeviceUserPhotoUrl(user.deviceId, user.userId) : undefined}
      sx={{ bgcolor: 'primary.light', color: 'primary.dark', fontSize: 12, height: 36, width: 36 }}
    >
      {getInitials(user)}
    </Avatar>
  )

  if (!user.hasPhoto) return avatar

  return (
    <ButtonBase
      aria-label={`Ampliar foto de ${label}`}
      onClick={onClick}
      sx={{ borderRadius: '50%', '&:focus-visible': { outline: '2px solid', outlineColor: 'primary.main', outlineOffset: 2 } }}
    >
      {avatar}
    </ButtonBase>
  )
}

function UserPhotoDialog({ user, onClose }: UserPhotoDialogProps) {
  const [imageFailed, setImageFailed] = useState(false)

  return (
    <Dialog aria-labelledby="user-photo-dialog-title" fullWidth maxWidth="sm" onClose={onClose} open={user !== null}>
      <DialogTitle id="user-photo-dialog-title" sx={{ alignItems: 'center', display: 'flex', justifyContent: 'space-between' }}>
        <Stack spacing={0.25}>
          <Typography component="span" sx={{ fontWeight: 600 }} variant="h3">
            {user?.name || `Usuario ${user?.userId ?? ''}`}
          </Typography>
          <Typography color="text.secondary" variant="caption">Foto de perfil</Typography>
        </Stack>
        <IconButton aria-label="Cerrar foto" onClick={onClose}>
          <CloseRoundedIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent sx={{ display: 'grid', minHeight: 300, placeItems: 'center', p: { xs: 2, sm: 3 } }}>
        {imageFailed ? (
          <Alert severity="error">No se pudo cargar la foto. Sincronízala nuevamente para este usuario.</Alert>
        ) : user ? (
          <Box
            alt={user.name || `Usuario ${user.userId}`}
            component="img"
            onError={() => setImageFailed(true)}
            src={getDeviceUserPhotoUrl(user.deviceId, user.userId)}
            sx={{ borderRadius: 1, maxHeight: '65vh', maxWidth: '100%', objectFit: 'contain' }}
          />
        ) : null}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} variant="outlined">Cerrar</Button>
      </DialogActions>
    </Dialog>
  )
}

export default UserPhotoDialog
