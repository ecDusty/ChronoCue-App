import type { TimerStatus, TimerSize } from '../types'
import { buildSegments } from '../utils/time'

const SIZE_MAP: Record<TimerSize, { digit: string; colon: string }> = {
  small:  { digit: 'min(13vw, 16vh)', colon: 'min(7vw, 9vh)' },
  medium: { digit: 'min(18vw, 22vh)', colon: 'min(10vw, 13vh)' },
  large:  { digit: 'min(22vw, 28vh)', colon: 'min(13vw, 16vh)' },
  xlarge: { digit: 'min(28vw, 34vh)', colon: 'min(16vw, 20vh)' },
}

const SIZE_MAP_TWO: Record<TimerSize, { digit: string; colon: string }> = {
  small:  { digit: 'min(20vw, 22vh)', colon: 'min(11vw, 12vh)' },
  medium: { digit: 'min(28vw, 32vh)', colon: 'min(16vw, 18vh)' },
  large:  { digit: 'min(36vw, 40vh)', colon: 'min(20vw, 22vh)' },
  xlarge: { digit: 'min(44vw, 48vh)', colon: 'min(24vw, 26vh)' },
}

interface Props {
  seconds: number
  fontColor: string
  status: TimerStatus
  fadeEffect: boolean
  timerSize: TimerSize
  fontFamily: string
  overtimeSeconds: number
  showOvertime: boolean
  onSegmentClick: (label: string) => void
}

export function TimerDisplay({
  seconds,
  fontColor,
  status,
  fadeEffect,
  timerSize,
  fontFamily,
  overtimeSeconds,
  showOvertime,
  onSegmentClick,
}: Props) {
  const isEnded = status === 'ended'
  const shouldPulse = isEnded && fadeEffect
  const showOvertimeDisplay = isEnded && showOvertime && overtimeSeconds >= 5

  const segments = buildSegments(seconds)
  const sizeMap = segments.length >= 3 ? SIZE_MAP[timerSize] : SIZE_MAP_TWO[timerSize]
  const overtimeSegments = showOvertimeDisplay ? buildSegments(overtimeSeconds) : []

  return (
    <div className="relative flex flex-col items-center">
      <div
        className={`timer-display flex items-center justify-center select-none${shouldPulse ? ' animate-fade-pulse' : ''}`}
        style={{ color: fontColor, fontFamily }}
        data-testid="timer-display"
      >
        {segments.map((seg, i) => (
          <span key={seg.label} className="flex items-center">
            {i > 0 && (
              <span
                className="opacity-30 font-light mx-[0.5vw] inline-flex items-center justify-center"
                style={{ fontSize: sizeMap.colon, lineHeight: 1, height: '0.75em', overflow: 'hidden' }}
              >
                :
              </span>
            )}
            <span
              className="font-bold cursor-pointer hover:opacity-80 transition-opacity inline-flex justify-center items-center"
              style={{
                fontSize: sizeMap.digit,
                lineHeight: 1,
                width: `${seg.maxChars * 0.65}em`,
                height: '0.75em',
                overflow: 'hidden',
                textAlign: 'center',
              }}
              onClick={e => { e.stopPropagation(); onSegmentClick(seg.label) }}
              data-testid={`timer-segment-${seg.label}`}
            >
              {seg.value}
            </span>
          </span>
        ))}
      </div>

      {showOvertimeDisplay && (
        <div className="absolute top-full left-0 right-0 mt-[2vh] flex justify-center">
        <div
          className="flex items-center justify-center select-none animate-fade-in whitespace-nowrap"
          style={{ color: '#f87171', fontFamily }}
          data-testid="overtime-display"
        >
          <span
            className="font-bold opacity-90 mr-[0.3vw]"
            style={{ fontSize: 'min(5vw, 6vh)', lineHeight: 1 }}
            data-testid="overtime-minus"
          >
            −
          </span>
          {overtimeSegments.map((seg, i) => (
            <span key={seg.label} className="flex items-center">
              {i > 0 && (
                <span
                  className="opacity-30 font-light mx-[0.3vw]"
                  style={{ fontSize: 'min(3vw, 3.5vh)', lineHeight: 1 }}
                >
                  :
                </span>
              )}
              <span
                className="font-bold inline-flex justify-center"
                style={{
                  fontSize: 'min(5vw, 6vh)',
                  lineHeight: 1,
                  width: `${seg.value.length * 0.65}em`,
                  textAlign: 'center',
                }}
              >
                {seg.value}
              </span>
            </span>
          ))}
        </div>
        </div>
      )}
    </div>
  )
}
