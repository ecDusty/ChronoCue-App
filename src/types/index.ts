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

export interface FontOption {
  label: string
  value: string
}
