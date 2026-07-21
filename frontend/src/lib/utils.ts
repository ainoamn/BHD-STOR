import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Combines multiple class names using clsx and merges Tailwind classes using tailwind-merge.
 * This utility prevents conflicting Tailwind classes and supports conditional class names.
 *
 * @param inputs - Class values to combine and merge
 * @returns Merged class string
 *
 * @example
 * cn('text-red-500', 'text-blue-500') // => 'text-blue-500' (last one wins)
 * cn('px-4 py-2', condition && 'bg-blue-500') // => conditional classes
 * cn('btn', { 'btn-primary': isPrimary, 'btn-lg': isLarge }) // => object syntax
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/**
 * Joins class names conditionally with a custom separator.
 * Useful for joining multiple conditional classes.
 *
 * @param classes - Array of class strings or falsy values
 * @param separator - Separator between classes (default: ' ')
 * @returns Joined class string
 */
export function cnJoin(classes: (string | undefined | null | false)[], separator: string = ' '): string {
  return classes.filter(Boolean).join(separator);
}

/**
 * Formats a price value with the appropriate currency symbol and locale.
 *
 * @param price - The price value to format
 * @param locale - The locale to use for formatting (default: 'ar-OM')
 * @param currency - The currency code (default: 'OMR' - Omani Rial)
 * @param fractionDigits - Number of decimal places (default: 3 for OMR)
 * @returns Formatted price string
 *
 * @example
 * formatPrice(125.500) // => 'ر.ع. 125.500'
 * formatPrice(125.5, 'en-US', 'OMR') // => 'OMR 125.500'
 * formatPrice(99.99, 'en-US', 'USD', 2) // => '$99.99'
 */
export function formatPrice(
  price: number | string,
  locale: string = 'ar-OM',
  currency: string = 'OMR',
  fractionDigits: number = 3
): string {
  const numericPrice = typeof price === 'string' ? parseFloat(price) : price;

  if (isNaN(numericPrice)) {
    return '—';
  }

  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  }).format(numericPrice);
}

/**
 * Formats a price without currency symbol.
 *
 * @param price - The price value to format
 * @param locale - The locale to use (default: 'ar-OM')
 * @param fractionDigits - Number of decimal places
 * @returns Formatted price string without currency
 */
export function formatPriceOnly(
  price: number | string,
  locale: string = 'ar-OM',
  fractionDigits: number = 3
): string {
  const numericPrice = typeof price === 'string' ? parseFloat(price) : price;

  if (isNaN(numericPrice)) {
    return '—';
  }

  return new Intl.NumberFormat(locale, {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  }).format(numericPrice);
}

/**
 * Calculates and formats a discount percentage.
 *
 * @param originalPrice - Original price
 * @param salePrice - Sale price
 * @returns Formatted discount percentage string
 */
export function formatDiscount(originalPrice: number, salePrice: number): string {
  if (originalPrice <= 0 || salePrice <= 0 || salePrice >= originalPrice) {
    return '0%';
  }

  const discount = ((originalPrice - salePrice) / originalPrice) * 100;
  return `${Math.round(discount)}%`;
}

/**
 * Formats a date according to the specified locale and format options.
 *
 * @param date - Date to format (Date object, ISO string, or timestamp)
 * @param locale - Locale for formatting (default: 'ar-OM')
 * @param options - Intl.DateTimeFormatOptions
 * @returns Formatted date string
 *
 * @example
 * formatDate(new Date()) // => '١٥ نوفمبر ٢٠٢٤'
 * formatDate('2024-11-15', 'en-US', { dateStyle: 'medium' }) // => 'Nov 15, 2024'
 */
export function formatDate(
  date: Date | string | number,
  locale: string = 'ar-OM',
  options: Intl.DateTimeFormatOptions = { dateStyle: 'long' }
): string {
  const dateObj = date instanceof Date ? date : new Date(date);

  if (isNaN(dateObj.getTime())) {
    return '—';
  }

  return new Intl.DateTimeFormat(locale, options).format(dateObj);
}

/**
 * Formats a date with time.
 *
 * @param date - Date to format
 * @param locale - Locale for formatting
 * @returns Formatted date and time string
 */
