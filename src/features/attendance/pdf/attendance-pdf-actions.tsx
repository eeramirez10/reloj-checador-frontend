import FileDownloadOutlinedIcon from '@mui/icons-material/FileDownloadOutlined'
import Alert from '@mui/material/Alert'
import Button from '@mui/material/Button'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import type { useAttendancePdfExport } from './use-attendance-pdf-export'

export default function AttendancePdfActions({ pdf, disabled, onExport, title }: {
  pdf: ReturnType<typeof useAttendancePdfExport>; disabled: boolean; onExport: () => void; title?: string
}) {
  const label = !pdf.busy ? 'Exportar PDF' : pdf.progress ? `Generando PDF (${pdf.progress.completed}/${pdf.progress.total})…` : 'Preparando PDF…'
  return <Stack spacing={1} sx={{ minWidth: 0, maxWidth: { sm: 420 } }}>
    <Stack direction="row" spacing={1} sx={{ alignItems: 'center', flexWrap: 'wrap', rowGap: 1 }} aria-busy={pdf.busy}>
      <Button variant="outlined" startIcon={<FileDownloadOutlinedIcon />} disabled={disabled || pdf.busy} onClick={onExport} title={title}>{label}</Button>
      {pdf.busy && <Button onClick={pdf.cancel}>Cancelar exportación</Button>}
    </Stack>
    {pdf.error && <Alert severity="error">{pdf.error}</Alert>}
    {pdf.file && <Alert severity="success" role="status" sx={{ '& .MuiAlert-message': { minWidth: 0, overflowWrap: 'anywhere' } }}>
      <Typography variant="body2" sx={{ fontWeight: 600 }}>PDF generado</Typography>
      <Typography variant="caption" component="p">{pdf.file.filename} · {Math.ceil(pdf.file.size / 1024)} KB</Typography>
      <Typography variant="body2">Si la descarga no comenzó, usa estos botones:</Typography>
      <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap' }}>
        <Button component="a" href={pdf.file.url} download={pdf.file.filename} size="small">Descargar PDF</Button>
        <Button component="a" href={pdf.file.url} target="_blank" rel="noopener noreferrer" size="small">Ver PDF</Button>
      </Stack>
    </Alert>}
  </Stack>
}
