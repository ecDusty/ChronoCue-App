import { useEffect, useRef, useState } from 'react'

const PRESETS = [
  { label: '1 min',  seconds: 60 },
  { label: '2 min',  seconds: 120 },
  { label: '5 min',  seconds: 300 },
  { label: '10 min', seconds: 600 },
  { label: '15 min', seconds: 900 },
  { label: '20 min', seconds: 1200 },
  { label: '30 min', seconds: 1800 },
  { label: '45 min', seconds: 2700 },
  { label: '1 hour', seconds: 3600 },
]

const INPUT_CLASS =
  'w-20 px-3 py-2.5 rounded-lg bg-white/15 border border-white/25 text-white text-center text-base placeholder:text-white/40 outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500/50 transition-colors'

interface InitialValues {
  hours: number
  minutes: number
  seconds: number
}

interface Props {
  onSet: (seconds: number) => void
  initialValues?: InitialValues
  initialFocus?: 'h' | 'm' | 's'
}

export function TimeInput({ onSet, initialValues, initialFocus }: Props) {
  const [hours, setHours] = useState(initialValues && initialValues.hours > 0 ? String(initialValues.hours) : '')
  const [minutes, setMinutes] = useState(initialValues ? String(initialValues.minutes) : '')
  const [seconds, setSeconds] = useState(initialValues ? String(initialValues.seconds) : '')

  const hoursRef = useRef<HTMLInputElement>(null)
  const minutesRef = useRef<HTMLInputElement>(null)
  const secondsRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const t = setTimeout(() => {
      if (initialFocus === 'h') { hoursRef.current?.focus(); hoursRef.current?.select() }
      else if (initialFocus === 'm') { minutesRef.current?.focus(); minutesRef.current?.select() }
      else if (initialFocus === 's') { secondsRef.current?.focus(); secondsRef.current?.select() }
    }, 50)
    return () => clearTimeout(t)
  }, [initialFocus])

  const handleSet = () => {
    const total = (parseInt(hours) || 0) * 3600 + (parseInt(minutes) || 0) * 60 + (parseInt(seconds) || 0)
    if (total > 0) onSet(total)
  }

  return (
    <div className="flex flex-col items-center gap-4" data-testid="time-picker">
      <p className="text-white/60 text-sm font-medium uppercase tracking-wider">Set Timer</p>

      <div className="flex flex-wrap justify-center gap-2 max-w-lg">
        {PRESETS.map(p => (
          <button
            key={p.label}
            className="touch-button px-5 py-3 rounded-xl bg-white/10 hover:bg-white/20 active:bg-white/25 transition-colors text-white font-medium text-base"
            onClick={() => onSet(p.seconds)}
            data-testid={`button-preset-${p.seconds}`}
          >
            {p.label}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-2 mt-2">
        <input
          ref={hoursRef}
          type="number"
          placeholder="Hr"
          min={0}
          max={99}
          value={hours}
          onChange={e => setHours(e.target.value)}
          className={INPUT_CLASS}
          data-testid="input-custom-hours"
        />
        <span className="text-white/40 font-bold">:</span>
        <input
          ref={minutesRef}
          type="number"
          placeholder="Min"
          min={0}
          max={59}
          value={minutes}
          onChange={e => setMinutes(e.target.value)}
          className={INPUT_CLASS}
          data-testid="input-custom-minutes"
        />
        <span className="text-white/40 font-bold">:</span>
        <input
          ref={secondsRef}
          type="number"
          placeholder="Sec"
          min={0}
          max={59}
          value={seconds}
          onChange={e => setSeconds(e.target.value)}
          className={INPUT_CLASS}
          data-testid="input-custom-seconds"
        />
        <button
          className="touch-button px-5 py-2.5 rounded-lg bg-teal-600 hover:bg-teal-500 active:bg-teal-400 text-white font-medium text-base transition-colors"
          onClick={handleSet}
          data-testid="button-custom-set"
        >
          Set
        </button>
      </div>
    </div>
  )
}
