import type { jsPDF } from 'jspdf'
import regularUrl from '@expo-google-fonts/public-sans/400Regular/PublicSans_400Regular.ttf?url'
import boldUrl from '@expo-google-fonts/public-sans/700Bold/PublicSans_700Bold.ttf?url'

async function loadFont(url: string, signal: AbortSignal): Promise<string> {
  const response = await fetch(url, { signal })
  if (!response.ok) throw new Error('No se pudo cargar la fuente del PDF. Vuelve a intentar.')
  const bytes = new Uint8Array(await response.arrayBuffer())
  let binary = ''
  for (let offset = 0; offset < bytes.length; offset += 8192) binary += String.fromCharCode(...bytes.subarray(offset, offset + 8192))
  return btoa(binary)
}

export async function registerAttendancePdfFonts(doc: jsPDF, signal: AbortSignal) {
  const [regular,bold] = await Promise.all([loadFont(regularUrl,signal),loadFont(boldUrl,signal)])
  signal.throwIfAborted()
  doc.addFileToVFS('PublicSans-Regular.ttf',regular)
  doc.addFont('PublicSans-Regular.ttf','PublicSans','normal')
  doc.addFileToVFS('PublicSans-Bold.ttf',bold)
  doc.addFont('PublicSans-Bold.ttf','PublicSans','bold')
  doc.setFont('PublicSans','normal')
}
