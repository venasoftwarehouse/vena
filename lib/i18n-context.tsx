"use client"
import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"

type Language = "id" | "en"

interface I18nContextType {
  language: Language
  setLanguage: (language: Language) => void
  t: (key: string) => any
}

const I18nContext = createContext<I18nContextType | undefined>(undefined)

// Import translation dictionaries from JSON files
import idTranslations from "../dictionaries/id.json";
import enTranslations from "../dictionaries/en.json";

const translations = {
  id: idTranslations,
  en: enTranslations,
};

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [isHydrated, setIsHydrated] = useState(false);
  // Inisialisasi state langsung dari localStorage jika ada
  const getInitialLanguage = (): Language => {
    if (typeof window !== "undefined") {
      const savedLanguage = localStorage.getItem("language") as Language;
      if (savedLanguage === "id" || savedLanguage === "en") {
        return savedLanguage;
      }
    }
    return "id";
  };
  const [language, setLanguage] = useState<Language>(getInitialLanguage());
  useEffect(() => {
    setIsHydrated(true);
  }, []);
  // Tidak perlu useEffect untuk set state dari localStorage lagi
  useEffect(() => {
    // Save to localStorage when language changes
    localStorage.setItem("language", language)
    // Update document language attribute
    document.documentElement.lang = language
  }, [language])
  // Support both flat and namespace keys, can return any type (string, array, object)
  const t = (key: string): any => {
    const dict = translations[language];
    // Try namespace (nested) lookup
    const keys = key.split(".");
    let value: any = dict;
    for (const k of keys) {
      value = value?.[k];
      if (value === undefined) break;
    }
    // If found, return the value (can be string, array, or object)
    if (value !== undefined) return value;
    // Fallback to flat key lookup
    if (typeof (dict as any)[key] === "string") return (dict as any)[key];
    // Fallback: return key
    return key;
  }
  const value = {
    language,
    setLanguage,
    t,
  }
  // Render children hanya setelah hydration
  if (!isHydrated) {
    // Bisa return null, atau loader, atau fallback
    return null;
  }
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

export function useI18n() {
  const context = useContext(I18nContext)
  if (context === undefined) {
    throw new Error("useI18n must be used within an I18nProvider")
  }
  return context
}