import UploadFileOutlinedIcon from '@mui/icons-material/UploadFileOutlined'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import MenuItem from '@mui/material/MenuItem'
import Pagination from '@mui/material/Pagination'
import Stack from '@mui/material/Stack'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import { useEffect, useRef, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useDevices } from '../devices/hooks/use-devices'
import { recalculateAttendance, useBranches } from '../organization/api'
import { getApiErrorMessage } from '../../shared/api/api-error'
import PageLoading from '../../shared/ui/page-loading'
import { importAttendanceFile, previewAttendanceFile, useAttendanceFileHistory } from './api/attendance-file.api'
import type { AttendanceFileInput, AttendanceFilePreview, AttendanceFileResult, FileRowStatus } from './types/attendance-file'

const labels: Record<FileRowStatus, string> = { new: 'Nueva', existing: 'Ya existe', duplicate: 'Repetida en archivo', invalid: 'Inválida', ambiguous: 'Por revisar' }
const pageSize = 50

export default function AttendanceFileDialog({ initialBranchId, initialDeviceId, onClose }: {
  initialBranchId: string; initialDeviceId: string; onClose: () => void
}) {
  const branches = useBranches()
  const devices = useDevices()
  const client = useQueryClient()
  const [branchId, setBranchId] = useState(initialBranchId)
  const [deviceId, setDeviceId] = useState(initialDeviceId)
  const [file, setFile] = useState<{ fileName: string; content: string } | null>(null)
  const [preview, setPreview] = useState<AttendanceFilePreview | null>(null)
  const [receipt, setReceipt] = useState<AttendanceFileResult | null>(null)
  const [busy, setBusy] = useState<'reading' | 'preview' | 'import' | 'recalculate' | null>(null)
  const [error, setError] = useState('')
  const [showHistory, setShowHistory] = useState(false)
  const [page, setPage] = useState(1)
  const sequence = useRef(0)
  const controller = useRef<AbortController | null>(null)
  const history = useAttendanceFileHistory(deviceId, showHistory)
  useEffect(() => () => { sequence.current++; controller.current?.abort() }, [])
  const report = receipt ?? preview
  const input: AttendanceFileInput | null = file && branchId && deviceId ? { ...file, branchId, deviceId } : null
  const canImport = Boolean(input && preview && (preview.summary.new || preview.summary.existing) && !receipt && !busy)

  function reset() {
    sequence.current++; controller.current?.abort()
    setPreview(null); setReceipt(null); setError(''); setPage(1)
  }
  async function selectFile(selected?: File) {
    reset(); setFile(null)
    if (!selected) return
    if (!/\.txt$/i.test(selected.name)) { setError('Selecciona un archivo .txt.'); return }
    if (selected.size > 1_000_000) { setError('El archivo admite hasta 1 MB y 10 000 líneas.'); return }
    const current = sequence.current
    setBusy('reading')
    try {
      const content = new TextDecoder('utf-8', { fatal: true, ignoreBOM: true }).decode(await selected.arrayBuffer())
      if (current === sequence.current) setFile({ fileName: selected.name, content })
    } catch { if (current === sequence.current) setError('No se pudo leer el archivo. Utiliza texto UTF-8 o ASCII.') }
    finally { if (current === sequence.current) setBusy(null) }
  }
  async function review() {
    if (!input) return
    reset(); setBusy('preview')
    const current = sequence.current
    const abort = new AbortController(); controller.current = abort
    try { const result = await previewAttendanceFile(input, abort.signal); if (current === sequence.current) setPreview(result) }
    catch (cause) { if (!abort.signal.aborted && current === sequence.current) setError(getApiErrorMessage(cause)) }
    finally { if (current === sequence.current) setBusy(null) }
  }
  async function invalidate() {
    await Promise.all(['attendance', 'daily-attendance', 'employees', 'device-users', 'deductions', 'overtime-report', 'branch-attendance-cards', 'attendance-file-history']
      .map((key) => client.invalidateQueries({ queryKey: [key] })))
  }
  async function save() {
    if (!input || !preview || !canImport) return
    setBusy('import'); setError('')
    try { setReceipt(await importAttendanceFile(input, preview.token)); await invalidate() }
    catch (cause) { setError(getApiErrorMessage(cause)); setPreview(null) }
    finally { setBusy(null) }
  }
  async function retryCalculation() {
    setBusy('recalculate'); setError('')
    try { await recalculateAttendance(); setReceipt((current) => current ? { ...current, recalculated: true } : current); await invalidate() }
    catch (cause) { setError(getApiErrorMessage(cause)) }
    finally { setBusy(null) }
  }

  return <Dialog open fullWidth maxWidth="lg" onClose={busy ? undefined : onClose}>
    <DialogTitle>Importar checadas desde archivo</DialogTitle>
    <DialogContent dividers><Stack spacing={2.5}>
      <Typography variant="body2" color="text.secondary">Selecciona la sucursal, el reloj de origen y el archivo del programa anterior. Primero revisa las coincidencias; las checadas existentes conservan sus segundos y datos originales.</Typography>
      {[branches, devices].filter((query) => query.isError).map((query, index) => <Alert key={index} severity="error">{getApiErrorMessage(query.error)}</Alert>)}
      <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' } }}>
        <TextField select required label="Sucursal de origen" value={branchId} disabled={Boolean(busy)} onChange={(event) => { reset(); setBranchId(event.target.value); setDeviceId('') }}>
          {(branches.data ?? []).map((branch) => <MenuItem key={branch.id} value={branch.id}>{branch.name}</MenuItem>)}
        </TextField>
        <TextField select required label="Reloj de origen" value={deviceId} disabled={!branchId || Boolean(busy)} onChange={(event) => { reset(); setDeviceId(event.target.value) }}>
          {(devices.data ?? []).filter((device) => device.branchId === branchId).map((device) => <MenuItem key={device.id} value={device.id}>{device.name}</MenuItem>)}
        </TextField>
      </Box>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ alignItems: { sm: 'center' } }}>
        <Button component="label" variant="outlined" disabled={Boolean(busy)} startIcon={<UploadFileOutlinedIcon />}>
          Seleccionar archivo .txt<input type="file" accept=".txt,text/plain" aria-label="Archivo de checadas" hidden disabled={Boolean(busy)} onChange={(event) => { void selectFile(event.target.files?.[0]); event.target.value = '' }} />
        </Button>
        <Typography variant="body2" sx={{ overflowWrap: 'anywhere' }}>{file?.fileName ?? 'Ningún archivo seleccionado'}</Typography>
        <Button variant="contained" disabled={!input || Boolean(busy)} onClick={() => void review()}>{busy === 'preview' ? 'Revisando…' : 'Revisar archivo'}</Button>
      </Stack>
      <Typography variant="caption" color="text.secondary">Formato Talavie de 30 caracteres por registro. Fechas DD-MM-AA (2000–2099), horas locales HHmm, sin segundos. Máximo 1 MB y 10 000 líneas.</Typography>
      {error && <Alert severity="error">{error}</Alert>}
      {busy === 'preview' && <PageLoading />}
      {receipt && <Alert severity="success">{receipt.alreadyImported ? 'Este archivo ya estaba registrado. No se volvió a importar.' : `Archivo registrado: ${receipt.insertedCount} checadas nuevas y ${receipt.summary.existing} ya existentes.`} Referencia: {receipt.id}.</Alert>}
      {receipt && !receipt.recalculated && <Alert severity="warning" action={<Button color="inherit" disabled={Boolean(busy)} onClick={() => void retryCalculation()}>Reintentar cálculo</Button>}>
        Las checadas quedaron guardadas, pero no se pudo actualizar la asistencia. {receipt.recalculationError}
      </Alert>}
      {report && <>
        <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: 'wrap' }} aria-label="Resultado de revisión">
          <Chip label={`${report.summary.total} registros`} variant="outlined" />
          <Chip label={`${report.summary.new} ${receipt ? 'importadas' : 'nuevas'}`} color="success" variant="outlined" />
          <Chip label={`${report.summary.existing} ya existentes`} variant="outlined" />
          <Chip label={`${report.summary.duplicate} repetidas`} variant="outlined" />
          <Chip label={`${report.summary.invalid} inválidas`} color={report.summary.invalid ? 'warning' : 'default'} variant="outlined" />
          <Chip label={`${report.summary.ambiguous} por revisar`} color={report.summary.ambiguous ? 'warning' : 'default'} variant="outlined" />
        </Stack>
        {report.summary.unknownUsers > 0 && <Alert severity="info">{report.summary.unknownUsers} IDs no están asociados a este reloj. Se vincularán a una ficha compatible de la sucursal o quedarán pendientes de identificar.</Alert>}
        <Typography variant="caption" color="text.secondary">Zona horaria: {report.timeZone}. Las líneas inválidas, repetidas o ambiguas no crean checadas adicionales. Las letras B/E se conservan y no deciden entrada o salida.</Typography>
        <TableContainer tabIndex={0} role="region" aria-label="Vista previa desplazable de checadas">
          <Table size="small" aria-label="Vista previa de importación" sx={{ minWidth: 850 }}>
            <TableHead><TableRow>{['Línea', 'ID / empleado', 'Fecha', 'Hora local', 'Resultado', 'Detalle'].map((label) => <TableCell key={label}>{label}</TableCell>)}</TableRow></TableHead>
            <TableBody>{report.rows.slice((page - 1) * pageSize, page * pageSize).map((row) => <TableRow key={row.lineNumber}>
              <TableCell>{row.lineNumber}</TableCell><TableCell><Stack><span>{row.userId ?? '—'}</span><Typography variant="caption">{row.employeeName ?? (row.unknownUser ? 'Sin asociación en este reloj' : '—')}</Typography></Stack></TableCell>
              <TableCell sx={{ whiteSpace: 'nowrap' }}>{row.date ?? '—'}</TableCell><TableCell>{row.time ?? '—'}</TableCell>
              <TableCell><Chip size="small" variant="outlined" label={receipt && row.status === 'new' ? 'Importada' : labels[row.status]} color={row.status === 'new' ? 'success' : ['invalid', 'ambiguous'].includes(row.status) ? 'warning' : 'default'} /></TableCell>
              <TableCell><Stack spacing={0.5}><Typography variant="caption">{row.issue ?? row.matchingTimes?.join(', ') ?? 'Se conserva la línea original.'}</Typography><Typography component="code" variant="caption" sx={{ overflowWrap: 'anywhere' }}>{row.rawLine}</Typography></Stack></TableCell>
            </TableRow>)}</TableBody>
          </Table>
        </TableContainer>
        {report.rows.length > pageSize && <Pagination aria-label="Páginas de vista previa" page={page} count={Math.ceil(report.rows.length / pageSize)} onChange={(_, value) => setPage(value)} />}
      </>}
      <Button sx={{ alignSelf: 'flex-start' }} disabled={!deviceId || Boolean(busy)} onClick={() => setShowHistory((value) => !value)}>{showHistory ? 'Ocultar historial' : 'Ver últimas importaciones del reloj'}</Button>
      {showHistory && (history.isPending ? <PageLoading /> : history.isError ? <Alert severity="error">{getApiErrorMessage(history.error)}</Alert> : <Stack spacing={1} aria-label="Historial de importaciones">
        {!history.data?.length && <Typography variant="body2" color="text.secondary">Este reloj todavía no tiene archivos importados.</Typography>}
        {history.data?.map((item) => <Box key={item.id} sx={{ p: 1.5, border: 1, borderColor: 'divider' }}>
          <Typography variant="body2" sx={{ overflowWrap: 'anywhere' }}>{item.fileName}</Typography>
          <Typography variant="caption" color="text.secondary">{new Date(item.createdAt).toLocaleString('es-MX')} · {item.insertedCount} nuevas · {item.summary.existing} existentes · Referencia {item.id}</Typography>
        </Box>)}
      </Stack>)}
    </Stack></DialogContent>
    <DialogActions sx={{ p: 2 }}>
      <Button disabled={Boolean(busy)} onClick={onClose}>Cerrar</Button>
      {!receipt && <Button variant="contained" disabled={!canImport} onClick={() => void save()}>{busy === 'import' ? 'Importando…' : preview?.summary.new === 0 ? 'Registrar archivo sin duplicar' : 'Importar checadas'}</Button>}
    </DialogActions>
  </Dialog>
}
