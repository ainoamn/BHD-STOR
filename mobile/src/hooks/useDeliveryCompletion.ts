import { useState, useCallback } from 'react';
import { driverService } from '../services/driver.service';
import { useCompleteDelivery as useCompleteDeliveryMutation } from './useDriverShipments';
import type { DeliveryCompletionData } from '../types/driver.types';

export function useOtpVerification(shipmentId: string) {
  const [otp, setOtp] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [attempts, setAttempts] = useState(0);

  const verifyOtp = useCallback(async () => {
    if (otp.length !== 4) {
      setError('Please enter 4-digit OTP');
      return false;
    }

    setIsVerifying(true);
    setError(null);

    try {
      const result = await driverService.verifyOtp(shipmentId, otp);
      if (result.valid) {
        setIsVerified(true);
        return true;
      } else {
        setAttempts(prev => prev + 1);
        setError(`Invalid OTP. ${3 - attempts - 1} attempts remaining.`);
        return false;
      }
    } catch (err) {
      setError('Failed to verify OTP. Please try again.');
      return false;
    } finally {
      setIsVerifying(false);
    }
  }, [otp, shipmentId, attempts]);

  const reset = useCallback(() => {
    setOtp('');
    setIsVerified(false);
    setError(null);
    setAttempts(0);
  }, []);

  return {
    otp,
    setOtp,
    isVerifying,
    isVerified,
    error,
    attempts,
    verifyOtp,
    reset,
  };
}

export function useSignatureCapture() {
  const [signature, setSignature] = useState<string | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);

  const saveSignature = useCallback((base64Image: string) => {
    setSignature(base64Image);
    setIsCapturing(false);
  }, []);

  const clearSignature = useCallback(() => {
    setSignature(null);
  }, []);

  const startCapture = useCallback(() => {
    setIsCapturing(true);
  }, []);

  return {
    signature,
    isCapturing,
    saveSignature,
    clearSignature,
    startCapture,
  };
}

export function usePhotoCapture() {
  const [photo, setPhoto] = useState<string | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);

  const takePhoto = useCallback((base64Image: string) => {
    setPhoto(base64Image);
    setIsCapturing(false);
  }, []);

  const retakePhoto = useCallback(() => {
    setPhoto(null);
  }, []);

  const startCapture = useCallback(() => {
    setIsCapturing(true);
  }, []);

  return {
    photo,
    isCapturing,
    takePhoto,
    retakePhoto,
    startCapture,
  };
}

export function useDeliveryCompletionFlow(shipmentId: string) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const otp = useOtpVerification(shipmentId);
  const signature = useSignatureCapture();
  const photo = usePhotoCapture();
  const { completeDeliveryAsync } = useCompleteDeliveryMutation();

  const steps = [
    { key: 'otp', label: 'OTP Verification', completed: otp.isVerified },
    { key: 'signature', label: 'Signature', completed: !!signature.signature },
    { key: 'photo', label: 'Photo Proof', completed: !!photo.photo },
    { key: 'confirm', label: 'Confirm', completed: isSuccess },
  ];

  const goToStep = useCallback((step: number) => {
    // Only allow going to completed steps or the next step
    if (step <= currentStep + 1) {
      setCurrentStep(step);
    }
  }, [currentStep]);

  const nextStep = useCallback(() => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    }
  }, [currentStep, steps.length]);

  const prevStep = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  }, [currentStep]);

  const canProceed = useCallback(() => {
    switch (currentStep) {
      case 0:
        return otp.isVerified;
      case 1:
        return !!signature.signature;
      case 2:
        return !!photo.photo;
      default:
        return true;
    }
  }, [currentStep, otp.isVerified, signature.signature, photo.photo]);

  const submitDelivery = useCallback(async () => {
    if (!otp.isVerified || !signature.signature || !photo.photo) {
      setSubmitError('Please complete all steps before submitting.');
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const completionData: DeliveryCompletionData = {
        otp: otp.otp,
        signature: signature.signature,
        photo: photo.photo,
      };

      await completeDeliveryAsync({ id: shipmentId, data: completionData });
      setIsSuccess(true);
      setCurrentStep(3); // Go to success step
    } catch (err) {
      setSubmitError('Failed to complete delivery. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }, [otp, signature, photo, shipmentId, completeDeliveryAsync]);

  const reset = useCallback(() => {
    setCurrentStep(0);
    setIsSubmitting(false);
    setSubmitError(null);
    setIsSuccess(false);
    otp.reset();
    signature.clearSignature();
    photo.retakePhoto();
  }, [otp, signature, photo]);

  return {
    currentStep,
    steps,
    goToStep,
    nextStep,
    prevStep,
    canProceed: canProceed(),
    submitDelivery,
    isSubmitting,
    submitError,
    isSuccess,
    reset,
    otp,
    signature,
    photo,
  };
}
