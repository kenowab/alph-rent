import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { DEFAULT_LANGUAGE, LANGUAGES, translate } from '../i18n/translations'

const LANGUAGE_KEY = 'alpha_rent_language'

const getInitialLanguage = () => {
  try {
    const stored = localStorage.getItem(LANGUAGE_KEY)
    if (stored && LANGUAGES.some((l) => l.code === stored)) return stored
  } catch {
    /* storage unavailable */
  }
  return DEFAULT_LANGUAGE
}

const LanguageContext = createContext(null)

export function LanguageProvider({ children }) {
  const [language, setLanguage] = useState(getInitialLanguage)

  useEffect(() => {
    try {
      localStorage.setItem(LANGUAGE_KEY, language)
    } catch {
      /* storage unavailable */
    }
    document.documentElement.lang = language === 'am' ? 'am' : language === 'om' ? 'om' : 'en'
  }, [language])

  const t = useCallback((key) => translate(language, key), [language])

  const value = useMemo(
    () => ({ language, setLanguage, t, languages: LANGUAGES }),
    [language, t],
  )

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (!context) throw new Error('useLanguage must be used within LanguageProvider')
  return context
}
