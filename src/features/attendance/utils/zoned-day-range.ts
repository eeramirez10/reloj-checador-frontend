function getPart(parts: Intl.DateTimeFormatPart[], type: Intl.DateTimeFormatPartTypes): number {
  const value = parts.find((part) => part.type === type)?.value
  if (!value) throw new Error(`No se pudo calcular el límite local de fecha (${type}).`)
  return Number(value)
}

function toUtcIso(localDate: string, hour: number, minute: number, second: number, millisecond: number, formatter: Intl.DateTimeFormat): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(localDate)
  if (!match) throw new Error('La fecha seleccionada no es válida.')

  const [, year, month, day] = match.map(Number)
  const localTimestamp = Date.UTC(year, month - 1, day, hour, minute, second, millisecond)
  let timestamp = localTimestamp

  for (let attempt = 0; attempt < 4; attempt += 1) {
    const date = new Date(timestamp)
    const parts = formatter.formatToParts(date)
    const representedAsUtc = Date.UTC(
      getPart(parts, 'year'),
      getPart(parts, 'month') - 1,
      getPart(parts, 'day'),
      getPart(parts, 'hour'),
      getPart(parts, 'minute'),
      getPart(parts, 'second'),
      date.getUTCMilliseconds(),
    )
    const adjustment = localTimestamp - representedAsUtc
    timestamp += adjustment
    if (adjustment === 0) break
  }

  return new Date(timestamp).toISOString()
}

export function getZonedDayRange(date: string, timeZone: string): { from: string; to: string } {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit',
    minute: '2-digit', second: '2-digit', hourCycle: 'h23',
  })
  return {
    from: toUtcIso(date, 0, 0, 0, 0, formatter),
    to: toUtcIso(date, 23, 59, 59, 999, formatter),
  }
}
