export const colors = {
  // Brand Colors
  primary: '#006400',
  primaryLight: '#008000',
  primaryDark: '#004d00',
  secondary: '#D4AF37',
  secondaryLight: '#E5C158',
  secondaryDark: '#B3922B',
  accent: '#C41E3A',

  // Semantic Colors
  success: '#28A745',
  error: '#DC3545',
  warning: '#FFC107',
  info: '#17A2B8',

  // Background Colors
  background: '#F8F9FA',
  surface: '#FFFFFF',
  surfaceVariant: '#F0F0F0',
  card: '#FFFFFF',

  // Text Colors
  text: '#212529',
  textSecondary: '#6C757D',
  textMuted: '#ADB5BD',
  textInverse: '#FFFFFF',

  // Border Colors
  border: '#DEE2E6',
  borderLight: '#E9ECEF',
  borderDark: '#CED4DA',

  // Overlay Colors
  overlay: 'rgba(0, 0, 0, 0.5)',
  overlayLight: 'rgba(0, 0, 0, 0.25)',
  overlayDark: 'rgba(0, 0, 0, 0.75)',

  // Status Colors
  pending: '#FFC107',
  processing: '#17A2B8',
  shipped: '#6F42C1',
  delivered: '#28A745',
  cancelled: '#DC3545',
  refunded: '#6C757D',

  // Gradient Stops
  gradientStart: '#006400',
  gradientEnd: '#008000',
} as const;

export type Colors = typeof colors;

export const darkColors: Colors = {
  ...colors,
  background: '#121212',
  surface: '#1E1E1E',
  surfaceVariant: '#2C2C2C',
  card: '#1E1E1E',
  text: '#E9ECEF',
  textSecondary: '#ADB5BD',
  textMuted: '#6C757D',
  textInverse: '#121212',
  border: '#343A40',
  borderLight: '#495057',
  borderDark: '#212529',
} as const;
