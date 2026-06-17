export type TimerStatus = 'idle' | 'running' | 'paused' | 'ended'

export type TimerMode = 'simple' | 'agenda'

export type TimerSize = 'small' | 'medium' | 'large' | 'xlarge'

export type GongSource = 'default' | 'custom'

export interface AgendaItem {
  id: string
  name: string
  durationSeconds: number
}

export interface AppSettings {
  bgColor: string
  bgImage: string | null
  fontColor: string
  playGong: boolean
  gongSource: GongSource
  customGongDataUrl: string | null
  customGongFileName: string | null
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
