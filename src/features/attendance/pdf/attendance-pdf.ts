import { jsPDF } from 'jspdf'
import { autoTable, type Table } from 'jspdf-autotable'
import { attendanceObservations, attendanceStatusLabels, formatCardDate, formatCardWeekday, formatWorkedTime } from '../../employees/employee-attendance-format'
import type { EmployeeAttendanceCard, EmployeeAttendanceDay } from '../../employees/types/employee-attendance'
import { formatAttendanceTime } from '../../organization/attendance-labels'
import { registerAttendancePdfFonts } from './attendance-pdf-fonts'
import type { AttendancePdfFile, AttendancePdfSource, PdfExportOptions } from './attendance-pdf-types'

type PdfDocument = jsPDF & { lastAutoTable?: Table }
interface PageOwner { card: EmployeeAttendanceCard; headerBottom: number }
const margin = 12
const footerSpace = 18
const colors = { blue: '#152879', ink: '#262626', gray: '#687182', line: '#c8cdd5', pale: '#f4f6f9' }

function employeeReference(card: EmployeeAttendanceCard): string {
  return card.employee.employeeNumber || card.employee.clockRecords.find((record) => record.bindingStatus === 'active')?.userId || card.employee.id
}

function drawHeader(doc: PdfDocument, card: EmployeeAttendanceCard, source: AttendancePdfSource, owners: Map<number, PageOwner>): number {
  const page = doc.getCurrentPageInfo().pageNumber
  const existing = owners.get(page)
  if (existing) return existing.headerBottom
  const width = doc.internal.pageSize.getWidth()
  const contentWidth = width - margin * 2
  doc.setFont('PublicSans','bold').setFontSize(17).setTextColor(colors.blue)
  doc.text('Tarjeta de asistencia',width / 2,17,{ align: 'center' })
  doc.setFont('PublicSans','normal').setFontSize(9).setTextColor(colors.ink)
  doc.text(`Del ${formatCardDate(card.period.from)} al ${formatCardDate(card.period.to)}`,width / 2,23,{ align: 'center' })
  doc.setFontSize(7.5).setTextColor(colors.gray)
  const scope: string[] = doc.splitTextToSize(source.scopeLabel,contentWidth)
  doc.text(scope,width / 2,28,{ align: 'center' })
  let y = 28 + scope.length * 3.2
  doc.setDrawColor(colors.blue).setLineWidth(0.5).line(margin,y,width - margin,y)
  y += 5
  doc.setFont('PublicSans','bold').setFontSize(10).setTextColor(colors.ink)
  const name: string[] = doc.splitTextToSize(`${employeeReference(card)} — ${card.employee.name}`,contentWidth)
  doc.text(name,margin,y)
  y += name.length * 4.2 + 1
  doc.setFont('PublicSans','normal').setFontSize(7.5)
  const columnWidth = (contentWidth - 8) / 2
  const details = [
    [`Puesto: ${card.employee.position || 'No registrado'}`,`Sucursal actual: ${card.employee.branchName || 'Sin asignar'}`],
    [`RFC: ${card.employee.rfc || 'No registrado'}`,`NSS: ${card.employee.imss || 'No registrado'}`],
  ]
  for (const [left,right] of details) {
    const leftLines: string[] = doc.splitTextToSize(left,columnWidth)
    const rightLines: string[] = doc.splitTextToSize(right,columnWidth)
    doc.text(leftLines,margin,y)
    doc.text(rightLines,margin + columnWidth + 8,y)
    y += Math.max(leftLines.length,rightLines.length) * 3.2 + 1.2
  }
  const headerBottom = y + 2
  owners.set(page,{ card, headerBottom })
  return headerBottom
}

function observationText(day: EmployeeAttendanceDay): string {
  const notes = attendanceObservations(day)
  if (notes.length) return notes.join('\n')
  return day.status === 'no_records' ? 'No hay checadas para este día.' : day.status === 'complete' ? 'Sin observaciones' : '—'
}

function dayRow(day: EmployeeAttendanceDay, card: EmployeeAttendanceCard): string[] {
  const time = (value: string | null) => formatAttendanceTime(value ?? undefined,day.timeZone)
  const hours = day.scheduleSettings ? `${day.scheduleSettings.entryTime}–${day.scheduleSettings.exitTime}` : 'Sin horario'
  const branch = day.branchName && day.branchName !== card.employee.branchName ? `\n${day.branchName}` : ''
  return [formatCardDate(day.date),formatCardWeekday(day.date),hours + branch,time(day.entry),time(day.mealDeparture),
    `${time(day.mealReturn)}${day.mealMinutes !== null ? `\n${day.mealMinutes} min` : ''}`,time(day.exit),
    formatWorkedTime(day.workedMinutes),attendanceStatusLabels[day.status],observationText(day)]
}

