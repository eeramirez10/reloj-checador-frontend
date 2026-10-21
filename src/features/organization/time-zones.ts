export const defaultTimeZone = 'America/Mexico_City'

export const timeZoneOptions = [
  { value: 'America/Mexico_City', label: 'Ciudad de México / Querétaro' },
  { value: 'America/Cancun', label: 'Cancún / Quintana Roo' },
  { value: 'America/Merida', label: 'Mérida / Campeche' },
  { value: 'America/Monterrey', label: 'Monterrey' },
  { value: 'America/Chihuahua', label: 'Chihuahua' },
  { value: 'America/Ciudad_Juarez', label: 'Ciudad Juárez' },
  { value: 'America/Matamoros', label: 'Matamoros / Reynosa' },
  { value: 'America/Mazatlan', label: 'Mazatlán / La Paz' },
  { value: 'America/Hermosillo', label: 'Hermosillo / Sonora' },
  { value: 'America/Tijuana', label: 'Tijuana / Baja California' },
  { value: 'UTC', label: 'Tiempo universal' },
].filter((option) => {
  try { new Intl.DateTimeFormat('es-MX', { timeZone: option.value }); return true } catch { return false }
})

export function getTimeZoneLabel(timeZone: string, date = new Date()): string {
  const name = timeZoneOptions.find((option) => option.value === timeZone)?.label ?? timeZone
  const offset = new Intl.DateTimeFormat('es-MX', { timeZone, timeZoneName: 'longOffset' })
    .formatToParts(date).find((part) => part.type === 'timeZoneName')?.value.replace('GMT', 'UTC')
  return offset ? `${name} (${offset})` : name
}
