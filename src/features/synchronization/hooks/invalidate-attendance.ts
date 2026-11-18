import type { QueryClient } from '@tanstack/react-query'

export async function invalidateAttendance(queryClient: QueryClient) {
  await Promise.all(['attendance', 'sync-runs', 'daily-attendance', 'employees', 'employee-history', 'device-users',
    'employee-attendance', 'deductions', 'overtime-report', 'branch-attendance-cards', 'my-attendance']
    .map(key => queryClient.invalidateQueries({ queryKey: [key] })))
}
