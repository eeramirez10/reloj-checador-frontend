export interface AttendanceFileInput { branchId: string; deviceId: string; fileName: string; content: string }
export type FileRowStatus = 'new' | 'existing' | 'duplicate' | 'invalid' | 'ambiguous'
export interface AttendanceFileRow {
  lineNumber: number; rawLine: string; userId?: string; date?: string; time?: string; marker?: string;
  status: FileRowStatus; employeeName?: string; unknownUser?: boolean; matchingTimes?: string[]; issue?: string
}
export interface AttendanceFileSummary {
  total: number; new: number; existing: number; duplicate: number; invalid: number; ambiguous: number; unknownUsers: number
}
export interface AttendanceFilePreview {
  deviceId: string; branchId: string; fileName: string; timeZone: string; token: string;
  rows: AttendanceFileRow[]; summary: AttendanceFileSummary
}
export interface AttendanceFileResult extends AttendanceFilePreview {
  id: string; createdAt: string; insertedCount: number; alreadyImported: boolean;
  recalculated: boolean; recalculationError?: string
}
export type AttendanceFileHistoryEntry = Pick<AttendanceFileResult, 'id' | 'fileName' | 'createdAt' | 'insertedCount' | 'summary'>
