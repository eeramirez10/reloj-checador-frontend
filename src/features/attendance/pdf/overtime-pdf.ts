import { jsPDF } from 'jspdf'
import { autoTable, type Table } from 'jspdf-autotable'
import { attendanceStatusLabels, formatCardDate, formatCardWeekday } from '../../employees/employee-attendance-format'
import { formatExactOvertime, formatOvertimeMargins, formatRouteDate } from '../overtime-format'
import type { EmployeeOvertimeReport, OvertimeReportExport } from '../types/overtime'
import { registerAttendancePdfFonts } from './attendance-pdf-fonts'
import type { AttendancePdfFile, PdfExportOptions } from './attendance-pdf-types'
import { reportPdfFilename } from './pdf-filename'

type PdfDocument = jsPDF & { lastAutoTable?: Table }
type OvertimeReportDay = EmployeeOvertimeReport['days'][number]
interface PageOwner { employee?: EmployeeOvertimeReport; headerBottom: number }
const margin = 12
const footerSpace = 18
const colors = { blue: '#152879', ink: '#262626', gray: '#687182', line: '#c8cdd5', pale: '#f4f6f9' }
const statusLabels = { calculated: 'Calculado', pending: 'Pendiente', no_records: 'Sin registros' }
const hours = (seconds: number | null) => seconds === null ? '—' : formatExactOvertime(seconds)
const employeeReference = (report: EmployeeOvertimeReport) => report.employee.employeeNumber || report.employee.id
const clockReference = (report: EmployeeOvertimeReport) => report.employee.clockRecords.find((record) => record.bindingStatus === 'active')?.userId || 'Sin asignar'

function drawHeader(doc: PdfDocument, source: OvertimeReportExport, owners: Map<number, PageOwner>, employee?: EmployeeOvertimeReport): number {
  const page = doc.getCurrentPageInfo().pageNumber
  const existing = owners.get(page)
  if (existing) return existing.headerBottom
  const width = doc.internal.pageSize.getWidth()
  const contentWidth = width - margin * 2
  doc.setFont('PublicSans', 'bold').setFontSize(17).setTextColor(colors.blue)
  doc.text('Reporte de horas extras', width / 2, 17, { align: 'center' })
  doc.setFont('PublicSans', 'normal').setFontSize(9).setTextColor(colors.ink)
  doc.text(`Del ${formatCardDate(source.period.from)} al ${formatCardDate(source.period.to)}`, width / 2, 23, { align: 'center' })
  doc.setFontSize(7.5).setTextColor(colors.gray)
  const employeeCount = `${source.totalEmployees} ${source.totalEmployees === 1 ? 'empleado' : 'empleados'} con extras habilitadas`
  const scope: string[] = doc.splitTextToSize(`${source.branch.name} · ${source.companyFilter?.name ?? 'Todas las empresas'} · Empleados ${source.employeeStatus === 'active' ? 'activos' : 'inactivos'} · ${employeeCount}`, contentWidth)
  doc.text(scope, width / 2, 28, { align: 'center' })
  let y = 28 + scope.length * 3.2
  doc.setDrawColor(colors.blue).setLineWidth(0.5).line(margin, y, width - margin, y)
  y += 5
  doc.setFont('PublicSans', 'bold').setFontSize(10).setTextColor(colors.ink)
  const name: string[] = doc.splitTextToSize(employee ? employee.employee.name : 'Resumen general del periodo', contentWidth)
  doc.text(name, margin, y)
  y += name.length * 4.2 + 1
  doc.setFont('PublicSans', 'normal').setFontSize(7.5)
  const details = employee
    ? `N.º empleado: ${employeeReference(employee)} · ID del reloj actual: ${clockReference(employee)} · Puesto: ${employee.employee.position || 'No registrado'} · Sucursal actual: ${employee.employee.branchName || 'Sin asignar'} · Empresa actual: ${employee.employee.companyName || 'Sin empresa'}`
    : `Zona de la sucursal: ${source.branch.timeZone}. Duraciones en horas:minutos:segundos, sin redondeos por día.`
  const lines: string[] = doc.splitTextToSize(details, contentWidth)
  doc.text(lines, margin, y)
  const headerBottom = y + lines.length * 3.2 + 3
  owners.set(page, { employee, headerBottom })
  return headerBottom
}

