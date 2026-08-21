import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Translation files
import translationEN from './locales/en.json';
import translationFR from './locales/fr.json';
import translationAR from './locales/ar.json';

const resources = {
    en: {
        translation: translationEN
    },
    fr: {
        translation: translationFR
    },
    ar: {
        translation: translationAR
    }
};

i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
        resources,
        lng: localStorage.getItem('language') || localStorage.getItem('i18nextLng') || 'en',
        fallbackLng: 'en',
        interpolation: {
            escapeValue: false // react already safes from xss
        },
        detection: {
            order: ['localStorage', 'cookie', 'htmlTag', 'path', 'subdomain'],
            caches: ['localStorage']
        }
    });

// Handle RTL for Arabic
i18n.on('languageChanged', (lng) => {
    document.documentElement.dir = lng === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = lng;
});

export default i18n;