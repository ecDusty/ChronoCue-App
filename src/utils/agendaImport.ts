import type { AgendaItem } from '../types'

/**
 * Parse a duration cell into seconds.
 * Accepts a bare number (minutes, e.g. 5 -> 300, 1.5 -> 90) or clock text
 * "mm:ss" / "h:mm:ss". Returns null if it cannot be parsed.
 */
export function parseDurationToSeconds(raw: unknown): number | null {
  if (raw == null) return null
  const s = String(raw).trim()
  if (!s) return null

  if (s.includes(':')) {
    const parts = s.split(':').map(p => Number(p.trim()))
    if (parts.length < 2 || parts.length > 3) return null
    if (parts.some(n => !Number.isFinite(n) || n < 0)) return null
    const [h, m, sec] = parts.length === 3 ? parts : [0, parts[0], parts[1]]
    return Math.round(h * 3600 + m * 60 + sec)
  }

  const n = Number(s)
  if (!Number.isFinite(n) || n < 0) return null
  return Math.round(n * 60) // bare number = minutes
}

/**
 * Read an agenda spreadsheet (.xlsx / .xls / .csv) into agenda items.
 * Layout: column A = item name, column B = duration. A header row (or any row
 * whose duration cell is not a valid duration) is skipped automatically.
 *
 * SheetJS is imported dynamically so it is code-split into a lazy chunk and
 * never weighs down the initial app load.
 */
export async function parseAgendaFile(file: File): Promise<AgendaItem[]> {
  const XLSX = await import('xlsx')
  const buf = await file.arrayBuffer()
  const wb = XLSX.read(new Uint8Array(buf), { type: 'array' })
  const sheet = wb.Sheets[wb.SheetNames[0]]
  if (!sheet) return []

  // raw:false yields formatted strings, so time-formatted cells arrive with
  // their colons intact and plain numbers arrive as their displayed text.
  const rows = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, raw: false, blankrows: false })

  const items: AgendaItem[] = []
  for (const row of rows) {
    if (!Array.isArray(row)) continue
    const name = String(row[0] ?? '').trim()
    const seconds = parseDurationToSeconds(row[1])
    if (!name || seconds == null || seconds <= 0) continue
    items.push({ id: crypto.randomUUID(), name, durationSeconds: seconds })
  }
  return items
}
