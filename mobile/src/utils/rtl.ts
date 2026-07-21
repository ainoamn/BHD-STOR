import { I18nManager, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const RTL_LANGUAGE_CODES = ['ar', 'ur', 'he', 'fa'];

export const isRTL = (locale?: string): boolean => {
  if (locale) {
    return RTL_LANGUAGE_CODES.includes(locale);
  }
  return I18nManager.isRTL;
};

export const forceRTL = async (locale: string): Promise<void> => {
  const shouldBeRTL = isRTL(locale);
  const currentRTL = I18nManager.isRTL;

  if (shouldBeRTL !== currentRTL) {
    await AsyncStorage.setItem('user_locale', locale);
    I18nManager.forceRTL(shouldBeRTL);
    I18nManager.allowRTL(shouldBeRTL);
  }
};

export const getTextAlign = (locale?: string): 'left' | 'right' => {
  return isRTL(locale) ? 'right' : 'left';
};

export const getFlexDirection = (locale?: string): 'row' | 'row-reverse' => {
  return isRTL(locale) ? 'row-reverse' : 'row';
};

export const getWritingDirection = (locale?: string): 'ltr' | 'rtl' => {
  return isRTL(locale) ? 'rtl' : 'ltr';
};

export const rtlStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
  },
  rowReverse: {
    flexDirection: 'row-reverse',
  },
  textLeft: {
    textAlign: 'left',
  },
  textRight: {
    textAlign: 'right',
  },
  textCenter: {
    textAlign: 'center',
  },
  alignStart: {
    alignItems: 'flex-start',
  },
  alignEnd: {
    alignItems: 'flex-end',
  },
  selfStart: {
    alignSelf: 'flex-start',
  },
  selfEnd: {
    alignSelf: 'flex-end',
  },
});
