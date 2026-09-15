/**
 * Sistema i18n ligero: context + hook + detección automática.
 * Soporta claves anidadas ('a.b.c') e interpolación {{var}}.
 */
import { createContext, useContext, useState, useCallback, useMemo } from 'react';

const I18nContext = createContext();

const STORAGE_KEY = 'mira_lang';

const AVAILABLE = {
  es: 'Español',
  ca: 'Català',
  en: 'English',
};

function detectarIdioma() {
  const guardado = localStorage.getItem(STORAGE_KEY);
  if (guardado && AVAILABLE[guardado]) return guardado;
  const nav = (navigator.language || navigator.userLanguage || '').toLowerCase();
  if (nav.startsWith('ca')) return 'ca';
  if (nav.startsWith('en')) return 'en';
  return 'es';
}

function get(obj, path) {
  return path.split('.').reduce((o, k) => (o && o[k] != null ? o[k] : null), obj);
}

function interp(str, params) {
  if (!params) return str;
  return str.replace(/\{\{(\w+)\}\}/g, (_, k) => (params[k] != null ? params[k] : `{{${k}}}`));
}

export function I18nProvider({ children, lang: langProp, onLangChange }) {
  const [langInterno, setLangInterno] = useState(detectarIdioma);
  const lang = langProp || langInterno;

  const setLang = useCallback((l) => {
    if (!AVAILABLE[l]) return;
    localStorage.setItem(STORAGE_KEY, l);
    setLangInterno(l);
    if (onLangChange) onLangChange(l);
  }, [onLangChange]);

  const value = useMemo(() => ({ lang, setLang, available: AVAILABLE }), [lang, setLang]);
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  return useContext(I18nContext);
}

export function useT(translations) {
  const { lang } = useContext(I18nContext);
  return useCallback(
    (key, params) => {
      const dict = translations[lang] || translations.es || {};
      const val = get(dict, key);
      if (val == null) return key;
      return typeof val === 'string' ? interp(val, params) : val;
    },
    [lang, translations],
  );
}

export { AVAILABLE, detectarIdioma };
