"use client"

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react"
import { translations, type Language } from "./translations"

type TranslationKey = keyof typeof translations.no

type LanguageContextType = {
  language: Language
  setLanguage: (language: Language) => void
  t: (key: TranslationKey) => string
}

const LanguageContext = createContext<LanguageContextType | null>(null)

function isValidLanguage(value: string | null): value is Language {
  return value === "no" || value === "en" || value === "es"
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>("no")

  useEffect(() => {
    const saved = localStorage.getItem("language")

    if (isValidLanguage(saved)) {
      setLanguageState(saved)
    }
  }, [])

  function setLanguage(newLanguage: Language) {
    setLanguageState(newLanguage)
    localStorage.setItem("language", newLanguage)
  }

  const value = useMemo<LanguageContextType>(
    () => ({
      language,
      setLanguage,
      t: (key: TranslationKey) => {
        return translations[language][key] ?? translations.no[key]
      },
    }),
    [language]
  )

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const context = useContext(LanguageContext)

  if (!context) {
    throw new Error("useLanguage must be used inside LanguageProvider")
  }

  return context
}