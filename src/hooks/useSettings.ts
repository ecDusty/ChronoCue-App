import { useCallback, useState } from 'react'
import type { AppSettings, FontOption, TimerSize } from '../types'

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
  gongSource: 'default',
  customGongDataUrl: null,
  customGongFileName: null,
  fadeEffect: true,
  timerSize: 'large',
  fontFamily: FONT_OPTIONS[0].value,
  showOvertime: true,
}

export interface UseSettingsReturn {
  settings: AppSettings
  updateSetting: <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => void
  setBgImage: (file: File | null) => void
  setCustomGong: (file: File | null) => void
}

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

  const setCustomGong = useCallback((file: File | null) => {
    if (!file) {
      setSettings(prev => ({ ...prev, customGongDataUrl: null, customGongFileName: null }))
      return
    }
    const reader = new FileReader()
    reader.onload = e => {
      const dataUrl = e.target?.result as string
      setSettings(prev => ({ ...prev, customGongDataUrl: dataUrl, customGongFileName: file.name }))
    }
    reader.readAsDataURL(file)
  }, [])

  return { settings, updateSetting, setBgImage, setCustomGong }
}
