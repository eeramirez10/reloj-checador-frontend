export function reportPdfFilename(prefix: string, reference: string, from: string, to: string): string {
  const safeReference = reference.normalize('NFD').replace(/\p{Diacritic}/gu, '').replace(/[^a-zA-Z0-9_-]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 100)
  return `${prefix}-${safeReference || 'reporte'}-${from}-${to}.pdf`
}
