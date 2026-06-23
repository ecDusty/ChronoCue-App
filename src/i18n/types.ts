import { en } from './en'

export type LanguageCode =
  | 'en'
  | 'zh-CN'
  | 'zh-HK'
  | 'es'
  | 'fr'
  | 'ja'
  | 'ko'
  | 'tl'
  | 'vi'
  | 'it'
  | 'th'
  | 'de'
  | 'pt'
  | 'mi'
  | 'ms'
  | 'hi'
  | 'ru'

/** Every translatable string key (derived from the English source of truth). */
export type TranslationKey = keyof typeof en

/** A complete set of translations. Packs typed as this fail the build if any key is missing. */
export type Translations = Record<TranslationKey, string>

export interface LanguageMeta {
  code: LanguageCode
  /** The language's own name, in its own script (shown in the menu). */
  endonym: string
  /** Flag file basename in public/flags/ (e.g. 'gb' -> /flags/gb.svg). */
  flag: string
}