function drawSummary(doc: PdfDocument, source: OvertimeReportExport, owners: Map<number, PageOwner>) {
  const top = drawHeader(doc, source, owners)
  const width = doc.internal.pageSize.getWidth() - margin * 2
  const totals = source.totals
  autoTable(doc, {
    startY: top, margin: { top, bottom: footerSpace, left: margin, right: margin }, theme: 'plain', rowPageBreak: 'avoid', showFoot: 'lastPage',
    head: [['N.º empleado / ID reloj', 'Empleado', 'Extras brutas', 'Descanso diario', 'Descanso adicional', 'Extras netas', 'Días calculados', 'Días pendientes', 'Sin registros']],
    body: source.employees.map((report) => [
      `${employeeReference(report)}\nID: ${clockReference(report)}`, `${report.employee.name}\nEmpresa: ${report.employee.companyName || 'Sin empresa'}`,
      hours(report.totals.grossSeconds), hours(report.totals.dailyRestSeconds), hours(report.totals.additionalRestSeconds), hours(report.totals.netSeconds),
      report.totals.calculatedDays, report.totals.pendingDays, report.totals.noRecordDays,
    ]),
    foot: [[{ content: 'Total general · todos los empleados', colSpan: 2 }, hours(totals.grossSeconds), hours(totals.dailyRestSeconds),
      hours(totals.additionalRestSeconds), hours(totals.netSeconds), totals.calculatedDays, totals.pendingDays, totals.noRecordDays]],
    styles: { font: 'PublicSans', fontSize: 8, cellPadding: 1.7, textColor: colors.ink, lineColor: colors.line, lineWidth: { bottom: 0.15 }, overflow: 'linebreak', valign: 'top' },
    headStyles: { fontStyle: 'bold', fillColor: colors.pale, lineColor: colors.blue, lineWidth: { bottom: 0.4 } },
    footStyles: { fontStyle: 'bold', fillColor: colors.pale },
    columnStyles: { 0: { cellWidth: 28 }, 1: { cellWidth: width - 183 }, 2: { cellWidth: 24 }, 3: { cellWidth: 24 }, 4: { cellWidth: 24 },
      5: { cellWidth: 24, fontStyle: 'bold' }, 6: { cellWidth: 19 }, 7: { cellWidth: 19 }, 8: { cellWidth: 21 } },
    willDrawPage: () => { drawHeader(doc, source, owners) },
  })
  autoTable(doc, {
    startY: (doc.lastAutoTable?.finalY ?? top) + 5, margin: { top, bottom: footerSpace, left: margin, right: margin }, theme: 'plain', pageBreak: 'avoid',
    body: [[`Los totales suman solo los días calculados. Hay ${totals.pendingDays} días pendientes y ${totals.noRecordDays} sin registros; no se convierten en horas cero.`],
      ['Las extras usan la jornada y los márgenes de sucursal vigentes por fecha. Antes y después ya descuentan los márgenes, sin compensar retardos. Se excluyen comidas completas registradas y descansos configurados.'],
      ['La falta de marcas de comida no bloquea las extras cuando hay entrada y salida laboral válidas. Las rutas muestran sus tramos diarios y pueden continuar entre fechas.']],
    styles: { font: 'PublicSans', fontSize: 7.5, cellPadding: 1.2, textColor: colors.gray },
    willDrawPage: () => { drawHeader(doc, source, owners) },
  })
}

