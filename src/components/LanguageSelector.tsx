import { useEffect, useRef, useState } from 'react'
import { Earth } from 'lucide-react'
import { useI18n } from '../i18n/I18nProvider'
import { LANGUAGES, LANGUAGE_BY_CODE } from '../i18n/languages'
import { Flag } from './Flag'

export function LanguageSelector() {
  const { lang, setLang, t } = useI18n()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const active = LANGUAGE_BY_CODE[lang]

  useEffect(() => {
    if (!open) return
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('mousedown', onDoc)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDoc)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  return (
    <div className="relative" ref={ref} data-testid="language-selector">
      <button
        className="flex items-center gap-1.5 px-2 py-2 rounded-lg bg-white/5 hover:bg-white/15 text-white/50 hover:text-white/90 transition-colors"
        onClick={() => setOpen(o => !o)}
        title={`${t('language.label')}: ${active.endonym}`}
        aria-label={t('language.label')}
        data-testid="button-language"
      >
        <Earth size={21} />
        <Flag code={active.flag} className="w-5 h-[15px] rounded-sm object-cover" />
      </button>

      {open && (
        <div
          className="absolute right-0 mt-2 w-44 max-h-[60vh] overflow-y-auto custom-scrollbar bg-[#1a1a1a] rounded-xl py-1 shadow-xl ring-1 ring-white/10 z-50"
          data-testid="language-menu"
        >
          {LANGUAGES.filter(l => l.code !== lang).map(l => (
            <button
              key={l.code}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-left hover:bg-white/10 transition-colors"
              onClick={() => { setLang(l.code); setOpen(false) }}
              data-testid={`language-option-${l.code}`}
            >
              <Flag code={l.flag} className="w-5 h-[15px] rounded-sm object-cover shrink-0" />
              <span className="text-white/80 text-sm truncate">{l.endonym}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
