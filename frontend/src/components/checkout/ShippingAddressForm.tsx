/**
 * ShippingAddressForm Component
 * ==============================
 * Address form with logistics integration:
 * - Address autocomplete
 * - Map picker for precise location
 * - Zone validation (check if address is covered)
 * - Save address for future
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Box,
  TextField,
  Button,
  Typography,
  Paper,
  Grid,
  Autocomplete,
  Chip,
  FormControlLabel,
  Checkbox,
  Alert,
  CircularProgress,
  Divider,
  IconButton,
  Tooltip,
  Fade,
  Stepper,
  Step,
  StepLabel,
} from '@mui/material';
import {
  LocationOn as LocationIcon,
  MyLocation as GPSIcon,
  Map as MapIcon,
  CheckCircle as CheckIcon,
  ErrorOutline as ErrorIcon,
  Save as SaveIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
} from '@mui/icons-material';

// ─── Types ──────────────────────────────────────────────────

export interface AddressData {
  id?: string;
  label?: string;
  fullName: string;
  phone: string;
  email?: string;
  governorate: string;
  wilayat: string;
  district: string;
  street: string;
  building: string;
  apartment?: string;
  floor?: string;
  nearestLandmark?: string;
  additionalInstructions?: string;
  latitude?: number;
  longitude?: number;
  zoneId?: string;
  zoneName?: string;
  isDefault?: boolean;
  isCovered: boolean;
}

export interface SavedAddress {
  id: string;
  label: string;
  fullName: string;
  phone: string;
  address: string;
  zoneId: string;
  zoneName: string;
  isDefault: boolean;
  latitude?: number;
  longitude?: number;
}

export interface ShippingAddressFormProps {
  locale?: 'ar' | 'en';
  initialData?: AddressData;
  savedAddresses?: SavedAddress[];
  onAddressChange?: (address: AddressData, isValid: boolean) => void;
  onSaveAddress?: (address: AddressData) => Promise<void>;
  onDeleteAddress?: (addressId: string) => Promise<void>;
  validateZone?: (address: string) => Promise<{ zoneId: string; zoneName: string; covered: boolean }>;
}

// ─── Omani Governorates & Wilayats ──────────────────────────

const OMANI_GOVERNORATES = [
  {
    nameAr: 'مسقط',
    nameEn: 'Muscat',
    wilayats: [
      { nameAr: 'مسقط', nameEn: 'Muscat' },
      { nameAr: 'مطرح', nameEn: 'Muttrah' },
      { nameAr: 'بوشر', nameEn: 'Bawshar' },
      { nameAr: 'السيب', nameEn: 'Seeb' },
      { nameAr: 'العامرات', nameEn: 'Al Amrat' },
      { nameAr: 'قريات', nameEn: 'Qurayyat' },
    ],
  },
  {
    nameAr: 'شمال الباطنة',
    nameEn: 'North Al Batinah',
    wilayats: [
      { nameAr: 'صحار', nameEn: 'Sohar' },
      { nameAr: 'شinas', nameEn: 'Shinas' },
      { nameAr: 'لوى', nameEn: 'Liwa' },
      { nameAr: 'صحم', nameEn: 'Saham' },
      { nameAr: 'الخابورة', nameEn: 'Al Khaboura' },
      { nameAr: 'السويق', nameEn: 'Al Suwayq' },
    ],
  },
  {
    nameAr: 'جنوب الباطنة',
    nameEn: 'South Al Batinah',
    wilayats: [
      { nameAr: 'نخل', nameEn: 'Nakhal' },
      { nameAr: 'وادي المعاول', nameEn: 'Wadi Al Maawil' },
      { nameAr: 'الرستاق', nameEn: 'Al Rustaq' },
      { nameAr: 'العوابي', nameEn: 'Al Awabi' },
      { nameAr: 'المصنعة', nameEn: 'Al Musanaah' },
      { nameAr: 'بركاء', nameEn: 'Barka' },
    ],
  },
  {
    nameAr: 'الداخلية',
    nameEn: 'Ad Dakhiliyah',
    wilayats: [
      { nameAr: 'نزوى', nameEn: 'Nizwa' },
      { nameAr: 'سمائل', nameEn: 'Samail' },
      { nameAr: 'بهلا', nameEn: 'Bahla' },
      { nameAr: 'الحمراء', nameEn: 'Al Hamra' },
      { nameAr: 'أدم', nameEn: 'Adam' },
      { nameAr: 'إزكي', nameEn: 'Izki' },
      { nameAr: 'بدبد', nameEn: 'Bidbid' },
      { nameAr: 'منح', nameEn: 'Manah' },
    ],
  },
  {
    nameAr: 'الظفار',
    nameEn: 'Dhofar',
    wilayats: [
      { nameAr: 'صلالة', nameEn: 'Salalah' },
      { nameAr: 'مقشن', nameEn: 'Muqshin' },
      { nameAr: 'ثومريت', nameEn: 'Thumrait' },
      { nameAr: 'شليم وجزر الحلانيات', nameEn: 'Shalim & Hallaniyat' },
      { nameAr: 'سدح', nameEn: 'Sadah' },
      { nameAr: 'رخيوت', nameEn: 'Rakhyut' },
      { nameAr: 'ضلكوت', nameEn: 'Dalkut' },
      { nameAr: 'المزيونة', nameEn: 'Al Mazyonah' },
      { nameAr: 'شربثات', nameEn: 'Sharbithat' },
      { nameAr: 'طاقة', nameEn: 'Taqah' },
      { nameAr: 'مرباط', nameEn: 'Mirbat' },
      { nameAr: 'سدح', nameEn: 'Sadah' },
    ],
  },
  {
    nameAr: 'شمال الشرقية',
    nameEn: 'North Ash Sharqiyah',
    wilayats: [
      { nameAr: 'إبراء', nameEn: 'Ibra' },
      { nameAr: 'المضارب', nameEn: 'Al Mudhaibi' },
      { nameAr: 'بدية', nameEn: 'Bidiya' },
      { nameAr: 'وادي بني خالد', nameEn: 'Wadi Bani Khalid' },
      { nameAr: 'دماء والطائيين', nameEn: 'Dima & Taeein' },
      { nameAr: 'سناو', nameEn: 'Sinaw' },
    ],
  },
  {
    nameAr: 'جنوب الشرقية',
    nameEn: 'South Ash Sharqiyah',
    wilayats: [
      { nameAr: 'صور', nameEn: 'Sur' },
      { nameAr: 'الكامل والوافي', nameEn: 'Al Kamil & Wafi' },
      { nameAr: 'جعلان بني بو علي', nameEn: 'Jalan Bani Bu Ali' },
      { nameAr: 'جعلان بني بو حسن', nameEn: 'Jalan Bani Bu Hassan' },
      { nameAr: 'مصيرة', nameEn: 'Masirah' },
    ],
  },
  {
    nameAr: 'الوسطى',
    nameEn: 'Al Wusta',
    wilayats: [
      { nameAr: 'هيما', nameEn: 'Haima' },
      { nameAr: 'الدقم', nameEn: 'Duqm' },
      { nameAr: 'محوت', nameEn: 'Mahout' },
      { nameAr: 'الجازر', nameEn: 'Al Jazer' },
    ],
  },
  {
    nameAr: 'البريمي',
    nameEn: 'Al Buraimi',
    wilayats: [
      { nameAr: 'البريمي', nameEn: 'Al Buraimi' },
      { nameAr: 'محضة', nameEn: 'Mahdah' },
      { nameAr: 'السنينة', nameEn: 'As Sunainah' },
    ],
  },
  {
    nameAr: 'الظاهرة',
    nameEn: 'Ad Dhahirah',
    wilayats: [
      { nameAr: 'عبري', nameEn: 'Ibri' },
      { nameAr: 'ينقل', nameEn: 'Yanqul' },
      { nameAr: 'ضنك', nameEn: 'Dhank' },
    ],
  },
  {
    nameAr: 'مسندم',
    nameEn: 'Musandam',
    wilayats: [
      { nameAr: 'خصب', nameEn: 'Khasab' },
      { nameAr: 'بخا', nameEn: 'Bukha' },
      { nameAr: 'دبا', nameEn: 'Dibba' },
      { nameAr: 'مدحاء', nameEn: 'Madha' },
    ],
  },
];

// ─── Component ──────────────────────────────────────────────

export const ShippingAddressForm: React.FC<ShippingAddressFormProps> = ({
  locale = 'ar',
  initialData,
  savedAddresses = [],
  onAddressChange,
  onSaveAddress,
  onDeleteAddress,
  validateZone,
}) => {
  const isRTL = locale === 'ar';
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [zoneValidation, setZoneValidation] = useState<{ zoneId: string; zoneName: string; covered: boolean } | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showMap, setShowMap] = useState(false);
  const [selectedSavedAddress, setSelectedSavedAddress] = useState<string>('');

  const [address, setAddress] = useState<AddressData>({
    fullName: '',
    phone: '',
    email: '',
    governorate: '',
    wilayat: '',
    district: '',
    street: '',
    building: '',
    apartment: '',
    floor: '',
    nearestLandmark: '',
    additionalInstructions: '',
    isDefault: false,
    isCovered: false,
    ...initialData,
  });

  // ── Computed wilayats based on governorate ───────

  const selectedGovernorate = OMANI_GOVERNORATES.find(
    (g) => g.nameAr === address.governorate || g.nameEn === address.governorate,
  );

  const wilayats = selectedGovernorate?.wilayats ?? [];

  // ── Validate zone on address change ──────────────

  const validateAddressZone = useCallback(async () => {
    if (!address.governorate || !address.wilayat || !validateZone) return;

    const fullAddress = `${address.building}, ${address.street}, ${address.district}, ${address.wilayat}, ${address.governorate}`;

    setLoading(true);
    try {
      const result = await validateZone(fullAddress);
      setZoneValidation(result);
      setAddress((prev) => ({
        ...prev,
        zoneId: result.zoneId,
        zoneName: result.zoneName,
        isCovered: result.covered,
      }));
    } catch (err) {
      setZoneValidation(null);
    } finally {
      setLoading(false);
    }
  }, [address.governorate, address.wilayat, address.district, address.street, address.building, validateZone]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (address.governorate && address.wilayat && address.street && address.building) {
        validateAddressZone();
      }
    }, 800);
    return () => clearTimeout(timer);
  }, [address.governorate, address.wilayat, address.street, address.building, address.district]);

  // ── Notify parent of changes ─────────────────────

  useEffect(() => {
    const isValid = Boolean(
      address.fullName &&
      address.phone &&
      address.governorate &&
      address.wilayat &&
      address.street &&
      address.building &&
      address.isCovered,
    );
    onAddressChange?.(address, isValid);
  }, [address]);

  // ── Handlers ─────────────────────────────────────

  const handleFieldChange = (field: keyof AddressData, value: string | boolean | number) => {
    setAddress((prev) => ({
      ...prev,
      [field]: value,
      ...(field === 'governorate' ? { wilayat: '' } : {}),
    }));
    // Clear error for this field
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const handleSavedAddressSelect = (savedId: string) => {
    const saved = savedAddresses.find((a) => a.id === savedId);
    if (!saved) return;

    setSelectedSavedAddress(savedId);
    setAddress({
      ...address,
      id: saved.id,
      label: saved.label,
      fullName: saved.fullName,
      phone: saved.phone,
      zoneId: saved.zoneId,
      zoneName: saved.zoneName,
      latitude: saved.latitude,
      longitude: saved.longitude,
      isCovered: true,
    });
  };

  const handleSaveForLater = async () => {
    if (!onSaveAddress) return;
    setLoading(true);
    try {
      await onSaveAddress(address);
    } finally {
      setLoading(false);
    }
  };

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      setErrors((prev) => ({ ...prev, location: isRTL ? 'الموقع غير مدعوم' : 'Geolocation not supported' }));
      return;
    }

    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setAddress((prev) => ({
          ...prev,
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        }));
        setLoading(false);
      },
      () => {
        setErrors((prev) => ({ ...prev, location: isRTL ? 'تعذر الحصول على الموقع' : 'Failed to get location' }));
        setLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  const steps = [
    isRTL ? 'المحافظة والولاية' : 'Governorate & Wilayat',
    isRTL ? 'تفاصيل العنوان' : 'Address Details',
    isRTL ? 'الموقع على الخريطة' : 'Map Location',
  ];

  // ── Render ───────────────────────────────────────

  return (
    <Box sx={{ maxWidth: 700 }}>
      <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
        {isRTL ? 'عنوان التوصيل' : 'Delivery Address'}
      </Typography>

      {/* Saved Addresses */}
      {savedAddresses.length > 0 && (
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
            {isRTL ? 'العناوين المحفوظة' : 'Saved Addresses'}
          </Typography>
          <Grid container spacing={1}>
            {savedAddresses.map((saved) => (
              <Grid item key={saved.id}>
                <Chip
                  label={saved.label}
                  onClick={() => handleSavedAddressSelect(saved.id)}
                  onDelete={onDeleteAddress ? () => onDeleteAddress(saved.id) : undefined}
                  color={selectedSavedAddress === saved.id ? 'primary' : 'default'}
                  variant={selectedSavedAddress === saved.id ? 'filled' : 'outlined'}
                  icon={saved.isDefault ? <CheckIcon /> : undefined}
                  sx={{ cursor: 'pointer' }}
                />
              </Grid>
            ))}
          </Grid>
        </Box>
      )}

      {/* Stepper */}
      <Stepper activeStep={activeStep} sx={{ mb: 3 }} alternativeLabel>
        {steps.map((label, idx) => (
          <Step key={label} completed={idx < activeStep}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>

      <Paper elevation={2} sx={{ p: 3, borderRadius: 3 }}>
        {/* Contact Info */}
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              required
              label={isRTL ? 'الاسم الكامل' : 'Full Name'}
              value={address.fullName}
              onChange={(e) => handleFieldChange('fullName', e.target.value)}
              error={!!errors.fullName}
              helperText={errors.fullName}
              placeholder={isRTL ? 'مثال: أحمد محمد' : 'e.g., Ahmed Mohammed'}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              required
              label={isRTL ? 'رقم الهاتف' : 'Phone Number'}
              value={address.phone}
              onChange={(e) => handleFieldChange('phone', e.target.value)}
              error={!!errors.phone}
              helperText={errors.phone}
              placeholder="+968 9XXX XXXX"
              inputProps={{ dir: 'ltr' }}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label={isRTL ? 'البريد الإلكتروني (اختياري)' : 'Email (optional)'}
              value={address.email}
              onChange={(e) => handleFieldChange('email', e.target.value)}
              type="email"
              placeholder="name@example.com"
              inputProps={{ dir: 'ltr' }}
            />
          </Grid>
        </Grid>

        <Divider sx={{ my: 2 }} />

        {/* Governorate & Wilayat */}
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <Autocomplete
              options={OMANI_GOVERNORATES}
              getOptionLabel={(opt) => (isRTL ? opt.nameAr : opt.nameEn)}
              value={selectedGovernorate ?? null}
              onChange={(_, value) => handleFieldChange('governorate', value ? (isRTL ? value.nameAr : value.nameEn) : '')}
              renderInput={(params) => (
                <TextField
                  {...params}
                  required
                  label={isRTL ? 'المحافظة' : 'Governorate'}
                  error={!!errors.governorate}
                  helperText={errors.governorate}
                />
              )}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <Autocomplete
              options={wilayats}
              getOptionLabel={(opt) => (isRTL ? opt.nameAr : opt.nameEn)}
              value={wilayats.find((w) => w.nameAr === address.wilayat || w.nameEn === address.wilayat) ?? null}
              onChange={(_, value) => handleFieldChange('wilayat', value ? (isRTL ? value.nameAr : value.nameEn) : '')}
              disabled={!selectedGovernorate}
              renderInput={(params) => (
                <TextField
                  {...params}
                  required
                  label={isRTL ? 'الولاية' : 'Wilayat'}
                  error={!!errors.wilayat}
                  helperText={errors.wilayat}
                />
              )}
            />
          </Grid>
        </Grid>

        <Divider sx={{ my: 2 }} />

        {/* Address Details */}
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <TextField
              fullWidth
              required
              label={isRTL ? 'المنطقة / الحي' : 'District / Area'}
              value={address.district}
              onChange={(e) => handleFieldChange('district', e.target.value)}
              error={!!errors.district}
              placeholder={isRTL ? 'مثال: الخوير' : 'e.g., Al Khuwair'}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              required
              label={isRTL ? 'الشارع' : 'Street'}
              value={address.street}
              onChange={(e) => handleFieldChange('street', e.target.value)}
              error={!!errors.street}
              placeholder={isRTL ? 'مثال: شارع السلطان قابوس' : 'e.g., Sultan Qaboos Street'}
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              required
              label={isRTL ? 'رقم المبنى' : 'Building No.'}
              value={address.building}
              onChange={(e) => handleFieldChange('building', e.target.value)}
              error={!!errors.building}
              placeholder={isRTL ? 'مثال: 123' : 'e.g., 123'}
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              label={isRTL ? 'الطابق' : 'Floor'}
              value={address.floor}
              onChange={(e) => handleFieldChange('floor', e.target.value)}
              placeholder={isRTL ? 'مثال: 2' : 'e.g., 2'}
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              label={isRTL ? 'الشقة' : 'Apartment'}
              value={address.apartment}
              onChange={(e) => handleFieldChange('apartment', e.target.value)}
              placeholder={isRTL ? 'مثال: 5B' : 'e.g., 5B'}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label={isRTL ? 'أقرب معلم (اختياري)' : 'Nearest Landmark (optional)'}
              value={address.nearestLandmark}
              onChange={(e) => handleFieldChange('nearestLandmark', e.target.value)}
              placeholder={isRTL ? 'مثال: بجانب جامع السلطان قابوس' : 'e.g., Near Sultan Qaboos Mosque'}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              multiline
              rows={2}
              label={isRTL ? 'تعليمات إضافية (اختياري)' : 'Additional Instructions (optional)'}
              value={address.additionalInstructions}
              onChange={(e) => handleFieldChange('additionalInstructions', e.target.value)}
              placeholder={isRTL ? 'مثال: اتصل قبل الوصول' : 'e.g., Call before arrival'}
            />
          </Grid>
        </Grid>

        <Divider sx={{ my: 2 }} />

        {/* GPS Location */}
        <Box sx={{ mb: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
            <Typography variant="subtitle2">
              <LocationIcon sx={{ fontSize: 16, mr: 0.5, verticalAlign: 'middle' }} />
              {isRTL ? 'الموقع على الخريطة' : 'Map Location'}
            </Typography>
            <Button
              size="small"
              variant="outlined"
              startIcon={loading ? <CircularProgress size={16} /> : <GPSIcon />}
              onClick={handleUseCurrentLocation}
              disabled={loading}
            >
              {isRTL ? 'استخدام موقعي' : 'Use my location'}
            </Button>
          </Box>

          {/* Map placeholder */}
          <Box
            sx={{
              height: 200,
              bgcolor: 'grey.100',
              borderRadius: 2,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexDirection: 'column',
              gap: 1,
              border: '1px dashed',
              borderColor: 'grey.300',
              position: 'relative',
            }}
          >
            {address.latitude && address.longitude ? (
              <>
                <CheckIcon color="success" sx={{ fontSize: 32 }} />
                <Typography variant="body2" color="success.main" sx={{ fontWeight: 600 }}>
                  {isRTL ? 'تم تحديد الموقع' : 'Location set'}
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ fontFamily: 'monospace' }}>
                  {address.latitude.toFixed(6)}, {address.longitude.toFixed(6)}
                </Typography>
              </>
            ) : (
              <>
                <MapIcon sx={{ fontSize: 40, color: 'grey.400' }} />
                <Typography variant="body2" color="text.secondary">
                  {isRTL ? 'اضغط "استخدام موقعي" لتحديد موقعك' : 'Click "Use my location" to pin your address'}
                </Typography>
              </>
            )}
          </Box>

          {errors.location && (
            <Alert severity="error" sx={{ mt: 1 }}>
              {errors.location}
            </Alert>
          )}
        </Box>

        {/* Zone Validation Result */}
        {zoneValidation && (
          <Fade in={!!zoneValidation}>
            <Alert
              severity={zoneValidation.covered ? 'success' : 'warning'}
              sx={{ mb: 2, borderRadius: 2 }}
              icon={zoneValidation.covered ? <CheckIcon /> : <ErrorIcon />}
            >
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                {zoneValidation.covered
                  ? (isRTL ? `✓ نحن نغطي منطقتك (${zoneValidation.zoneName})` : `✓ We cover your area (${zoneValidation.zoneName})`)
                  : (isRTL ? `⚠ المنطقة ${zoneValidation.zoneName} غير مغطاة حالياً` : `⚠ Area ${zoneValidation.zoneName} is not currently covered`)}
              </Typography>
            </Alert>
          </Fade>
        )}

        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 1 }}>
            <CircularProgress size={24} />
          </Box>
        )}

        {/* Save for Later */}
        {onSaveAddress && (
          <Box sx={{ mt: 2 }}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={address.isDefault ?? false}
                  onChange={(e) => handleFieldChange('isDefault', e.target.checked)}
                />
              }
              label={isRTL ? 'تعيين كعنوان افتراضي' : 'Set as default address'}
            />
          </Box>
        )}

        <Divider sx={{ my: 2 }} />

        {/* Address Summary */}
        <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 2 }}>
          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
            {isRTL ? 'ملخص العنوان' : 'Address Summary'}
          </Typography>
          <Typography variant="body2">
            {address.fullName} {address.phone && `| ${address.phone}`}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {address.building && `${address.building}, `}
            {address.street}
            {address.floor && `, ${isRTL ? 'الطابق' : 'Floor'} ${address.floor}`}
            {address.apartment && `, ${isRTL ? 'شقة' : 'Apt'} ${address.apartment}`}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {address.district}, {address.wilayat}, {address.governorate}
          </Typography>
          {address.nearestLandmark && (
            <Typography variant="caption" color="text.secondary">
              <LocationIcon sx={{ fontSize: 12, verticalAlign: 'middle' }} />
              {' '}
              {address.nearestLandmark}
            </Typography>
          )}
        </Box>
      </Paper>
    </Box>
  );
};

export default ShippingAddressForm;
