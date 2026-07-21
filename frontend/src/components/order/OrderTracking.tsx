/**
 * OrderTracking Component
 * =======================
 * Customer-facing order tracking with timeline visualization,
 * current location on map, and estimated delivery.
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Paper,
  Chip,
  Divider,
  CircularProgress,
  Alert,
  Grid,
  IconButton,
  Tooltip,
  Fade,
} from '@mui/material';
import {
  Search as SearchIcon,
  LocalShipping as ShippingIcon,
  CheckCircle as CheckCircleIcon,
  Schedule as ScheduleIcon,
  LocationOn as LocationIcon,
  Person as PersonIcon,
  Phone as PhoneIcon,
  Refresh as RefreshIcon,
  ArrowForward as ArrowIcon,
} from '@mui/icons-material';

import { useTrackByTrackingNumber } from '../../hooks/useOrderTracking';
import { trackingService } from '../../services/tracking.service';

// ─── Types ──────────────────────────────────────────────────

export interface TrackingTimelineEvent {
  timestamp: string;
  status: string;
  labelAr: string;
  labelEn: string;
  location: string;
  note: string | null;
}

export interface TrackingData {
  trackingNumber: string;
  status: string;
  statusLabelAr: string;
  statusLabelEn: string;
  serviceType: string;
  estimatedDelivery: string | null;
  actualDelivery: string | null;
  sender: { name: string; address: string };
  recipient: { name: string; address: string };
  timeline: TrackingTimelineEvent[];
  currentLocation: { lat: number; lng: number } | null;
  driver: { name: string; phone: string; rating: number } | null;
}

// ─── Status Configuration ───────────────────────────────────

const STATUS_CONFIG: Record<string, { color: 'success' | 'info' | 'warning' | 'error' | 'default'; icon: React.ReactNode; ar: string; en: string }> = {
  draft: { color: 'default', icon: <ScheduleIcon />, ar: 'مسودة', en: 'Draft' },
  pending: { color: 'warning', icon: <ScheduleIcon />, ar: 'معلق', en: 'Pending' },
  confirmed: { color: 'info', icon: <CheckCircleIcon />, ar: 'مؤكد', en: 'Confirmed' },
  picked_up: { color: 'info', icon: <ShippingIcon />, ar: 'تم الاستلام', en: 'Picked Up' },
  in_transit: { color: 'info', icon: <ShippingIcon />, ar: 'في الطريق', en: 'In Transit' },
  at_hub: { color: 'warning', icon: <ShippingIcon />, ar: 'في المركز', en: 'At Hub' },
  out_for_delivery: { color: 'warning', icon: <ShippingIcon />, ar: 'خارج للتوصيل', en: 'Out for Delivery' },
  delivered: { color: 'success', icon: <CheckCircleIcon />, ar: 'تم التوصيل', en: 'Delivered' },
  failed_delivery: { color: 'error', icon: <ScheduleIcon />, ar: 'فشل التوصيل', en: 'Failed' },
  returned: { color: 'error', icon: <ShippingIcon />, ar: 'مُعاد', en: 'Returned' },
  cancelled: { color: 'error', icon: <ScheduleIcon />, ar: 'ملغي', en: 'Cancelled' },
  on_hold: { color: 'warning', icon: <ScheduleIcon />, ar: 'في الانتظار', en: 'On Hold' },
};

const STEP_ORDER = [
  'confirmed',
  'picked_up',
  'in_transit',
  'at_hub',
  'out_for_delivery',
  'delivered',
];

// ─── Component ──────────────────────────────────────────────

interface OrderTrackingProps {
  initialTrackingNumber?: string;
  orderId?: string;
  locale?: 'ar' | 'en';
}

export const OrderTracking: React.FC<OrderTrackingProps> = ({
  initialTrackingNumber = '',
  orderId,
  locale = 'ar',
}) => {
  const [trackingNumber, setTrackingNumber] = useState(initialTrackingNumber);
  const [searchInput, setSearchInput] = useState(initialTrackingNumber);
  const [activeSearch, setActiveSearch] = useState(initialTrackingNumber);

  const {
    data: trackingData,
    isLoading,
    error,
    refetch,
  } = useTrackByTrackingNumber(activeSearch);

  const isRTL = locale === 'ar';

  // ── Helpers ──────────────────────────────────────

  const getActiveStep = useCallback((status: string): number => {
    const idx = STEP_ORDER.indexOf(status);
    return idx >= 0 ? idx : 0;
  }, []);

  const getStatusChip = (status: string) => {
    const config = STATUS_CONFIG[status] ?? STATUS_CONFIG.pending;
    return (
      <Chip
        icon={config.icon}
        label={isRTL ? config.ar : config.en}
        color={config.color}
        size="medium"
        sx={{ fontWeight: 600, fontSize: '0.95rem', px: 1 }}
      />
    );
  };

  const formatDate = (dateStr: string | null): string => {
    if (!dateStr) return isRTL ? 'غير محدد' : 'Not specified';
    const date = new Date(dateStr);
    return date.toLocaleDateString(isRTL ? 'ar-OM' : 'en-GB', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // ── Render ───────────────────────────────────────

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto', p: 2 }}>
      {/* Header */}
      <Typography variant="h4" align="center" gutterBottom sx={{ fontWeight: 700, color: 'primary.main' }}>
        {isRTL ? 'تتبع الشحنة' : 'Track Your Shipment'}
      </Typography>
      <Typography variant="body1" align="center" color="text.secondary" sx={{ mb: 3 }}>
        {isRTL
          ? 'أدخل رقم التتبع لمعرفة حالة شحنتك'
          : 'Enter your tracking number to check shipment status'}
      </Typography>

      {/* Search Form */}
      <Paper elevation={2} sx={{ p: 3, mb: 3, borderRadius: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={8}>
            <TextField
              fullWidth
              label={isRTL ? 'رقم التتبع' : 'Tracking Number'}
              placeholder={isRTL ? 'مثال: BHD202412000123' : 'e.g., BHD202412000123'}
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && setActiveSearch(searchInput.trim())}
              InputProps={{
                startAdornment: <SearchIcon sx={{ mr: 1, color: 'action.active' }} />,
              }}
              variant="outlined"
              size="medium"
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <Button
              fullWidth
              variant="contained"
              size="large"
              onClick={() => setActiveSearch(searchInput.trim())}
              disabled={!searchInput.trim() || isLoading}
              startIcon={isLoading ? <CircularProgress size={20} /> : <SearchIcon />}
              sx={{ height: 56, borderRadius: 2 }}
            >
              {isRTL ? 'بحث' : 'Track'}
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Error */}
      {error && (
        <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
          {isRTL
            ? 'لم يتم العثور على شحنة بهذا الرقم. يرجى التحقق والمحاولة مرة أخرى.'
            : 'No shipment found with this number. Please check and try again.'}
        </Alert>
      )}

      {/* Loading */}
      {isLoading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
          <CircularProgress size={48} />
        </Box>
      )}

      {/* Tracking Results */}
      {trackingData && !isLoading && (
        <Fade in={!!trackingData}>
          <Box>
            {/* Status Header Card */}
            <Card sx={{ mb: 3, borderRadius: 3, overflow: 'visible' }}>
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 2 }}>
                  <Box>
                    <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>
                      {isRTL ? 'رقم التتبع' : 'Tracking Number'}
                    </Typography>
                    <Typography variant="h5" sx={{ fontWeight: 700, fontFamily: 'monospace', letterSpacing: 1 }}>
                      {trackingData.trackingNumber}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {getStatusChip(trackingData.status)}
                    <Tooltip title={isRTL ? 'تحديث' : 'Refresh'}>
                      <IconButton onClick={() => refetch()} size="small">
                        <RefreshIcon />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </Box>

                <Divider sx={{ my: 2 }} />

                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="caption" color="text.secondary">
                      {isRTL ? 'الخدمة' : 'Service'}
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                      {trackingData.serviceType === 'same_day'
                        ? isRTL ? 'نفس اليوم' : 'Same Day'
                        : trackingData.serviceType === 'express'
                        ? isRTL ? 'سريع' : 'Express'
                        : trackingData.serviceType === 'standard'
                        ? isRTL ? 'قياسي' : 'Standard'
                        : trackingData.serviceType}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="caption" color="text.secondary">
                      {isRTL ? 'تاريخ التوصيل المتوقع' : 'Estimated Delivery'}
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 500, color: 'primary.main' }}>
                      {formatDate(trackingData.estimatedDelivery)}
                    </Typography>
                  </Grid>
                </Grid>

                {trackingData.actualDelivery && (
                  <Box sx={{ mt: 2, p: 1.5, bgcolor: 'success.light', borderRadius: 2 }}>
                    <Typography variant="body2" sx={{ color: 'success.dark', fontWeight: 600 }}>
                      <CheckCircleIcon sx={{ fontSize: 16, mr: 0.5, verticalAlign: 'middle' }} />
                      {isRTL
                        ? `تم التوصيل في ${formatDate(trackingData.actualDelivery)}`
                        : `Delivered on ${formatDate(trackingData.actualDelivery)}`}
                    </Typography>
                  </Box>
                )}
              </CardContent>
            </Card>

            {/* Progress Stepper */}
            <Card sx={{ mb: 3, borderRadius: 3 }}>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                  {isRTL ? 'تقدم الشحنة' : 'Shipment Progress'}
                </Typography>
                <Stepper
                  activeStep={getActiveStep(trackingData.status)}
                  alternativeLabel={!isRTL}
                  orientation={isRTL ? 'horizontal' : 'horizontal'}
                  sx={{
                    '& .MuiStepLabel-label': {
                      fontSize: '0.8rem',
                      fontWeight: 500,
                    },
                  }}
                >
                  {STEP_ORDER.map((step, idx) => {
                    const config = STATUS_CONFIG[step];
                    const isCompleted = idx < getActiveStep(trackingData.status);
                    const isCurrent = idx === getActiveStep(trackingData.status);
                    return (
                      <Step key={step} completed={isCompleted} active={isCurrent}>
                        <StepLabel
                          StepIconProps={{
                            sx: {
                              color: isCompleted ? 'success.main' : isCurrent ? 'primary.main' : 'grey.400',
                            },
                          }}
                        >
                          {isRTL ? config?.ar : config?.en}
                        </StepLabel>
                      </Step>
                    );
                  })}
                </Stepper>
              </CardContent>
            </Card>

            {/* Sender / Recipient Info */}
            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid item xs={12} sm={6}>
                <Card sx={{ borderRadius: 3, height: '100%' }}>
                  <CardContent>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      {isRTL ? 'المرسل' : 'From'}
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 600 }}>
                      {trackingData.sender.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                      <LocationIcon sx={{ fontSize: 14, mr: 0.5, verticalAlign: 'middle' }} />
                      {trackingData.sender.address}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Card sx={{ borderRadius: 3, height: '100%' }}>
                  <CardContent>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      {isRTL ? 'المستلم' : 'To'}
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 600 }}>
                      <PersonIcon sx={{ fontSize: 16, mr: 0.5, verticalAlign: 'middle' }} />
                      {trackingData.recipient.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                      <LocationIcon sx={{ fontSize: 14, mr: 0.5, verticalAlign: 'middle' }} />
                      {trackingData.recipient.address}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            {/* Driver Info (if assigned) */}
            {trackingData.driver && (
              <Card sx={{ mb: 3, borderRadius: 3, bgcolor: 'info.light' }}>
                <CardContent>
                  <Typography variant="subtitle2" color="info.dark" gutterBottom>
                    {isRTL ? 'مندوب التوصيل' : 'Delivery Driver'}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <PersonIcon sx={{ color: 'info.dark' }} />
                      <Typography variant="body1" sx={{ fontWeight: 600, color: 'info.dark' }}>
                        {trackingData.driver.name}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <PhoneIcon sx={{ color: 'info.dark', fontSize: 18 }} />
                      <Typography variant="body2" sx={{ color: 'info.dark' }}>
                        {trackingData.driver.phone}
                      </Typography>
                    </Box>
                    <Chip
                      label={`${trackingData.driver.rating} ★`}
                      size="small"
                      sx={{ bgcolor: 'warning.light', color: 'warning.dark', fontWeight: 600 }}
                    />
                  </Box>
                </CardContent>
              </Card>
            )}

            {/* Timeline */}
            <Card sx={{ borderRadius: 3 }}>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                  {isRTL ? 'سجل الحركات' : 'Activity Timeline'}
                </Typography>
                <Box sx={{ position: 'relative' }}>
                  {trackingData.timeline.map((event, index) => (
                    <Box
                      key={index}
                      sx={{
                        display: 'flex',
                        gap: 2,
                        pb: index < trackingData.timeline.length - 1 ? 3 : 0,
                        position: 'relative',
                      }}
                    >
                      {/* Timeline dot and line */}
                      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <Box
                          sx={{
                            width: 12,
                            height: 12,
                            borderRadius: '50%',
                            bgcolor: index === 0 ? 'primary.main' : 'grey.400',
                            border: 2,
                            borderColor: 'background.paper',
                            boxShadow: 1,
                          }}
                        />
                        {index < trackingData.timeline.length - 1 && (
                          <Box
                            sx={{
                              width: 2,
                              flex: 1,
                              bgcolor: 'grey.300',
                              my: 0.5,
                            }}
                          />
                        )}
                      </Box>

                      {/* Event content */}
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="body2" sx={{ fontWeight: 600, color: index === 0 ? 'primary.main' : 'text.primary' }}>
                          {isRTL ? event.labelAr : event.labelEn}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {formatDate(event.timestamp)}
                        </Typography>
                        {event.location && (
                          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                            <LocationIcon sx={{ fontSize: 12, mr: 0.5, verticalAlign: 'middle' }} />
                            {event.location}
                          </Typography>
                        )}
                        {event.note && (
                          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5, fontStyle: 'italic' }}>
                            {event.note}
                          </Typography>
                        )}
                      </Box>
                    </Box>
                  ))}
                </Box>
              </CardContent>
            </Card>
          </Box>
        </Fade>
      )}
    </Box>
  );
};

export default OrderTracking;
