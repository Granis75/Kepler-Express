export function canUseStorage() {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined'
}

export function readStorage<T>(key: string, fallback: T): T {
  if (!canUseStorage()) {
    return fallback
  }

  try {
    const storedValue = window.localStorage.getItem(key)
    return storedValue ? (JSON.parse(storedValue) as T) : fallback
  } catch {
    return fallback
  }
}

export function writeStorage<T>(key: string, value: T) {
  if (!canUseStorage()) {
    return
  }

  window.localStorage.setItem(key, JSON.stringify(value))
}