function drawCard(doc: PdfDocument, card: EmployeeAttendanceCard, source: AttendancePdfSource, owners: Map<number, PageOwner>) {
  const top = drawHeader(doc,card,source,owners)
  const contentWidth = doc.internal.pageSize.getWidth() - margin * 2
  const repeatHeader = () => { drawHeader(doc,card,source,owners) }
  const { summary } = card
  autoTable(doc,{
    startY: top, margin: { top, bottom: footerSpace, left: margin, right: margin }, theme: 'plain',
    head: [['Fecha','Día','Jornada','Entrada','Salida\na comer','Regreso','Salida\nlaboral','Horas','Estado','Observaciones']],
    body: card.days.map((day) => dayRow(day,card)),
    foot: [[{ content: 'Total de horas calculables', colSpan: 7 },formatWorkedTime(summary.calculableDays ? summary.workedMinutes : null),
      { content: `${summary.calculableDays} de ${summary.recordedDays} días con registros`, colSpan: 2 }]],
    showHead: 'everyPage', showFoot: 'lastPage', rowPageBreak: 'avoid',
    styles: { font: 'PublicSans', fontSize: 7.2, cellPadding: 1.25, overflow: 'linebreak', textColor: colors.ink, lineColor: colors.line, lineWidth: { bottom: 0.15 }, valign: 'top' },
    headStyles: { fontStyle: 'bold', fillColor: colors.pale, lineWidth: { bottom: 0.4 }, lineColor: colors.blue },
    footStyles: { fontStyle: 'bold', fillColor: colors.pale },
    columnStyles: { 0: { cellWidth: 19 }, 1: { cellWidth: 9 }, 2: { cellWidth: 24 }, 3: { cellWidth: 13 },
      4: { cellWidth: 14 }, 5: { cellWidth: 14 }, 6: { cellWidth: 14 }, 7: { cellWidth: 13 }, 8: { cellWidth: 21 }, 9: { cellWidth: contentWidth - 141 } },
    didParseCell: ({ section, row, cell }) => {
      if (section === 'body' && card.days[row.index]?.status === 'day_off') cell.styles.fillColor = colors.pale
    },
    willDrawPage: repeatHeader,
  })
  autoTable(doc,{
    startY: (doc.lastAutoTable?.finalY ?? top) + 4,
    margin: { top, bottom: footerSpace, left: margin, right: margin }, theme: 'plain', pageBreak: 'avoid', rowPageBreak: 'avoid',
    head: [[{ content: 'Resumen del periodo', colSpan: 4 }]],
    body: [
      ['Jornadas completas',summary.completeDays,'Jornadas por revisar',summary.incompleteDays],
      ['Días sin registros',summary.daysWithoutRecords,'Días de descanso',summary.daysOff],
      ['Retardos de llegada',summary.arrivalTardies,'Retardos de comida',summary.mealTardies],
      ['Salidas anticipadas',summary.earlyExits,'Días con registros',summary.recordedDays],
    ],
    styles: { font: 'PublicSans', fontSize: 8, cellPadding: 1.4, textColor: colors.ink },
    headStyles: { fontStyle: 'bold', textColor: colors.blue, fillColor: false },
    columnStyles: { 0: { cellWidth: contentWidth * 0.38 }, 1: { cellWidth: contentWidth * 0.12, halign: 'right' },
      2: { cellWidth: contentWidth * 0.38 }, 3: { cellWidth: contentWidth * 0.12, halign: 'right' } },
    willDrawPage: repeatHeader,
  })
}

function drawFooters(doc: PdfDocument, source: AttendancePdfSource, owners: Map<number, PageOwner>, generatedAt: Date) {
  const count = doc.getNumberOfPages()
  const timestamp = new Intl.DateTimeFormat('es-MX',{ dateStyle: 'short', timeStyle: 'short', timeZone: source.timeZone }).format(generatedAt)
  for (let page = 1; page <= count; page += 1) {
    doc.setPage(page)
    const width = doc.internal.pageSize.getWidth()
    const height = doc.internal.pageSize.getHeight()
    doc.setDrawColor(colors.line).setLineWidth(0.2).line(margin,height - 14,width - margin,height - 14)
    doc.setFont('PublicSans','normal').setFontSize(7).setTextColor(colors.gray)
    doc.text(`Empleado ${employeeReference(owners.get(page)!.card)}`,margin,height - 10)
    doc.text(`Página ${page} de ${count}`,width - margin,height - 10,{ align: 'right' })
    doc.setFontSize(6.5)
    doc.text(`Generado: ${timestamp} (${source.timeZone}). Horas locales según cada jornada.`,margin,height - 6)
  }
}

export async function generateAttendancePdf(source: AttendancePdfSource, options: PdfExportOptions): Promise<jsPDF> {
  options.signal.throwIfAborted()
  if (!source.cards.length) throw new Error('No hay tarjetas para exportar con los filtros seleccionados.')
  const doc: PdfDocument = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'letter', compress: true, putOnlyUsedFonts: true })
  const generatedAt = source.generatedAt ? new Date(source.generatedAt) : new Date()
  doc.setProperties({ title: 'Tarjetas de asistencia', subject: source.scopeLabel, author: 'Reloj Checador', creator: 'Reloj Checador' })
  doc.setCreationDate(generatedAt)
  await registerAttendancePdfFonts(doc,options.signal)
  const owners = new Map<number, PageOwner>()
  options.onProgress({ completed: 0, total: source.cards.length })
  for (const [index,card] of source.cards.entries()) {
    options.signal.throwIfAborted()
    if (index > 0) doc.addPage()
    drawCard(doc,card,source,owners)
    options.onProgress({ completed: index + 1, total: source.cards.length })
    await new Promise<void>((resolve) => setTimeout(resolve,0))
  }
  options.signal.throwIfAborted()
  drawFooters(doc,source,owners,generatedAt)
  return doc
}

export async function exportAttendancePdf(source: AttendancePdfSource, filename: string, options: PdfExportOptions): Promise<AttendancePdfFile> {
  const doc = await generateAttendancePdf(source,options)
  options.signal.throwIfAborted()
  const blob = doc.output('blob')
  options.signal.throwIfAborted()
  return { blob, filename }
}

export function attendancePdfFilename(reference: string, from: string, to: string): string {
  const safeReference = reference.normalize('NFD').replace(/\p{Diacritic}/gu,'').replace(/[^a-zA-Z0-9_-]+/g,'-').replace(/^-+|-+$/g,'').slice(0,100)
  return `asistencia-${safeReference || 'reporte'}-${from}-${to}.pdf`
}
