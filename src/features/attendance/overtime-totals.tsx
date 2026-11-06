import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import type { OvertimeTotals as Totals } from './types/overtime'
import { formatExactOvertime, formatOvertime } from './overtime-format'

export default function OvertimeTotals({ totals, label }: { totals: Totals; label: string }) {
  const figures = [['Extras brutas', totals.grossSeconds], ['Descanso diario', totals.dailyRestSeconds],
    ['Descanso adicional', totals.additionalRestSeconds], ['Extras netas', totals.netSeconds]] as const
  return <Box aria-label={label} sx={{ p: 2, bgcolor: 'background.default', borderTop: 1, borderColor: 'divider' }}>
    <Typography variant="body2" sx={{ fontWeight: 600 }}>{label}</Typography>
    <Box component="dl" sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr 1fr', md: 'repeat(4, 1fr)' }, gap: 2, my: 1.5,
      '& dt': { fontSize: '0.75rem', color: 'text.secondary' }, '& dd': { m: 0, fontSize: '1.25rem', fontWeight: 600, fontVariantNumeric: 'tabular-nums' } }}>
      {figures.map(([title, value]) => <div key={title}><dt>{title}</dt><dd title={formatExactOvertime(totals.calculatedDays ? value : null)}>{formatOvertime(totals.calculatedDays ? value : null)}</dd></div>)}
    </Box>
    <Typography variant="caption" color={totals.pendingDays ? 'warning.dark' : 'text.secondary'}>
      {totals.calculatedDays} días calculados · {totals.pendingDays} pendientes · {totals.noRecordDays} sin registros. Los pendientes no se incluyen en los totales.
    </Typography>
  </Box>
}
