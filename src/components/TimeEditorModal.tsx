import { X } from 'lucide-react'
import { TimeInput } from './TimeInput'
import { parseSeconds } from '../utils/time'

interface Props {
  onSet: (seconds: number) => void
  onClose: () => void
  initialSeconds: number
  initialFocus: 'h' | 'm' | 's'
}

export function TimeEditorModal({ onSet, onClose, initialSeconds, initialFocus }: Props) {
  const { hours, minutes, secs } = parseSeconds(initialSeconds)

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
      data-testid="set-timer-overlay"
    >
      <div className="bg-[#1a1a1a] rounded-2xl p-6 max-w-lg w-full mx-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-white text-lg font-semibold">Set Timer</h2>
          <button
            className="touch-button p-2 rounded-lg hover:bg-white/10 text-white/60 transition-colors"
            onClick={onClose}
            data-testid="button-close-set-timer"
          >
            <X size={20} />
          </button>
        </div>
        <TimeInput
          onSet={s => { onSet(s); onClose() }}
          initialValues={{ hours, minutes, seconds: secs }}
          initialFocus={initialFocus}
        />
      </div>
    </div>
  )
}