export function formatDateTime(
  date: Date | string | number,
  locale: string = 'ar-OM'
): string {
  return formatDate(date, locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Formats a relative time string (e.g., "2 hours ago", "yesterday").
 *
 * @param date - Date to format relatively
 * @param locale - Locale for formatting (default: 'ar-OM')
 * @returns Relative time string
 *
 * @example
 * formatRelativeTime(new Date(Date.now() - 3600000)) // => 'قبل ساعة'
 * formatRelativeTime(new Date(), 'en-US') // => 'now'
 */
export function formatRelativeTime(
  date: Date | string | number,
  locale: string = 'ar-OM'
): string {
  const dateObj = date instanceof Date ? date : new Date(date);
  const now = new Date();
  const diffMs = now.getTime() - dateObj.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);
  const diffWeeks = Math.floor(diffDays / 7);
  const diffMonths = Math.floor(diffDays / 30);
  const diffYears = Math.floor(diffDays / 365);

  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });

  if (diffSeconds < 60) {
    return rtf.format(-diffSeconds, 'second');
  }
  if (diffMinutes < 60) {
    return rtf.format(-diffMinutes, 'minute');
  }
  if (diffHours < 24) {
    return rtf.format(-diffHours, 'hour');
  }
  if (diffDays < 7) {
    return rtf.format(-diffDays, 'day');
  }
  if (diffWeeks < 4) {
    return rtf.format(-diffWeeks, 'week');
  }
  if (diffMonths < 12) {
    return rtf.format(-diffMonths, 'month');
  }
  return rtf.format(-diffYears, 'year');
}

/**
 * Generates a URL-friendly slug from a string.
 *
 * @param text - Text to convert to slug
 * @returns URL-friendly slug string
 *
 * @example
 * generateSlug('Hello World!') // => 'hello-world'
 * generateSlug('BHD Oman ماركت') // => 'bhd-oman-markt'
 */
export function generateSlug(text: string): string {
  return text
    .toString()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\u0600-\u06FF-]/g, '')
    .replace(/--+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Generates a unique ID.
 *
 * @param prefix - Optional prefix for the ID
 * @returns Unique ID string
 */
export function generateId(prefix?: string): string {
  const id = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  return prefix ? `${prefix}-${id}` : id;
}

/**
 * Truncates text to a specified length with ellipsis.
 *
 * @param text - Text to truncate
 * @param maxLength - Maximum length
 * @param suffix - Suffix to add (default: '...')
 * @returns Truncated text
 */
export function truncateText(text: string, maxLength: number, suffix: string = '...'): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength).trim() + suffix;
}

/**
 * Converts a file size in bytes to human-readable format.
 *
 * @param bytes - Size in bytes
 * @param locale - Locale for number formatting
 * @returns Human-readable file size
 */
