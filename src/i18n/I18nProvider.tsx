import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { en } from './en'
import type { LanguageCode, TranslationKey, Translations } from './types'
import { DEFAULT_LANGUAGE } from './languages'
import { readLocal, writeLocal } from '../utils/storage'

const STORAGE_KEY = 'chronocue.lang'

type TParams = Record<string, string | number>

interface I18nContextValue {
  lang: LanguageCode
  setLang: (code: LanguageCode) => void
  t: (key: TranslationKey, params?: TParams) => string
}

const I18nContext = createContext<I18nContextValue | null>(null)

// Each non-English pack is its own dynamic import, so Vite code-splits it into a
// separate chunk that is fetched only when that language is selected.
const PACK_LOADERS: Record<Exclude<LanguageCode, 'en'>, () => Promise<{ default: Translations }>> = {
  'zh-CN': () => import('./packs/zh-CN'),
  'zh-HK': () => import('./packs/zh-HK'),
  es: () => import('./packs/es'),
  fr: () => import('./packs/fr'),
  ja: () => import('./packs/ja'),
  ko: () => import('./packs/ko'),
  tl: () => import('./packs/tl'),
  vi: () => import('./packs/vi'),
  it: () => import('./packs/it'),
  th: () => import('./packs/th'),
  de: () => import('./packs/de'),
  pt: () => import('./packs/pt'),
  mi: () => import('./packs/mi'),
  ms: () => import('./packs/ms'),
  hi: () => import('./packs/hi'),
  ru: () => import('./packs/ru'),
}

function interpolate(template: string, params?: TParams): string {
  if (!params) return template
  return template.replace(/\{(\w+)\}/g, (_, k) => (k in params ? String(params[k]) : `{${k}}`))
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<LanguageCode>(() => readLocal<LanguageCode>(STORAGE_KEY, DEFAULT_LANGUAGE))
  const [translations, setTranslations] = useState<Translations>(en)

  // Load the active language's pack (English is bundled, so skip it).
  useEffect(() => {
    let cancelled = false
    if (lang === 'en') { setTranslations(en); return }
    const loader = PACK_LOADERS[lang]
    if (!loader) { setTranslations(en); return }
    loader()
      .then(mod => { if (!cancelled) setTranslations(mod.default) })
      .catch(() => { if (!cancelled) setTranslations(en) })
    return () => { cancelled = true }
  }, [lang])

  const setLang = useCallback((code: LanguageCode) => {
    setLangState(code)
    writeLocal(STORAGE_KEY, code)
  }, [])

  const t = useCallback(
    (key: TranslationKey, params?: TParams) => interpolate(translations[key] ?? en[key] ?? key, params),
    [translations],
  )

  return <I18nContext.Provider value={{ lang, setLang, t }}>{children}</I18nContext.Provider>
}

export function useI18n(): I18nContextValue {
  const ctx = useContext(I18nContext)
  if (!ctx) throw new Error('useI18n must be used within I18nProvider')
  return ctx
}

export function useT() {
  return useI18n().t
}
