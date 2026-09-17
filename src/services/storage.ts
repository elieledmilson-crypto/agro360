export function getStorageItem<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    if (raw === null) return fallback

    const parsed = JSON.parse(raw) as T

    if (Array.isArray(fallback) && !Array.isArray(parsed)) {
      localStorage.removeItem(key)
      return fallback
    }

    return parsed
  } catch {
    localStorage.removeItem(key)
    return fallback
  }
}

export function setStorageItem<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // Ignora erros de quota ou permissão.
  }
}

export function generateId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }

  return Date.now().toString(36) + Math.random().toString(36).substring(2, 10)
}