export function formatFileSize(bytes: number, locale: string = 'ar-OM'): string {
  if (bytes === 0) return '0 B';

  const units = ['B', 'KB', 'MB', 'GB', 'TB', 'PB'];
  const k = 1024;
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${new Intl.NumberFormat(locale).format(parseFloat((bytes / Math.pow(k, i)).toFixed(2)))} ${units[i]}`;
}

/**
 * Debounces a function call.
 *
 * @param fn - Function to debounce
 * @param delay - Delay in milliseconds
 * @returns Debounced function
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout>;

  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
}

/**
 * Throttles a function call.
 *
 * @param fn - Function to throttle
 * @param limit - Time limit in milliseconds
 * @returns Throttled function
 */
export function throttle<T extends (...args: unknown[]) => unknown>(
  fn: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle = false;

  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      fn(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

/**
 * Simulates AES-256 encryption (client-side placeholder).
 * In production, use a proper encryption library or server-side encryption.
 *
 * @param text - Text to encrypt
 * @param key - Encryption key
 * @returns Encrypted string (Base64)
 */
export function encrypt(text: string, key: string): string {
  try {
    // Simple XOR-based obfuscation for client-side use
    // WARNING: This is NOT secure encryption. Use server-side encryption for sensitive data.
    const combined = `${key}:${text}`;
    return btoa(
      Array.from(combined)
        .map((char, i) =>
          String.fromCharCode(char.charCodeAt(0) ^ key.charCodeAt(i % key.length))
        )
        .join('')
    );
  } catch {
    return text;
  }
}

/**
 * Simulates AES-256 decryption (client-side placeholder).
 * In production, use a proper encryption library or server-side encryption.
 *
 * @param encryptedText - Encrypted text (Base64)
 * @param key - Decryption key
 * @returns Decrypted string
 */
export function decrypt(encryptedText: string, key: string): string {
  try {
    const decoded = atob(encryptedText);
    const result = Array.from(decoded)
      .map((char, i) =>
        String.fromCharCode(char.charCodeAt(0) ^ key.charCodeAt(i % key.length))
      )
      .join('');

    // Remove key prefix
    const prefix = `${key}:`;
    return result.startsWith(prefix) ? result.slice(prefix.length) : result;
  } catch {
    return encryptedText;
  }
}

/**
 * Safely parses JSON with a fallback value.
 *
 * @param json - JSON string to parse
 * @param fallback - Fallback value if parsing fails
 * @returns Parsed value or fallback
 */
export function safeJsonParse<T>(json: string | null | undefined, fallback: T): T {
  if (!json) return fallback;

  try {
    return JSON.parse(json) as T;
  } catch {
    return fallback;
  }
}

/**
 * Deep clones an object using JSON serialization.
 * Note: Does not handle functions, undefined, or circular references.
 *
 * @param obj - Object to clone
 * @returns Deep cloned object
 */
export function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

/**
 * Checks if a value is empty (null, undefined, empty string, empty array, empty object).
 *
 * @param value - Value to check
 * @returns True if empty
 */
export function isEmpty(value: unknown): boolean {
  if (value == null) return true;
  if (typeof value === 'string') return value.trim().length === 0;
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === 'object') return Object.keys(value).length === 0;
  return false;
}

/**
 * Capitalizes the first letter of a string.
 *
 * @param str - String to capitalize
 * @returns Capitalized string
 */
export function capitalize(str: string): string {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Capitalizes each word in a string.
 *
 * @param str - String to capitalize
 * @returns Title-cased string
 */
export function titleCase(str: string): string {
  return str
    .toLowerCase()
    .split(/\s+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Formats a number with locale-specific separators.
 *
 * @param num - Number to format
 * @param locale - Locale for formatting
 * @returns Formatted number string
 */
export function formatNumber(num: number | string, locale: string = 'ar-OM'): string {
  const numeric = typeof num === 'string' ? parseFloat(num) : num;
  if (isNaN(numeric)) return '—';

  return new Intl.NumberFormat(locale).format(numeric);
}

/**
 * Converts a data URL to a Blob object.
 *
 * @param dataUrl - Data URL string
 * @returns Blob object
 */
export function dataUrlToBlob(dataUrl: string): Blob {
  const arr = dataUrl.split(',');
  const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/png';
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);

  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }

  return new Blob([u8arr], { type: mime });
}

/**
 * Creates a delayed promise.
 *
 * @param ms - Milliseconds to delay
 * @returns Promise that resolves after the delay
 */
export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Retries an async function with exponential backoff.
 *
 * @param fn - Function to retry
 * @param maxRetries - Maximum number of retries
 * @param delayMs - Initial delay in milliseconds
 * @returns Result of the function
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  delayMs: number = 1000
): Promise<T> {
  let lastError: Error | undefined;

  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      const backoffDelay = delayMs * Math.pow(2, i);
      await delay(backoffDelay);
    }
  }

  throw lastError || new Error('Max retries exceeded');
}

/**
 * Extracts initials from a name string.
 *
 * @param name - Full name
 * @param limit - Maximum number of initials (default: 2)
 * @returns Initials string
 */
export function getInitials(name: string, limit: number = 2): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word[0].toUpperCase())
    .slice(0, limit)
    .join('');
}

/**
 * Converts a hex color to RGB values.
 *
 * @param hex - Hex color string
 * @returns RGB object or null
 */
export function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
}

/**
 * Adds alpha channel to a hex color.
 *
 * @param hex - Hex color string
 * @param alpha - Alpha value (0-1)
 * @returns RGBA string
 */
export function hexToRgba(hex: string, alpha: number): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;
  return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})`;
}

/**
 * Creates a range array.
 *
 * @param start - Start value
 * @param end - End value
 * @returns Array of numbers in range
 */
export function range(start: number, end: number): number[] {
  return Array.from({ length: end - start + 1 }, (_, i) => start + i);
}

/**
 * Shuffles an array randomly (Fisher-Yates algorithm).
 *
 * @param array - Array to shuffle
 * @returns New shuffled array
 */
export function shuffle<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * Groups an array of objects by a key.
 *
 * @param array - Array to group
 * @param key - Key to group by
 * @returns Grouped object
 */
export function groupBy<T>(array: T[], key: keyof T): Record<string, T[]> {
  return array.reduce(
    (result, item) => {
      const groupKey = String(item[key]);
      if (!result[groupKey]) {
        result[groupKey] = [];
      }
      result[groupKey].push(item);
      return result;
    },
    {} as Record<string, T[]>
  );
}

/**
 * Removes duplicates from an array.
 *
 * @param array - Array with potential duplicates
 * @returns Array with unique values
 */
export function unique<T>(array: T[]): T[] {
  return [...new Set(array)];
}

/**
 * Partitions an array into two arrays based on a predicate.
 *
 * @param array - Array to partition
 * @param predicate - Predicate function
 * @returns Tuple of [passing, failing] arrays
 */
export function partition<T>(array: T[], predicate: (item: T) => boolean): [T[], T[]] {
  const pass: T[] = [];
  const fail: T[] = [];

  for (const item of array) {
    if (predicate(item)) {
      pass.push(item);
    } else {
      fail.push(item);
    }
  }

  return [pass, fail];
}
