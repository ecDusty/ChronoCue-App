export type TimerStatus = 'idle' | 'running' | 'paused' | 'ended'

export type TimerMode = 'simple' | 'agenda'

export type TimerSize = 'small' | 'medium' | 'large' | 'xlarge'

export interface SoundClip {
  id: string
  name: string
  dataUrl: string
}

/** Per-item overrides; an undefined field means "inherit the global setting". */
export interface AgendaItemOverrides {
  showOvertime?: boolean
  fadeEffect?: boolean
  playGong?: boolean
  gongSoundId?: string
}

export interface AgendaItem {
  id: string
  name: string
  durationSeconds: number
  overrides?: AgendaItemOverrides
}

export interface AppSettings {
  bgColor: string
  bgImage: string | null
  fontColor: string
  playGong: boolean
  gongSoundId: string
  fadeEffect: boolean
  timerSize: TimerSize
  fontFamily: string
  showOvertime: boolean
}

export interface TimerSegment {
  value: string
  label: string
  maxChars: number
}

/** Serializable timer state for persistence. Absolute timestamps let a running
 *  timer resume accurately across a refresh. */
export interface TimerSnapshot {
  status: TimerStatus
  totalSeconds: number
  initialSeconds: number
  remainingMs: number
  targetTs: number
  overtimeStartTs: number
}

/** The full persisted session (lightweight; media lives in IndexedDB). */
export interface SessionState {
  version: number
  /** Whether any media (uploaded sound or background image) exists — gates IndexedDB. */
  hasMedia: boolean
  mode: TimerMode
  suppressSwitchWarning: boolean
  agendaItems: AgendaItem[]
  agendaIndex: number
  agendaStarted: boolean
  agendaRemaining: Record<string, number>
  simpleSettings: AppSettings
  agendaSettings: AppSettings
  simpleTimer: TimerSnapshot
  agendaTimer: TimerSnapshot
}

export interface FontOption {
  label: string
  value: string
}
