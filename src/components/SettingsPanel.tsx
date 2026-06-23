import { useRef } from 'react'
import { X } from 'lucide-react'
import type { AppSettings, SoundClip } from '../types'
import { FONT_OPTIONS } from '../hooks/useSettings'
import { Toggle } from './Toggle'
import { TimeSizeSelector } from './TimeSizeSelector'
import { SoundSelector } from './SoundSelector'
import { useT } from '../i18n/I18nProvider'

interface Props {
  title?: string
  settings: AppSettings
  updateSetting: <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => void
  setBgImage: (file: File | null) => void
  sounds: SoundClip[]
  addSound: (file: File, onAdded?: (id: string) => void) => void
  removeSound: (id: string) => void
  onClose: () => void
}

export function SettingsPanel({ title, settings, updateSetting, setBgImage, sounds, addSound, removeSound, onClose }: Props) {
  const bgFileRef = useRef<HTMLInputElement>(null)
  const t = useT()

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
      data-testid="settings-panel"
    >
      <div className="w-full max-w-md bg-[#1a1a1a] rounded-t-2xl sm:rounded-2xl p-6 space-y-5 max-h-[80vh] overflow-y-auto custom-scrollbar">
        <div className="flex items-center justify-between">
          <h2 className="text-white text-lg font-semibold">{title ?? t('settings.title')}</h2>
          <button
            className="touch-button p-2 rounded-lg hover:bg-white/10 text-white/60 transition-colors"
            onClick={onClose}
            data-testid="button-close-settings"
          >
            <X size={20} />
          </button>
        </div>

        {/* Timer Size */}
        <div className="space-y-2">
          <label className="text-white/70 text-sm font-medium">{t('settings.timerSize')}</label>
          <TimeSizeSelector value={settings.timerSize} onChange={v => updateSetting('timerSize', v)} />
          <p className="text-white/30 text-xs">
            {settings.timerSize === 'small' && t('settings.size.small')}
            {settings.timerSize === 'medium' && t('settings.size.medium')}
            {settings.timerSize === 'large' && t('settings.size.large')}
            {settings.timerSize === 'xlarge' && t('settings.size.xlarge')}
          </p>
        </div>

        {/* Font Family */}
        <div className="space-y-2">
          <label className="text-white/70 text-sm font-medium">{t('settings.fontFamily')}</label>
          <select
            value={settings.fontFamily}
            onChange={e => updateSetting('fontFamily', e.target.value)}
            className="w-full px-3 py-2.5 rounded-lg bg-white/10 text-white text-sm outline-none focus:ring-2 focus:ring-white/20 appearance-none cursor-pointer"
            style={{ fontFamily: settings.fontFamily }}
            data-testid="select-font-family"
          >
            {FONT_OPTIONS.map(f => (
              <option key={f.label} value={f.value} style={{ fontFamily: f.value, backgroundColor: '#1a1a1a', color: '#fff' }}>
                {f.label === 'Default' ? t('settings.fontDefault') : f.label}
              </option>
            ))}
          </select>
        </div>

        {/* Background Color */}
        <div className="space-y-2">
          <label className="text-white/70 text-sm font-medium">{t('settings.bgColor')}</label>
          <div className="flex items-center gap-3">
            <input
              type="color"
              value={settings.bgColor}
              onChange={e => updateSetting('bgColor', e.target.value)}
              className="w-12 h-12 rounded-lg cursor-pointer border-2 border-white/10 bg-transparent"
              data-testid="input-bg-color"
            />
            <span className="text-white/50 text-sm font-mono">{settings.bgColor}</span>
          </div>
        </div>

        {/* Background Image */}
        <div className="space-y-2">
          <label className="text-white/70 text-sm font-medium">{t('settings.bgImage')}</label>
          <div className="flex items-center gap-3">
            <button
              className="touch-button px-4 py-2.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-sm font-medium transition-colors"
              onClick={() => bgFileRef.current?.click()}
              data-testid="button-upload-bg"
            >
              {settings.bgImage ? t('settings.changeImage') : t('settings.uploadImage')}
            </button>
            {settings.bgImage && (
              <button
                className="touch-button px-4 py-2.5 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-300 text-sm font-medium transition-colors"
                onClick={() => setBgImage(null)}
                data-testid="button-remove-bg"
              >
                {t('common.remove')}
              </button>
            )}
          </div>
          <input
            ref={bgFileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={e => {
              const file = e.target.files?.[0] ?? null
              setBgImage(file)
            }}
          />
        </div>

        {/* Font Color */}
        <div className="space-y-2">
          <label className="text-white/70 text-sm font-medium">{t('settings.fontColor')}</label>
          <div className="flex items-center gap-3">
            <input
              type="color"
              value={settings.fontColor}
              onChange={e => updateSetting('fontColor', e.target.value)}
              className="w-12 h-12 rounded-lg cursor-pointer border-2 border-white/10 bg-transparent"
              data-testid="input-font-color"
            />
            <span className="text-white/50 text-sm font-mono">{settings.fontColor}</span>
          </div>
        </div>

        {/* Gong Sound */}
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-white text-sm font-medium">{t('settings.gongSound')}</p>
            <p className="text-white/40 text-xs">{t('settings.gongSoundDesc')}</p>
          </div>
          <Toggle enabled={settings.playGong} onToggle={() => updateSetting('playGong', !settings.playGong)} testId="toggle-gong" />
        </div>

        {settings.playGong && (
          <div className="pl-2">
            <SoundSelector
              sounds={sounds}
              selectedId={settings.gongSoundId}
              onSelect={id => updateSetting('gongSoundId', id)}
              onUpload={file => addSound(file, id => updateSetting('gongSoundId', id))}
              onRemove={removeSound}
            />
          </div>
        )}

        {/* Fade Effect */}
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-white text-sm font-medium">{t('settings.fadeEffect')}</p>
            <p className="text-white/40 text-xs">{t('settings.fadeEffectDesc')}</p>
          </div>
          <Toggle enabled={settings.fadeEffect} onToggle={() => updateSetting('fadeEffect', !settings.fadeEffect)} testId="toggle-fade" />
        </div>

        {/* Over Time */}
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-white text-sm font-medium">{t('settings.overTime')}</p>
            <p className="text-white/40 text-xs">{t('settings.overTimeDesc')}</p>
          </div>
          <Toggle enabled={settings.showOvertime} onToggle={() => updateSetting('showOvertime', !settings.showOvertime)} testId="toggle-overtime" />
        </div>
      </div>
    </div>
  )
}
