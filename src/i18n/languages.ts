import type { LanguageCode, LanguageMeta } from './types'

export const DEFAULT_LANGUAGE: LanguageCode = 'en'

/** Display order for the selector. English is the default/source language. */
export const LANGUAGES: LanguageMeta[] = [
  { code: 'en',    endonym: 'English',       flag: 'gb' },
  { code: 'zh-CN', endonym: '简体中文',        flag: 'cn' },
  { code: 'zh-HK', endonym: '繁體中文',        flag: 'hk' },
  { code: 'es',    endonym: 'Español',       flag: 'es' },
  { code: 'fr',    endonym: 'Français',      flag: 'fr' },
  { code: 'ja',    endonym: '日本語',          flag: 'jp' },
  { code: 'ko',    endonym: '한국어',          flag: 'kr' },
  { code: 'tl',    endonym: 'Tagalog',       flag: 'ph' },
  { code: 'vi',    endonym: 'Tiếng Việt',    flag: 'vn' },
  { code: 'it',    endonym: 'Italiano',      flag: 'it' },
  { code: 'th',    endonym: 'ไทย',           flag: 'th' },
  { code: 'de',    endonym: 'Deutsch',       flag: 'de' },
  { code: 'pt',    endonym: 'Português',     flag: 'pt' },
  { code: 'mi',    endonym: 'Te Reo Māori',  flag: 'nz' },
  { code: 'ms',    endonym: 'Bahasa Melayu', flag: 'my' },
  { code: 'hi',    endonym: 'हिन्दी',          flag: 'in' },
  { code: 'ru',    endonym: 'Русский',       flag: 'ru' },
]

export const LANGUAGE_BY_CODE: Record<LanguageCode, LanguageMeta> = LANGUAGES.reduce(
  (acc, l) => { acc[l.code] = l; return acc },
  {} as Record<LanguageCode, LanguageMeta>,
)
