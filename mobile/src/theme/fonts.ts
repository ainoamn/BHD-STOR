import { Platform } from 'react-native';

export const fonts = {
  // Primary font family
  primary: Platform.select({
    ios: 'Tajawal',
    android: 'Tajawal-Regular',
  }),
  primaryBold: Platform.select({
    ios: 'Tajawal-Bold',
    android: 'Tajawal-Bold',
  }),
  primaryMedium: Platform.select({
    ios: 'Tajawal-Medium',
    android: 'Tajawal-Medium',
  }),
  primaryLight: Platform.select({
    ios: 'Tajawal-Light',
    android: 'Tajawal-Light',
  }),

  // System fallback
  system: Platform.select({
    ios: 'System',
    android: 'Roboto',
  }),
} as const;

export const fontSizes = {
  xs: 10,
  sm: 12,
  md: 14,
  base: 16,
  lg: 18,
  xl: 20,
  '2xl': 24,
  '3xl': 30,
  '4xl': 36,
  '5xl': 48,
} as const;

export const fontWeights = {
  light: '300',
  normal: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
  extrabold: '800',
} as const;

export const lineHeights = {
  tight: 1.25,
  normal: 1.5,
  relaxed: 1.75,
} as const;
