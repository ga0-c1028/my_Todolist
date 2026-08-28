import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';
import { dictionaries, SUPPORTED_LOCALES, type Locale, type Messages } from './dictionaries';

const STORAGE_KEY = 'locale';

function detectLocale(): Locale {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored && SUPPORTED_LOCALES.includes(stored as Locale)) {
    return stored as Locale;
  }
  const browserLocale = navigator.language.slice(0, 2);
  return SUPPORTED_LOCALES.includes(browserLocale as Locale) ? (browserLocale as Locale) : 'ko';
}

function resolvePath(messages: Messages, path: string): unknown {
  return path.split('.').reduce<unknown>((acc, key) => {
    if (acc && typeof acc === 'object' && key in acc) {
      return (acc as Record<string, unknown>)[key];
    }
    return undefined;
  }, messages);
}

interface LocaleContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  messages: Messages;
  t: (path: string, vars?: Record<string, string | number>) => string;
}

function makeT(messages: Messages) {
  return (path: string, vars?: Record<string, string | number>) => {
    const resolved = resolvePath(messages, path);
    let text = typeof resolved === 'string' ? resolved : path;
    if (vars) {
      for (const [key, val] of Object.entries(vars)) {
        text = text.replace(`{{${key}}}`, String(val));
      }
    }
    return text;
  };
}

// 기본값: LocaleProvider 없이 렌더링되는 경우(예: 기존 단위 테스트)에도 한국어(ko)로 정상 동작하도록 함
const defaultValue: LocaleContextValue = {
  locale: 'ko',
  setLocale: () => {},
  messages: dictionaries.ko,
  t: makeT(dictionaries.ko),
};

const LocaleContext = createContext<LocaleContextValue>(defaultValue);

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(detectLocale);

  const setLocale = (next: Locale) => {
    localStorage.setItem(STORAGE_KEY, next);
    setLocaleState(next);
  };

  const value = useMemo<LocaleContextValue>(() => {
    const messages = dictionaries[locale];
    return { locale, setLocale, messages, t: makeT(messages) };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locale]);

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale(): LocaleContextValue {
  return useContext(LocaleContext);
}
