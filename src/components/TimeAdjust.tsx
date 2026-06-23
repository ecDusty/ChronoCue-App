import { Minus, Plus } from 'lucide-react'
import type { TimerStatus } from '../types'
import { getAddStep } from '../utils/time'
import { useDurationFormat } from '../i18n/useDurationFormat'

interface Props {
  remaining: number
  onAdd: (seconds: number) => void
  status: TimerStatus
}

export function TimeAdjust({ remaining, onAdd, status }: Props) {
  const fmt = useDurationFormat()
  const step = getAddStep(remaining)
  const label = fmt(step)

  return (
    <div className="flex items-center gap-2" data-testid="time-adjuster">
      <button
        className="touch-button flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 active:bg-white/25 transition-colors text-white/70 font-medium text-xs"
        onClick={() => onAdd(-step)}
        disabled={remaining <= 0 && status !== 'running'}
        data-testid="button-subtract-time"
      >
        <Minus size={12} />
        <span>{label}</span>
      </button>
      <button
        className="touch-button flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 active:bg-white/25 transition-colors text-white/70 font-medium text-xs"
        onClick={() => onAdd(step)}
        data-testid="button-add-time"
      >
        <Plus size={12} />
        <span>{label}</span>
      </button>
    </div>
  )
}
