import type { AgendaItem } from '../types'
import { useT } from '../i18n/I18nProvider'
import { useDurationFormat } from '../i18n/useDurationFormat'

interface Props {
  items: AgendaItem[]
  currentIndex: number
  currentRemaining: number
}

export function AgendaProgress({ items, currentIndex, currentRemaining }: Props) {
  const t = useT()
  const fmt = useDurationFormat()
  if (items.length === 0) return null

  const current = items[currentIndex]
  const next = items[currentIndex + 1]

  return (
    <div className="w-full max-w-lg px-2 pt-2 pb-1" data-testid="agenda-progress">
      <div className="flex items-center justify-between mb-1">
        <span className="text-white/80 text-sm font-medium truncate pr-4">
          {current?.name || t('agendaProgress.itemFallback', { number: currentIndex + 1 })}
        </span>
        <span className="text-white/50 text-xs shrink-0">
          {currentIndex + 1} / {items.length}
        </span>
      </div>

      <div className="w-full bg-white/10 rounded-full h-1 mb-2">
        <div
          className="bg-teal-500 h-1 rounded-full transition-all duration-500"
          style={{
            width: current
              ? `${Math.max(0, (currentRemaining / current.durationSeconds) * 100)}%`
              : '0%',
          }}
        />
      </div>

      {next && (
        <p className="text-white/35 text-xs truncate">
          {t('agendaProgress.next', {
            name: next.name || t('agendaProgress.itemFallback', { number: currentIndex + 2 }),
            duration: fmt(next.durationSeconds),
          })}
        </p>
      )}
    </div>
  )
}
