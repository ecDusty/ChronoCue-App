import { useT } from './I18nProvider'
import { parseSeconds } from '../utils/time'

/**
 * Localized version of formatDuration: same "h / min / s" layout, but the unit
 * words come from the active language. Digits stay Western numerals.
 */
export function useDurationFormat() {
  const t = useT()
  return (totalSeconds: number): string => {
    const { hours, minutes, secs } = parseSeconds(totalSeconds)
    const parts: string[] = []
    if (hours > 0) parts.push(`${hours} ${t('unit.h')}`)
    if (minutes > 0) parts.push(`${minutes} ${t('unit.min')}`)
    if (secs > 0 || parts.length === 0) parts.push(`${secs} ${t('unit.sec')}`)
    return parts.join(' ')
  }
}
