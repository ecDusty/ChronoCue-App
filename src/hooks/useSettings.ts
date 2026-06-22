import { useCallback, useState } from 'react'
import type { AppSettings, FontOption, SoundClip, TimerSize } from '../types'

/** Reserved id for the built-in synthesized gong (not a library clip). */
export const DEFAULT_GONG_ID = 'default'

export const FONT_OPTIONS: FontOption[] = [
  { label: 'Default', value: "'JetBrains Mono', monospace" },
  { label: 'Roboto Mono', value: "'Roboto Mono', monospace" },
  { label: 'Fira Mono', value: "'Fira Mono', monospace" },
  { label: 'Lato', value: "'Lato', sans-serif" },
  { label: 'Open Sans', value: "'Open Sans', sans-serif" },
  { label: 'Questrial', value: "'Questrial', sans-serif" },
]

export const TIMER_SIZES: { label: string; size: TimerSize }[] = [
  { label: 'S', size: 'small' },
  { label: 'M', size: 'medium' },
  { label: 'L', size: 'large' },
  { label: 'XL', size: 'xlarge' },
]

const DEFAULT_SETTINGS: AppSettings = {
  bgColor: '#0a0a0a',
  bgImage: null,
  fontColor: '#ffffff',
  playGong: true,
  gongSoundId: DEFAULT_GONG_ID,
  fadeEffect: true,
  timerSize: 'large',
  fontFamily: FONT_OPTIONS[0].value,
  showOvertime: true,
}

export interface UseSettingsReturn {
  settings: AppSettings
  updateSetting: <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => void
  setBgImage: (file: File | null) => void
}

/** Independent settings instance. Call once per mode (Simple / Agenda) for separate state. */
export function useSettings(): UseSettingsReturn {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS)

  const updateSetting = useCallback(<K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
    setSettings(prev => ({ ...prev, [key]: value }))
  }, [])

  const setBgImage = useCallback((file: File | null) => {
    if (!file) {
      setSettings(prev => ({ ...prev, bgImage: null }))
      return
    }
    const reader = new FileReader()
    reader.onload = e => {
      const dataUrl = e.target?.result as string
      setSettings(prev => ({ ...prev, bgImage: dataUrl }))
    }
    reader.readAsDataURL(file)
  }, [])

  return { settings, updateSetting, setBgImage }
}

export interface SoundLibrary {
  sounds: SoundClip[]
  /** Reads the file into a SoundClip and appends it; `onAdded` receives the new id. */
  addSound: (file: File, onAdded?: (id: string) => void) => void
  removeSound: (id: string) => void
}

/** Shared, mode-agnostic library of uploaded sounds reusable everywhere. */
export function useSoundLibrary(): SoundLibrary {
  const [sounds, setSounds] = useState<SoundClip[]>([])

  const addSound = useCallback((file: File, onAdded?: (id: string) => void) => {
    const reader = new FileReader()
    reader.onload = e => {
      const dataUrl = e.target?.result as string
      const clip = { id: crypto.randomUUID(), name: file.name, dataUrl }
      setSounds(prev => [...prev, clip])
      onAdded?.(clip.id)
    }
    reader.readAsDataURL(file)
  }, [])

  const removeSound = useCallback((id: string) => {
    setSounds(prev => prev.filter(s => s.id !== id))
  }, [])

  return { sounds, addSound, removeSound }
}
