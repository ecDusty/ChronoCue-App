import type { TimerSize } from '../types'
import { TIMER_SIZES } from '../hooks/useSettings'

interface Props {
  value: TimerSize
  onChange: (size: TimerSize) => void
}

export function TimeSizeSelector({ value, onChange }: Props) {
  return (
    <div className="flex items-center gap-1 bg-white/5 rounded-xl p-1">
      {TIMER_SIZES.map(({ label, size }) => (
        <button
          key={size}
          className={`touch-button flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors text-center ${
            value === size ? 'bg-teal-500 text-white' : 'text-white/50 hover:text-white/80 hover:bg-white/10'
          }`}
          onClick={() => onChange(size)}
          data-testid={`button-size-${size}`}
        >
          {label}
        </button>
      ))}
    </div>
  )
}
