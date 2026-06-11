import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './languages/en.json';
import hi from './languages/hi.json';

const saved = typeof localStorage !== 'undefined' ? localStorage.getItem('eh_lang') : null;

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    hi: { translation: hi }
  },
  lng: saved || 'en',
  fallbackLng: 'en',
  interpolation: { escapeValue: false }
});

export function setLanguage(code) {
  localStorage.setItem('eh_lang', code);
  i18n.changeLanguage(code);
}

export default i18n;
