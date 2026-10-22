import { useEffect, useRef, useState } from 'react'
import { getApiErrorMessage } from '../../../shared/api/api-error'
import type { AttendancePdfFile, PdfExportOptions, PdfProgress, ReadyAttendancePdf } from './attendance-pdf-types'

function startDownload(file: ReadyAttendancePdf) {
  const link = document.createElement('a')
  link.href = file.url
  link.download = file.filename
  document.body.append(link)
  link.click()
  link.remove()
}

export function useAttendancePdfExport(scopeKey: string) {
  const active = useRef<{ scopeKey: string; controller: AbortController } | null>(null)
  const generated = useRef<{ scopeKey: string; file: ReadyAttendancePdf } | null>(null)
  const [state, setState] = useState<{ scopeKey: string; busy: boolean; error: string | null; progress: PdfProgress | null; file: ReadyAttendancePdf | null }>(
    { scopeKey, busy: false, error: null, progress: null, file: null })
  if (state.scopeKey !== scopeKey) setState({ scopeKey, busy: false, error: null, progress: null, file: null })
  useEffect(() => () => {
    if (active.current?.scopeKey === scopeKey) { active.current.controller.abort(); active.current = null }
    if (generated.current?.scopeKey === scopeKey) { URL.revokeObjectURL(generated.current.file.url); generated.current = null }
  },[scopeKey])

  function clearFile() {
    if (generated.current) URL.revokeObjectURL(generated.current.file.url)
    generated.current = null
  }

  function cancel() {
    active.current?.controller.abort()
    active.current = null
    clearFile()
    setState({ scopeKey, busy: false, error: null, progress: null, file: null })
  }

  async function run(task: (options: PdfExportOptions) => Promise<AttendancePdfFile>) {
    if (active.current?.scopeKey === scopeKey) return
    active.current?.controller.abort()
    clearFile()
    const controller = new AbortController()
    const job = { scopeKey, controller }
    active.current = job
    setState({ scopeKey, busy: true, error: null, progress: null, file: null })
    try {
      const result = await task({ signal: controller.signal, onProgress: (next) => {
        if (active.current === job) setState((current) => ({ ...current, progress: next }))
      } })
      controller.signal.throwIfAborted()
      if (active.current !== job) return
      if (!result.blob.size) throw new Error('El archivo PDF quedó vacío. Vuelve a exportarlo.')
      const file = { url: URL.createObjectURL(result.blob), filename: result.filename, size: result.blob.size }
      generated.current = { scopeKey, file }
      setState((current) => ({ ...current, file }))
      startDownload(file)
    } catch (cause) {
      if (!controller.signal.aborted && active.current === job) setState((current) => ({ ...current, error: getApiErrorMessage(cause) }))
    } finally {
      if (active.current === job) { active.current = null; setState((current) => ({ ...current, busy: false, progress: null })) }
    }
  }
  return { busy: state.scopeKey === scopeKey && state.busy, error: state.scopeKey === scopeKey ? state.error : null,
    progress: state.scopeKey === scopeKey ? state.progress : null, file: state.scopeKey === scopeKey ? state.file : null, cancel, run }
}
