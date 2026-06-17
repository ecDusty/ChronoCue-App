import type { TimerSegment } from '../types'

export function parseSeconds(totalSeconds: number) {
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const secs = totalSeconds % 60
  return { hours, minutes, secs }
}

export function formatDuration(totalSeconds: number): string {
  const { hours, minutes, secs } = parseSeconds(totalSeconds)
  const parts: string[] = []
  if (hours > 0) parts.push(`${hours} h`)
  if (minutes > 0) parts.push(`${minutes} min`)
  if (secs > 0 || parts.length === 0) parts.push(`${secs} s`)
  return parts.join(' ')
}

export function buildSegments(totalSeconds: number): TimerSegment[] {
  const { hours, minutes, secs } = parseSeconds(totalSeconds)
  const segments: TimerSegment[] = []
  if (hours > 0) {
    segments.push({ value: String(hours), label: 'h', maxChars: String(hours).length })
  }
  segments.push({ value: String(minutes).padStart(2, '0'), label: 'm', maxChars: 2 })
  segments.push({ value: String(secs).padStart(2, '0'), label: 's', maxChars: 2 })
  return segments
}

export function getAddStep(remainingSeconds: number): number {
  if (remainingSeconds >= 3600 || remainingSeconds >= 1800) return 300
  if (remainingSeconds >= 600) return 60
  if (remainingSeconds >= 120) return 30
  if (remainingSeconds >= 30) return 10
  return 5
}
