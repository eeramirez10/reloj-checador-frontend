import Box from '@mui/material/Box'
import CircularProgress from '@mui/material/CircularProgress'

function PageLoading() {
  return (
    <Box role="status" aria-label="Cargando página" sx={{ display: 'grid', minHeight: 240, placeItems: 'center' }}>
      <CircularProgress size={28} />
    </Box>
  )
}

export default PageLoading
