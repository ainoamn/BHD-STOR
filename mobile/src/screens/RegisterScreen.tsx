import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { colors } from '@theme/colors';
import { isRTL } from '@utils/rtl';
import { useAuth } from '@hooks/useAuth';

type RegistrationStep = 'personal' | 'store' | 'review';

interface RegisterScreenProps {
  locale?: string;
}

const RegisterScreen: React.FC<RegisterScreenProps> = ({ locale = 'en' }) => {
  const navigation = useNavigation();
  const rtl = isRTL(locale);
  const { register, isLoading } = useAuth();

  const [step, setStep] = useState<RegistrationStep>('personal');
  const [isSeller, setIsSeller] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);

  // Personal Info
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Store Info
  const [storeName, setStoreName] = useState('');
  const [storeDescription, setStoreDescription] = useState('');

  // Validation errors
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validatePersonal = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!fullName.trim()) newErrors.fullName = 'Full name is required';
    if (!email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Invalid email format';
    }
    if (!phone.trim()) newErrors.phone = 'Phone number is required';
    if (!password) {
      newErrors.password = 'Password is required';
    } else if (password.length < 6) {
      newErrors.password = 'Minimum 6 characters';
    }
    if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    if (!acceptTerms) {
      newErrors.terms = 'You must accept the terms';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStore = (): boolean => {
    if (!isSeller) return true;

    const newErrors: Record<string, string> = {};
    if (!storeName.trim()) newErrors.storeName = 'Store name is required';
    if (!storeDescription.trim()) newErrors.storeDescription = 'Description is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (step === 'personal' && validatePersonal()) {
      setStep(isSeller ? 'store' : 'review');
    } else if (step === 'store' && validateStore()) {
      setStep('review');
    }
  };

  const handleBack = () => {
    if (step === 'review') {
      setStep(isSeller ? 'store' : 'personal');
    } else if (step === 'store') {
      setStep('personal');
    } else {
      navigation.goBack();
    }
  };

  const handleRegister = async () => {
    try {
      await register({
        email: email.trim(),
        password,
        fullName: fullName.trim(),
        phone: phone.trim(),
        storeName: isSeller ? storeName.trim() : undefined,
        storeDescription: isSeller ? storeDescription.trim() : undefined,
        acceptTerms,
      });
      navigation.navigate('Main');
    } catch (error) {
      // Error handled by hook
    }
  };

  const renderStepIndicator = () => {
    const steps: { key: RegistrationStep; label: string }[] = [
      { key: 'personal', label: 'Personal' },
      ...(isSeller ? [{ key: 'store' as RegistrationStep, label: 'Store' }] : []),
      { key: 'review', label: 'Review' },
    ];

    const currentIndex = steps.findIndex((s) => s.key === step);

    return (
      <View style={styles.stepIndicator}>
        {steps.map((s, index) => (
          <React.Fragment key={s.key}>
            <View style={styles.stepItem}>
              <View
                style={[
                  styles.stepCircle,
                  index <= currentIndex && styles.stepCircleActive,
                ]}
              >
                <Text
                  style={[
                    styles.stepNumber,
                    index <= currentIndex && styles.stepNumberActive,
                  ]}
                >
                  {index + 1}
                </Text>
              </View>
              <Text
                style={[
                  styles.stepLabel,
                  index <= currentIndex && styles.stepLabelActive,
                ]}
              >
                {s.label}
              </Text>
            </View>
            {index < steps.length - 1 && (
              <View
                style={[
                  styles.stepLine,
                  index < currentIndex && styles.stepLineActive,
                ]}
              />
            )}
          </React.Fragment>
        ))}
      </View>
    );
  };

  const renderPersonalStep = () => (
    <View style={styles.form}>
      <View style={styles.inputGroup}>
        <Text style={[styles.inputLabel, { textAlign: rtl ? 'right' : 'left' }]}>
          Full Name *
        </Text>
        <View style={[styles.inputContainer, errors.fullName && styles.inputError]}>
          <Icon name="account-outline" size={20} color={colors.textMuted} />
          <TextInput
            style={[styles.input, { textAlign: rtl ? 'right' : 'left' }]}
            placeholder="Your full name"
            placeholderTextColor={colors.textMuted}
            value={fullName}
            onChangeText={(text) => {
              setFullName(text);
              setErrors((prev) => ({ ...prev, fullName: '' }));
            }}
          />
        </View>
        {errors.fullName && <Text style={styles.errorText}>{errors.fullName}</Text>}
      </View>

      <View style={styles.inputGroup}>
        <Text style={[styles.inputLabel, { textAlign: rtl ? 'right' : 'left' }]}>
          Email Address *
        </Text>
        <View style={[styles.inputContainer, errors.email && styles.inputError]}>
          <Icon name="email-outline" size={20} color={colors.textMuted} />
          <TextInput
            style={[styles.input, { textAlign: rtl ? 'right' : 'left' }]}
            placeholder="your@email.com"
            placeholderTextColor={colors.textMuted}
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={(text) => {
              setEmail(text);
              setErrors((prev) => ({ ...prev, email: '' }));
            }}
          />
        </View>
        {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
      </View>

      <View style={styles.inputGroup}>
        <Text style={[styles.inputLabel, { textAlign: rtl ? 'right' : 'left' }]}>
          Phone Number *
        </Text>
        <View style={[styles.inputContainer, errors.phone && styles.inputError]}>
          <Icon name="phone-outline" size={20} color={colors.textMuted} />
          <TextInput
            style={[styles.input, { textAlign: rtl ? 'right' : 'left' }]}
            placeholder="+968 XXXX XXXX"
            placeholderTextColor={colors.textMuted}
            keyboardType="phone-pad"
            value={phone}
            onChangeText={(text) => {
              setPhone(text);
              setErrors((prev) => ({ ...prev, phone: '' }));
            }}
          />
        </View>
        {errors.phone && <Text style={styles.errorText}>{errors.phone}</Text>}
      </View>

      <View style={styles.inputGroup}>
        <Text style={[styles.inputLabel, { textAlign: rtl ? 'right' : 'left' }]}>
          Password *
        </Text>
        <View style={[styles.inputContainer, errors.password && styles.inputError]}>
          <Icon name="lock-outline" size={20} color={colors.textMuted} />
          <TextInput
            style={[styles.input, { textAlign: rtl ? 'right' : 'left' }]}
            placeholder="Min. 6 characters"
            placeholderTextColor={colors.textMuted}
            secureTextEntry={!showPassword}
            value={password}
            onChangeText={(text) => {
              setPassword(text);
              setErrors((prev) => ({ ...prev, password: '' }));
            }}
          />
          <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
            <Icon
              name={showPassword ? 'eye-off-outline' : 'eye-outline'}
              size={20}
              color={colors.textMuted}
            />
          </TouchableOpacity>
        </View>
        {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}
      </View>

      <View style={styles.inputGroup}>
        <Text style={[styles.inputLabel, { textAlign: rtl ? 'right' : 'left' }]}>
          Confirm Password *
        </Text>
        <View style={[styles.inputContainer, errors.confirmPassword && styles.inputError]}>
          <Icon name="lock-check-outline" size={20} color={colors.textMuted} />
          <TextInput
            style={[styles.input, { textAlign: rtl ? 'right' : 'left' }]}
            placeholder="Confirm password"
            placeholderTextColor={colors.textMuted}
            secureTextEntry={!showPassword}
            value={confirmPassword}
            onChangeText={(text) => {
              setConfirmPassword(text);
              setErrors((prev) => ({ ...prev, confirmPassword: '' }));
            }}
          />
        </View>
        {errors.confirmPassword && (
          <Text style={styles.errorText}>{errors.confirmPassword}</Text>
        )}
      </View>

      {/* Seller Toggle */}
      <TouchableOpacity
        style={[styles.sellerToggle, { flexDirection: rtl ? 'row-reverse' : 'row' }]}
        onPress={() => {
          setIsSeller(!isSeller);
          setStep('personal');
        }}
      >
        <View
          style={[
            styles.checkbox,
            isSeller && styles.checkboxActive,
          ]}
        >
          {isSeller && <Icon name="check" size={14} color={colors.textInverse} />}
        </View>
        <Text style={styles.sellerToggleText}>
          I want to open a store
        </Text>
      </TouchableOpacity>

      {/* Terms */}
      <TouchableOpacity
        style={[styles.termsRow, { flexDirection: rtl ? 'row-reverse' : 'row' }]}
        onPress={() => {
          setAcceptTerms(!acceptTerms);
          setErrors((prev) => ({ ...prev, terms: '' }));
        }}
      >
        <View
          style={[
            styles.checkbox,
            acceptTerms && styles.checkboxActive,
            errors.terms && styles.checkboxError,
          ]}
        >
          {acceptTerms && <Icon name="check" size={14} color={colors.textInverse} />}
        </View>
        <Text style={styles.termsText}>
          I agree to the{' '}
          <Text style={styles.termsLink}>Terms and Conditions</Text>
        </Text>
      </TouchableOpacity>
      {errors.terms && <Text style={styles.errorText}>{errors.terms}</Text>}
    </View>
  );

  const renderStoreStep = () => (
    <View style={styles.form}>
      <View style={styles.storeInfoBanner}>
        <Icon name="store" size={24} color={colors.secondary} />
        <Text style={styles.storeInfoText}>
          Set up your store to start selling products
        </Text>
      </View>

      <View style={styles.inputGroup}>
        <Text style={[styles.inputLabel, { textAlign: rtl ? 'right' : 'left' }]}>
          Store Name *
        </Text>
        <View style={[styles.inputContainer, errors.storeName && styles.inputError]}>
          <Icon name="storefront" size={20} color={colors.textMuted} />
          <TextInput
            style={[styles.input, { textAlign: rtl ? 'right' : 'left' }]}
            placeholder="Your store name"
            placeholderTextColor={colors.textMuted}
            value={storeName}
            onChangeText={(text) => {
              setStoreName(text);
              setErrors((prev) => ({ ...prev, storeName: '' }));
            }}
          />
        </View>
        {errors.storeName && <Text style={styles.errorText}>{errors.storeName}</Text>}
      </View>

      <View style={styles.inputGroup}>
        <Text style={[styles.inputLabel, { textAlign: rtl ? 'right' : 'left' }]}>
          Store Description *
        </Text>
        <View
          style={[
            styles.inputContainer,
            styles.textArea,
            errors.storeDescription && styles.inputError,
          ]}
        >
          <TextInput
            style={[
              styles.input,
              styles.textAreaInput,
              { textAlign: rtl ? 'right' : 'left' },
            ]}
            placeholder="Describe what you sell..."
            placeholderTextColor={colors.textMuted}
            multiline
            numberOfLines={4}
            value={storeDescription}
            onChangeText={(text) => {
              setStoreDescription(text);
              setErrors((prev) => ({ ...prev, storeDescription: '' }));
            }}
          />
        </View>
        {errors.storeDescription && (
          <Text style={styles.errorText}>{errors.storeDescription}</Text>
        )}
      </View>
    </View>
  );

  const renderReviewStep = () => (
    <View style={styles.form}>
      <Text style={styles.reviewTitle}>Review Your Information</Text>

      <View style={styles.reviewSection}>
        <Text style={styles.reviewSectionTitle}>Personal Details</Text>
        <View style={styles.reviewItem}>
          <Text style={styles.reviewLabel}>Name</Text>
          <Text style={styles.reviewValue}>{fullName}</Text>
        </View>
        <View style={styles.reviewItem}>
          <Text style={styles.reviewLabel}>Email</Text>
          <Text style={styles.reviewValue}>{email}</Text>
        </View>
        <View style={styles.reviewItem}>
          <Text style={styles.reviewLabel}>Phone</Text>
          <Text style={styles.reviewValue}>{phone}</Text>
        </View>
      </View>

      {isSeller && (
        <View style={styles.reviewSection}>
          <Text style={styles.reviewSectionTitle}>Store Details</Text>
          <View style={styles.reviewItem}>
            <Text style={styles.reviewLabel}>Store Name</Text>
            <Text style={styles.reviewValue}>{storeName}</Text>
          </View>
          <View style={styles.reviewItem}>
            <Text style={styles.reviewLabel}>Description</Text>
            <Text style={styles.reviewValue} numberOfLines={2}>
              {storeDescription}
            </Text>
          </View>
        </View>
      )}
    </View>
  );

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Back Button */}
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <Icon name="arrow-left" size={24} color={colors.text} />
        </TouchableOpacity>

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Create Account</Text>
          <Text style={styles.headerSubtitle}>
            {step === 'personal' && 'Enter your details'}
            {step === 'store' && 'Set up your store'}
            {step === 'review' && 'Review and confirm'}
          </Text>
        </View>

        {/* Step Indicator */}
        {renderStepIndicator()}

        {/* Step Content */}
        {step === 'personal' && renderPersonalStep()}
        {step === 'store' && renderStoreStep()}
        {step === 'review' && renderReviewStep()}

        {/* Action Button */}
        {step === 'review' ? (
          <TouchableOpacity
            style={[styles.actionButton, isLoading && styles.actionButtonDisabled]}
            onPress={handleRegister}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color={colors.textInverse} />
            ) : (
              <Text style={styles.actionButtonText}>
                {isSeller ? 'Create Account & Store' : 'Create Account'}
              </Text>
            )}
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.actionButton} onPress={handleNext}>
            <Text style={styles.actionButtonText}>Continue</Text>
            <Icon name="arrow-right" size={18} color={colors.textInverse} />
          </TouchableOpacity>
        )}

        {/* Login Link */}
        <View style={[styles.loginLink, { flexDirection: rtl ? 'row-reverse' : 'row' }]}>
          <Text style={styles.loginLinkText}>Already have an account?</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Login')}>
            <Text style={styles.loginLinkAction}>Sign In</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 40,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surfaceVariant,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  header: {
    marginBottom: 24,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
  },
  headerSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 4,
  },
  // Step Indicator
  stepIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
  },
  stepItem: {
    alignItems: 'center',
  },
  stepCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.surfaceVariant,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.border,
  },
  stepCircleActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  stepNumber: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  stepNumberActive: {
    color: colors.textInverse,
  },
  stepLabel: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 4,
  },
  stepLabelActive: {
    color: colors.primary,
    fontWeight: '600',
  },
  stepLine: {
    width: 40,
    height: 2,
    backgroundColor: colors.border,
    marginHorizontal: 8,
  },
  stepLineActive: {
    backgroundColor: colors.primary,
  },
  // Form
  form: {
    marginBottom: 24,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.textSecondary,
    marginBottom: 6,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 50,
    backgroundColor: colors.surface,
    borderRadius: 12,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 10,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: colors.text,
    height: '100%',
  },
  inputError: {
    borderColor: colors.error,
  },
  errorText: {
    fontSize: 12,
    color: colors.error,
    marginTop: 4,
  },
  textArea: {
    height: 100,
    alignItems: 'flex-start',
    paddingTop: 10,
  },
  textAreaInput: {
    height: 80,
    textAlignVertical: 'top',
  },
  // Seller Toggle
  sellerToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 10,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  checkboxError: {
    borderColor: colors.error,
  },
  sellerToggleText: {
    fontSize: 14,
    color: colors.text,
  },
  // Terms
  termsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  termsText: {
    fontSize: 13,
    color: colors.textSecondary,
    flex: 1,
  },
  termsLink: {
    color: colors.primary,
    fontWeight: '600',
  },
  // Store Info
  storeInfoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${colors.secondary}10`,
    padding: 14,
    borderRadius: 12,
    marginBottom: 20,
    gap: 10,
  },
  storeInfoText: {
    flex: 1,
    fontSize: 13,
    color: colors.textSecondary,
  },
  // Review
  reviewTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 16,
  },
  reviewSection: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
  },
  reviewSectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.primary,
    marginBottom: 10,
  },
  reviewItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  reviewLabel: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  reviewValue: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
    flex: 1,
    textAlign: 'right',
  },
  // Action Button
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 52,
    backgroundColor: colors.primary,
    borderRadius: 12,
    gap: 8,
  },
  actionButtonDisabled: {
    opacity: 0.7,
  },
  actionButtonText: {
    color: colors.textInverse,
    fontSize: 16,
    fontWeight: '700',
  },
  // Login Link
  loginLink: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
    gap: 4,
  },
  loginLinkText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  loginLinkAction: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '700',
  },
});

export default RegisterScreen;
