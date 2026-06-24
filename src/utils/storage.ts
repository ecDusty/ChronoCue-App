// Small, safe localStorage helpers (used for the selected language and the
// persisted session). Large media lives in IndexedDB — see utils/idb.ts.
import type { SessionState } from '../types'

export function readLocal<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    if (raw == null) return fallback
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

export function writeLocal<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // ignore (private mode / quota / unavailable)
  }
}

const SESSION_KEY = 'chronocue.session'
/** Bump to invalidate older persisted sessions when the shape changes. */
export const SESSION_VERSION = 1

export function loadSession(): SessionState | null {
  const s = readLocal<SessionState | null>(SESSION_KEY, null)
  if (!s || s.version !== SESSION_VERSION) return null
  return s
}

export function saveSession(session: SessionState): void {
  writeLocal(SESSION_KEY, session)
}

export function clearSession(): void {
  try {
    localStorage.removeItem(SESSION_KEY)
  } catch {
    // ignore
  }
}