function localTime(value: string | null, zone: string): string {
  return value ? new Intl.DateTimeFormat('es-MX', { timeZone: zone, hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23' }).format(new Date(value)) : '—'
}

function dayNotes(day: OvertimeReportDay, source: OvertimeReportExport): string {
  const notes = [...day.issues]
  const margins = formatOvertimeMargins(day.overtime)
  if (margins) notes.push(margins)
  if (day.overtime.issue) notes.push(day.overtime.issue)
  if (day.status !== 'complete') notes.unshift(`Asistencia: ${attendanceStatusLabels[day.status]}.`)
  if (day.mealDeparture && day.mealReturn) notes.push(`Comida: ${localTime(day.mealDeparture, day.timeZone)}–${localTime(day.mealReturn, day.timeZone)}.`)
  for (const route of day.routes ?? []) notes.push(`Ruta: ${formatRouteDate(route.enteredAt, route.timeZone)} a ${formatRouteDate(route.exitedAt, route.timeZone)}. Tramo diario; no es una checada.`)
  if (day.branchName && day.branchName !== source.branch.name) notes.push(`Sucursal de la jornada: ${day.branchName}.`)
  if (day.timeZone !== source.branch.timeZone) notes.push(`Zona horaria: ${day.timeZone}.`)
  return [...new Set(notes)].join('\n') || 'Sin observaciones'
}

function drawEmployee(doc: PdfDocument, source: OvertimeReportExport, report: EmployeeOvertimeReport, owners: Map<number, PageOwner>) {
  const top = drawHeader(doc, source, owners, report)
  const width = doc.internal.pageSize.getWidth() - margin * 2
  const totals = report.totals
  const sum = (key: 'beforeSeconds' | 'afterSeconds' | 'dayOffSeconds') => report.days.reduce((total, day) => total + (day.overtime.status === 'calculated' ? day.overtime[key] ?? 0 : 0), 0)
  autoTable(doc, {
    startY: top, margin: { top, bottom: footerSpace, left: margin, right: margin }, theme: 'plain', rowPageBreak: 'avoid', showFoot: 'lastPage',
    head: [['Fecha', 'Día', 'Jornada de sucursal', 'Entrada', 'Salida', 'Antes', 'Después', 'Día de descanso', 'Extras brutas', 'Descanso diario', 'Descanso adicional', 'Extras netas', 'Estado extras', 'Observaciones']],
    body: report.days.map((day) => {
      const extra = day.overtime
      const schedule = extra.referenceEntryTime && extra.referenceExitTime ? `${extra.referenceEntryTime}–${extra.referenceExitTime}`
        : day.scheduleSettings ? `${day.scheduleSettings.entryTime}–${day.scheduleSettings.exitTime}` : 'Sin jornada'
      return [formatCardDate(day.date), formatCardWeekday(day.date), schedule, localTime(day.entry, day.timeZone), localTime(day.exit, day.timeZone),
        ...[extra.beforeSeconds, extra.afterSeconds, extra.dayOffSeconds, extra.grossSeconds, extra.dailyRestSeconds, extra.additionalRestSeconds, extra.netSeconds].map(hours),
        statusLabels[extra.status], dayNotes(day, source)]
    }),
    foot: [[{ content: 'Total del empleado', colSpan: 5 }, hours(sum('beforeSeconds')), hours(sum('afterSeconds')), hours(sum('dayOffSeconds')),
      hours(totals.grossSeconds), hours(totals.dailyRestSeconds), hours(totals.additionalRestSeconds), hours(totals.netSeconds),
      { content: `${totals.calculatedDays} calculados · ${totals.pendingDays} pendientes · ${totals.noRecordDays} sin registros`, colSpan: 2 }]],
    styles: { font: 'PublicSans', fontSize: 7, cellPadding: 1.25, textColor: colors.ink, lineColor: colors.line, lineWidth: { bottom: 0.15 }, overflow: 'linebreak', valign: 'top' },
    headStyles: { fontStyle: 'bold', fillColor: colors.pale, lineColor: colors.blue, lineWidth: { bottom: 0.4 } },
    footStyles: { fontStyle: 'bold', fillColor: colors.pale },
    columnStyles: { 0: { cellWidth: 19 }, 1: { cellWidth: 8 }, 2: { cellWidth: 20 }, 3: { cellWidth: 16 }, 4: { cellWidth: 16 },
      5: { cellWidth: 15 }, 6: { cellWidth: 15 }, 7: { cellWidth: 15 }, 8: { cellWidth: 15 }, 9: { cellWidth: 15 }, 10: { cellWidth: 15 },
      11: { cellWidth: 15, fontStyle: 'bold' }, 12: { cellWidth: 19 }, 13: { cellWidth: width - 203 } },
    didParseCell: ({ section, row, cell }) => { if (section === 'body' && report.days[row.index]?.status === 'day_off') cell.styles.fillColor = colors.pale },
    willDrawPage: () => { drawHeader(doc, source, owners, report) },
  })
}

function drawFooters(doc: PdfDocument, source: OvertimeReportExport, owners: Map<number, PageOwner>) {
  const count = doc.getNumberOfPages()
  const timestamp = new Intl.DateTimeFormat('es-MX', { dateStyle: 'short', timeStyle: 'short', timeZone: source.branch.timeZone }).format(new Date(source.generatedAt))
  for (let page = 1; page <= count; page++) {
    doc.setPage(page)
    const width = doc.internal.pageSize.getWidth(); const height = doc.internal.pageSize.getHeight()
    doc.setDrawColor(colors.line).setLineWidth(0.2).line(margin, height - 14, width - margin, height - 14)
    doc.setFont('PublicSans', 'normal').setFontSize(7).setTextColor(colors.gray)
    const owner = owners.get(page)?.employee
    doc.text(owner ? `Empleado ${employeeReference(owner)}` : 'Resumen general · todos los empleados', margin, height - 10)
    doc.text(`Página ${page} de ${count}`, width - margin, height - 10, { align: 'right' })
    doc.setFontSize(6.5)
    doc.text(`Generado: ${timestamp} (${source.branch.timeZone}). Duraciones HH:mm:ss. Horas locales según cada jornada.`, margin, height - 6)
  }
}

export async function generateOvertimePdf(source: OvertimeReportExport, options: PdfExportOptions): Promise<jsPDF> {
  options.signal.throwIfAborted()
  if (!source.employees.length) throw new Error('No hay empleados con horas extras para exportar con estos filtros.')
  const doc: PdfDocument = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'letter', compress: true, putOnlyUsedFonts: true })
  doc.setProperties({ title: 'Reporte de horas extras', subject: `${source.branch.name} · ${source.companyFilter?.name ?? 'Todas las empresas'} · ${source.period.from} a ${source.period.to}`, author: 'Reloj Checador', creator: 'Reloj Checador' })
  doc.setCreationDate(new Date(source.generatedAt))
  await registerAttendancePdfFonts(doc, options.signal)
  const owners = new Map<number, PageOwner>()
  options.onProgress({ completed: 0, total: source.employees.length })
  drawSummary(doc, source, owners)
  for (const [index, employee] of source.employees.entries()) {
    options.signal.throwIfAborted()
    doc.addPage()
    drawEmployee(doc, source, employee, owners)
    options.onProgress({ completed: index + 1, total: source.employees.length })
    await new Promise<void>((resolve) => setTimeout(resolve, 0))
  }
  options.signal.throwIfAborted()
  drawFooters(doc, source, owners)
  return doc
}

export async function exportOvertimePdf(source: OvertimeReportExport, options: PdfExportOptions): Promise<AttendancePdfFile> {
  const doc = await generateOvertimePdf(source, options)
  options.signal.throwIfAborted()
  const blob = doc.output('blob')
  options.signal.throwIfAborted()
  const status = source.employeeStatus === 'active' ? 'Activos' : 'Inactivos'
  return { blob, filename: reportPdfFilename('horas-extras', `${source.branch.name}-${source.companyFilter?.name ?? 'todas-empresas'}-${status}`, source.period.from, source.period.to) }
}
