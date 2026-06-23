import { useState } from 'react'
import { useT } from '../i18n/I18nProvider'

interface Props {
  onCancel: () => void
  onContinue: (dontShowAgain: boolean) => void
}

export function ModeSwitchModal({ onCancel, onContinue }: Props) {
  const [dontShow, setDontShow] = useState(false)
  const t = useT()

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={e => { if (e.target === e.currentTarget) onCancel() }}
      data-testid="mode-switch-modal"
    >
      <div className="bg-[#1a1a1a] rounded-2xl p-6 max-w-sm w-full mx-4 space-y-5">
        <div className="space-y-2">
          <h2 className="text-white text-lg font-semibold">{t('modeSwitch.title')}</h2>
          <p className="text-white/60 text-sm">
            {t('modeSwitch.body')}
          </p>
        </div>

        <label className="flex items-center gap-2.5 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={dontShow}
            onChange={e => setDontShow(e.target.checked)}
            className="w-4 h-4 accent-teal-500"
            data-testid="checkbox-dont-show-again"
          />
          <span className="text-white/70 text-sm">{t('modeSwitch.dontShowAgain')}</span>
        </label>

        <div className="flex items-center justify-end gap-2">
          <button
            className="touch-button px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-medium text-sm transition-colors"
            onClick={onCancel}
            data-testid="button-cancel-switch"
          >
            {t('modeSwitch.cancel')}
          </button>
          <button
            className="touch-button px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-semibold text-sm transition-colors"
            onClick={() => onContinue(dontShow)}
            data-testid="button-continue-switch"
          >
            {t('modeSwitch.continue')}
          </button>
        </div>
      </div>
    </div>
  )
}
