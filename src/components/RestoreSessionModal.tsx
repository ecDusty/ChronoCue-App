import { useT } from '../i18n/I18nProvider'

interface Props {
  onContinue: () => void
  onStartFresh: () => void
}

// Shown once on load when a saved session exists. No backdrop dismissal —
// the user must choose Continue or Start fresh.
export function RestoreSessionModal({ onContinue, onStartFresh }: Props) {
  const t = useT()
  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm"
      data-testid="restore-session-modal"
    >
      <div className="bg-[#1a1a1a] rounded-2xl p-6 max-w-sm w-full mx-4 space-y-5">
        <div className="space-y-2">
          <h2 className="text-white text-lg font-semibold">{t('restore.title')}</h2>
          <p className="text-white/60 text-sm">{t('restore.body')}</p>
        </div>

        <div className="flex items-center justify-end gap-2">
          <button
            className="touch-button px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-medium text-sm transition-colors"
            onClick={onStartFresh}
            data-testid="button-start-fresh"
          >
            {t('restore.startFresh')}
          </button>
          <button
            className="touch-button px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-semibold text-sm transition-colors"
            onClick={onContinue}
            data-testid="button-continue-session"
          >
            {t('restore.continue')}
          </button>
        </div>
      </div>
    </div>
  )
}
