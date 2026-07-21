import { notFound } from 'next/navigation';
import { getRequestConfig } from 'next-intl/server';

// Define the list of supported locales
export const locales = ['ar', 'en'] as const;
export type Locale = (typeof locales)[number];

// Default locale for the application
export const defaultLocale: Locale = 'ar';

// Locale labels for the language switcher
export const localeLabels: Record<Locale, { label: string; flag: string; dir: 'rtl' | 'ltr' }> = {
  ar: { label: 'العربية', flag: 'OM', dir: 'rtl' },
  en: { label: 'English', flag: 'GB', dir: 'ltr' },
};

// Locale prefixes for URL routing
export const localePrefix = 'always' as const;

// Validate locale
export function isValidLocale(locale: string): locale is Locale {
  return locales.includes(locale as Locale);
}

// Get locale direction
export function getLocaleDirection(locale: Locale): 'rtl' | 'ltr' {
  return localeLabels[locale].dir;
}

// Load messages for the requested locale
export default getRequestConfig(async ({ locale }) => {
  // Validate that the incoming `locale` parameter is valid
  if (!isValidLocale(locale)) {
    notFound();
  }

  // Dynamically import messages based on locale
  const messages = (await import(`./messages/${locale}.json`)).default;

  return {
    locale,
    messages,
    timeZone: 'Asia/Muscat',
    now: new Date(),
    onError(error) {
      // Missing keys should not crash the whole page to a white screen
      if (error.code === 'MISSING_MESSAGE') {
        console.warn('[i18n]', error.message);
        return;
      }
      console.error('[i18n]', error);
    },
    getMessageFallback({ namespace, key }) {
      return key;
    },
    formats: {
      dateTime: {
        short: {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        },
        long: {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
          hour: 'numeric',
          minute: 'numeric',
        },
        relative: {
          style: 'long',
        },
      },
      number: {
        currency: {
          style: 'currency',
          currency: 'OMR',
          minimumFractionDigits: 3,
          maximumFractionDigits: 3,
        },
        decimal: {
          style: 'decimal',
          minimumFractionDigits: 0,
          maximumFractionDigits: 2,
        },
        percent: {
          style: 'percent',
          minimumFractionDigits: 0,
          maximumFractionDigits: 2,
        },
      },
      list: {
        enumeration: {
          type: 'conjunction',
        },
      },
    },
    // Define default translation values
    defaultTranslationValues: {
      appName: 'BHD Oman',
      supportEmail: 'support@bhdoman.com',
      companyName: 'BHD Oman Marketplace LLC',
    },
  };
});
