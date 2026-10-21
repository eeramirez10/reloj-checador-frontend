export interface PersonalProfileValues {
  firstName: string
  lastName: string
  rfc: string
  socialSecurityNumber: string
}

export function getPersonalProfileChanges(values: PersonalProfileValues, initial: PersonalProfileValues): Record<string, string | null> {
  return Object.fromEntries((Object.keys(values) as Array<keyof PersonalProfileValues>)
    .filter((key) => values[key] !== initial[key]).map((key) => [key, values[key].trim() || null]))
}
