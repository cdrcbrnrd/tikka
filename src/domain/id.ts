// crypto.randomUUID is missing when the dev server is reached over plain http from the phone
export function newId(): string {
  if (typeof crypto.randomUUID === 'function') return crypto.randomUUID()
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
}
