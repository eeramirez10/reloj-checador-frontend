const passwordAlphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_'
const passwordLength = 16

export function generateTemporaryPassword(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(passwordLength))
  return Array.from(bytes, byte => passwordAlphabet[byte % passwordAlphabet.length]).join('')
}
