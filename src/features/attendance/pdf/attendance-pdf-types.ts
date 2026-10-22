import type { EmployeeAttendanceCard } from '../../employees/types/employee-attendance'

export interface PdfProgress { completed: number; total: number }
export interface AttendancePdfFile { blob: Blob; filename: string }
export interface ReadyAttendancePdf { url: string; filename: string; size: number }
export interface PdfExportOptions {
  signal: AbortSignal
  onProgress: (progress: PdfProgress) => void
}
export interface AttendancePdfSource {
  cards: EmployeeAttendanceCard[]
  scopeLabel: string
  timeZone: string
  generatedAt?: string
}
