/**
 * ShippingSelector Component
 * ==========================
 * Shipping method selector at checkout showing delivery options
 * with pricing, estimated dates, and coverage map.
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormControl,
  Chip,
  Divider,
  Skeleton,
  Alert,
  Fade,
  Tooltip,
  IconButton,
  Grid,
} from '@mui/material';
import {
  LocalShipping as StandardIcon,
  Bolt as ExpressIcon,
  FlashOn as SameDayIcon,
  CalendarToday as CalendarIcon,
  AccessTime as TimeIcon,
  CheckCircle as CheckIcon,
  Info as InfoIcon,
  Map as MapIcon,
  ErrorOutline as ErrorIcon,
} from '@mui/icons-material';
import { trackingService } from '../../services/tracking.service';

// ─── Types ──────────────────────────────────────────────────

export interface ShippingOption {
  id: string;
  serviceType: 'standard' | 'express' | 'same_day' | 'next_day' | 'economy';
  nameAr: string;
  nameEn: string;
  descriptionAr: string;
  descriptionEn: string;
  basePrice: number;
  weightCharge: number;
  distanceCharge: number;
  total: number;
  currency: string;
  estimatedHours: number;
  estimatedDelivery: string;
  available: boolean;
  unavailableReason?: string;
  icon: 'standard' | 'express' | 'same_day' | 'next_day' | 'economy';
}

export interface ShippingSelectorProps {
  senderZoneId: string;
  recipientZoneId: string;
  weightKg: number;
  dimensionsCm?: { length: number; width: number; height: number };
  declaredValue?: number;
  isFragile?: boolean;
  isInsured?: boolean;
  locale?: 'ar' | 'en';
  onSelectionChange?: (option: ShippingOption | null) => void;
  defaultSelected?: string;
  codAmount?: number;
}

// ─── Service Type Config ────────────────────────────────────

const SERVICE_CONFIG: Record<string, {
  icon: React.ReactNode;
  color: string;
  bgColor: string;
  badgeColor: 'success' | 'warning' | 'info' | 'default';
}> = {
  standard: {
    icon: <StandardIcon sx={{ fontSize: 32 }} />,
    color: '#1976d2',
    bgColor: '#e3f2fd',
    badgeColor: 'info',
  },
  express: {
    icon: <ExpressIcon sx={{ fontSize: 32 }} />,
    color: '#ed6c02',
    bgColor: '#fff3e0',
    badgeColor: 'warning',
  },
  same_day: {
    icon: <SameDayIcon sx={{ fontSize: 32 }} />,
    color: '#2e7d32',
    bgColor: '#e8f5e9',
    badgeColor: 'success',
  },
  next_day: {
    icon: <CalendarIcon sx={{ fontSize: 32 }} />,
    color: '#9c27b0',
    bgColor: '#f3e5f5',
    badgeColor: 'default',
  },
  economy: {
    icon: <StandardIcon sx={{ fontSize: 32 }} />,
    color: '#757575',
    bgColor: '#f5f5f5',
    badgeColor: 'default',
  },
};

// ─── Component ──────────────────────────────────────────────

export const ShippingSelector: React.FC<ShippingSelectorProps> = ({
  senderZoneId,
  recipientZoneId,
  weightKg,
  dimensionsCm,
  declaredValue = 0,
  isFragile = false,
  isInsured = false,
  locale = 'ar',
  onSelectionChange,
  defaultSelected,
  codAmount,
}) => {
  const [options, setOptions] = useState<ShippingOption[]>([]);
  const [selected, setSelected] = useState<string>(defaultSelected ?? '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showMap, setShowMap] = useState(false);

  const isRTL = locale === 'ar';

  // ── Fetch shipping quotes ────────────────────────

  useEffect(() => {
    if (!senderZoneId || !recipientZoneId || weightKg <= 0) {
      setOptions([]);
      return;
    }

    const fetchQuotes = async () => {
      setLoading(true);
      setError(null);

      try {
        const serviceTypes: ShippingOption['serviceType'][] = ['standard', 'express', 'same_day'];
        const quotes = await Promise.all(
          serviceTypes.map(async (serviceType) => {
            try {
              const quote = await trackingService.getDeliveryEstimate({
                senderZoneId,
                recipientZoneId,
                weightKg,
                dimensionsCm,
                serviceType,
                declaredValue,
                isFragile,
                isInsured,
              });
              return quote;
            } catch (err) {
              return null;
            }
          }),
        );

        const validQuotes = quotes.filter((q): q is ShippingOption => q !== null);
        setOptions(validQuotes);

        // Auto-select first available if none selected
        if (!selected && validQuotes.length > 0) {
          const firstAvailable = validQuotes.find((q) => q.available);
          if (firstAvailable) {
            setSelected(firstAvailable.id);
            onSelectionChange?.(firstAvailable);
          }
        }
      } catch (err: any) {
        setError(err.message ?? 'Failed to fetch shipping quotes');
      } finally {
        setLoading(false);
      }
    };

    fetchQuotes();
  }, [senderZoneId, recipientZoneId, weightKg]);

  // ── Handlers ─────────────────────────────────────

  const handleSelectionChange = (value: string) => {
    setSelected(value);
    const option = options.find((o) => o.id === value) ?? null;
    onSelectionChange?.(option);
  };

  const formatPrice = (amount: number, currency: string): string => {
    return `${amount.toFixed(3)} ${currency}`;
  };

  const formatDeliveryDate = (dateStr: string): string => {
    const date = new Date(dateStr);
    return date.toLocaleDateString(isRTL ? 'ar-OM' : 'en-GB', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatDeliveryTime = (hours: number): string => {
    if (hours <= 8) return isRTL ? `${hours} ساعات` : `${hours} hours`;
    if (hours <= 48) return isRTL ? `${Math.round(hours / 24)} يوم` : `${Math.round(hours / 24)} days`;
    return isRTL ? `${Math.round(hours / 24)} يوم` : `${Math.round(hours / 24)} days`;
  };

  // ── Loading State ────────────────────────────────

  if (loading) {
    return (
      <Box sx={{ maxWidth: 600 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>
          {isRTL ? 'خيارات التوصيل' : 'Delivery Options'}
        </Typography>
        {[1, 2, 3].map((i) => (
          <Card key={i} sx={{ mb: 2, borderRadius: 3 }}>
            <CardContent>
              <Skeleton variant="rectangular" height={60} />
              <Skeleton variant="text" width="60%" sx={{ mt: 1 }} />
              <Skeleton variant="text" width="40%" />
            </CardContent>
          </Card>
        ))}
      </Box>
    );
  }

  // ── Error State ──────────────────────────────────

  if (error) {
    return (
      <Alert severity="error" sx={{ borderRadius: 2, maxWidth: 600 }}>
        {isRTL ? 'حدث خطأ أثناء جلب أسعار الشحن. يرجى المحاولة مرة أخرى.' : error}
      </Alert>
    );
  }

  // ── Empty State ──────────────────────────────────

  if (options.length === 0) {
    return (
      <Alert severity="info" sx={{ borderRadius: 2, maxWidth: 600 }}>
        {isRTL
          ? 'يرجى إدخال عنوان التوصيل لعرض خيارات الشحن المتاحة'
          : 'Please enter a delivery address to see available shipping options'}
      </Alert>
    );
  }

  // ── Render ───────────────────────────────────────

  return (
    <Box sx={{ maxWidth: 600 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6" sx={{ fontWeight: 600 }}>
          {isRTL ? 'اختر طريقة التوصيل' : 'Select Delivery Method'}
        </Typography>
        <Tooltip title={isRTL ? 'عرض الخريطة' : 'Show map'}>
          <IconButton size="small" onClick={() => setShowMap(!showMap)} color={showMap ? 'primary' : 'default'}>
            <MapIcon />
          </IconButton>
        </Tooltip>
      </Box>

      {/* Coverage Map placeholder */}
      {showMap && (
        <Fade in={showMap}>
          <Card sx={{ mb: 3, borderRadius: 3, overflow: 'hidden' }}>
            <Box
              sx={{
                height: 200,
                bgcolor: 'grey.100',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexDirection: 'column',
                gap: 1,
              }}
            >
              <MapIcon sx={{ fontSize: 48, color: 'grey.400' }} />
              <Typography variant="body2" color="text.secondary">
                {isRTL ? 'خريطة تغطية التوصيل' : 'Delivery Coverage Map'}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {senderZoneId} → {recipientZoneId}
              </Typography>
            </Box>
          </Card>
        </Fade>
      )}

      <FormControl component="fieldset" fullWidth>
        <RadioGroup value={selected} onChange={(e) => handleSelectionChange(e.target.value)}>
          {options.map((option) => {
            const config = SERVICE_CONFIG[option.serviceType] ?? SERVICE_CONFIG.standard;
            const isSelected = selected === option.id;

            return (
              <Card
                key={option.id}
                sx={{
                  mb: 2,
                  borderRadius: 3,
                  border: isSelected ? 2 : 1,
                  borderColor: isSelected ? 'primary.main' : 'divider',
                  bgcolor: isSelected ? 'primary.50' : 'background.paper',
                  transition: 'all 0.2s ease',
                  cursor: 'pointer',
                  opacity: option.available ? 1 : 0.6,
                  '&:hover': {
                    borderColor: option.available ? 'primary.main' : 'divider',
                    boxShadow: option.available ? 2 : 0,
                  },
                }}
                onClick={() => option.available && handleSelectionChange(option.id)}
              >
                <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                  <FormControlLabel
                    value={option.id}
                    disabled={!option.available}
                    control={
                      <Radio
                        checked={isSelected}
                        sx={{
                          color: config.color,
                          '&.Mui-checked': { color: config.color },
                        }}
                      />
                    }
                    label={
                      <Box sx={{ ml: 1, flex: 1 }}>
                        {/* Header row */}
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 1 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                            <Box
                              sx={{
                                p: 1,
                                borderRadius: 2,
                                bgcolor: config.bgColor,
                                color: config.color,
                                display: 'flex',
                              }}
                            >
                              {config.icon}
                            </Box>
                            <Box>
                              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                                {isRTL ? option.nameAr : option.nameEn}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {isRTL ? option.descriptionAr : option.descriptionEn}
                              </Typography>
                            </Box>
                          </Box>

                          <Box sx={{ textAlign: isRTL ? 'left' : 'right' }}>
                            <Typography variant="h6" sx={{ fontWeight: 700, color: config.color }}>
                              {formatPrice(option.total, option.currency)}
                            </Typography>
                            {codAmount !== undefined && codAmount > 0 && (
                              <Typography variant="caption" color="text.secondary">
                                {isRTL ? 'الدفع عند الاستلام متاح' : 'COD available'}
                              </Typography>
                            )}
                          </Box>
                        </Box>

                        {/* Details row */}
                        <Box sx={{ display: 'flex', gap: 2, mt: 1.5, flexWrap: 'wrap' }}>
                          <Chip
                            size="small"
                            icon={<TimeIcon sx={{ fontSize: 14 }} />}
                            label={formatDeliveryTime(option.estimatedHours)}
                            color={config.badgeColor}
                            variant="outlined"
                          />
                          <Chip
                            size="small"
                            icon={<CalendarIcon sx={{ fontSize: 14 }} />}
                            label={formatDeliveryDate(option.estimatedDelivery)}
                            color="default"
                            variant="outlined"
                          />
                          {isSelected && (
                            <Chip
                              size="small"
                              icon={<CheckIcon sx={{ fontSize: 14 }} />}
                              label={isRTL ? 'مختار' : 'Selected'}
                              color="primary"
                              sx={{ fontWeight: 600 }}
                            />
                          )}
                        </Box>

                        {/* Price breakdown */}
                        {isSelected && (
                          <Fade in={isSelected}>
                            <Box sx={{ mt: 1.5, p: 1.5, bgcolor: 'background.paper', borderRadius: 2 }}>
                              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                                {isRTL ? 'تفاصيل السعر' : 'Price Breakdown'}
                              </Typography>
                              <Grid container spacing={1}>
                                <Grid item xs={6}>
                                  <Typography variant="caption" color="text.secondary">
                                    {isRTL ? 'السعر الأساسي' : 'Base Price'}
                                  </Typography>
                                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                    {formatPrice(option.basePrice, option.currency)}
                                  </Typography>
                                </Grid>
                                <Grid item xs={6}>
                                  <Typography variant="caption" color="text.secondary">
                                    {isRTL ? 'رسوم الوزن' : 'Weight Charge'}
                                  </Typography>
                                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                    {formatPrice(option.weightCharge, option.currency)}
                                  </Typography>
                                </Grid>
                                {option.distanceCharge > 0 && (
                                  <Grid item xs={6}>
                                    <Typography variant="caption" color="text.secondary">
                                      {isRTL ? 'رسوم المسافة' : 'Distance Charge'}
                                    </Typography>
                                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                      {formatPrice(option.distanceCharge, option.currency)}
                                    </Typography>
                                  </Grid>
                                )}
                              </Grid>
                              <Divider sx={{ my: 1 }} />
                              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                  {isRTL ? 'الإجمالي' : 'Total'}
                                </Typography>
                                <Typography variant="body1" sx={{ fontWeight: 700, color: 'primary.main' }}>
                                  {formatPrice(option.total, option.currency)}
                                </Typography>
                              </Box>
                            </Box>
                          </Fade>
                        )}

                        {/* Unavailable reason */}
                        {!option.available && option.unavailableReason && (
                          <Alert severity="warning" sx={{ mt: 1, borderRadius: 1 }} icon={<ErrorIcon />}>
                            <Typography variant="caption">
                              {option.unavailableReason}
                            </Typography>
                          </Alert>
                        )}
                      </Box>
                    }
                    sx={{
                      alignItems: 'flex-start',
                      mx: 0,
                      width: '100%',
                      '.MuiFormControlLabel-label': { width: '100%' },
                    }}
                  />
                </CardContent>
              </Card>
            );
          })}
        </RadioGroup>
      </FormControl>
    </Box>
  );
};

export default ShippingSelector;
