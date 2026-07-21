'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCreateReturn } from '@/hooks/useReturns';
import { ReturnType, ReturnReason, RefundMethod } from '@/services/returns.service';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import {
  ArrowLeft,
  RotateCcw,
  ArrowLeftRight,
  Upload,
  X,
  AlertTriangle,
  CheckCircle,
  Package,
  ImageIcon,
} from 'lucide-react';

const returnReasons: { value: ReturnReason; label: string; description: string }[] = [
  { value: ReturnReason.DEFECTIVE, label: 'Defective', description: 'Item is faulty or not working' },
  { value: ReturnReason.WRONG_ITEM, label: 'Wrong Item', description: 'Received a different item than ordered' },
  { value: ReturnReason.NOT_AS_DESCRIBED, label: 'Not as Described', description: 'Item does not match the description' },
  { value: ReturnReason.CHANGED_MIND, label: 'Changed Mind', description: 'No longer want the item' },
  { value: ReturnReason.DAMAGED, label: 'Damaged', description: 'Item was damaged during shipping' },
  { value: ReturnReason.OTHER, label: 'Other', description: 'Another reason not listed' },
];

const refundMethods: { value: RefundMethod; label: string }[] = [
  { value: RefundMethod.ORIGINAL_PAYMENT, label: 'Original Payment Method' },
  { value: RefundMethod.WALLET, label: 'Store Wallet' },
  { value: RefundMethod.BANK_TRANSFER, label: 'Bank Transfer' },
];

export default function CreateReturnPage() {
  const router = useRouter();
  const createReturn = useCreateReturn();

  const [step, setStep] = useState(1);
  const [type, setType] = useState<ReturnType>(ReturnType.RETURN);
  const [orderId, setOrderId] = useState('');
  const [productId, setProductId] = useState('');
  const [reason, setReason] = useState<ReturnReason | ''>('');
  const [description, setDescription] = useState('');
  const [refundMethod, setRefundMethod] = useState<RefundMethod>(RefundMethod.ORIGINAL_PAYMENT);
  const [images, setImages] = useState<string[]>([]);
  const [imageInput, setImageInput] = useState('');

  const isStep1Valid = type && orderId.length >= 3 && productId.length >= 3;
  const isStep2Valid = reason && description.length >= 10;

  const handleAddImage = () => {
    if (imageInput && !images.includes(imageInput)) {
      setImages([...images, imageInput]);
      setImageInput('');
    }
  };

  const handleRemoveImage = (idx: number) => {
    setImages(images.filter((_, i) => i !== idx));
  };

  const handleSubmit = async () => {
    try {
      await createReturn.mutateAsync({
        orderId,
        productId,
        type,
        reason: reason as ReturnReason,
        description,
        images: images.length > 0 ? images : undefined,
        refundMethod: type === ReturnType.RETURN ? refundMethod : undefined,
      });
      toast.success('Return request submitted successfully!');
      router.push('/returns');
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to submit return request');
    }
  };

  return (
    <div className="container mx-auto py-8 px-4 max-w-2xl">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button variant="outline" size="icon" onClick={() => router.push('/returns')}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">New Return Request</h1>
          <p className="text-sm text-muted-foreground">Submit a return or exchange request</p>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center gap-2 mb-8">
        <div className={`flex-1 h-2 rounded-full ${step >= 1 ? 'bg-blue-600' : 'bg-gray-200'}`} />
        <div className={`flex-1 h-2 rounded-full ${step >= 2 ? 'bg-blue-600' : 'bg-gray-200'}`} />
        <div className={`flex-1 h-2 rounded-full ${step >= 3 ? 'bg-blue-600' : 'bg-gray-200'}`} />
      </div>

      {/* Step 1: Order & Type */}
      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Order Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Return Type */}
            <div>
              <Label className="text-base mb-3 block">What would you like to do?</Label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setType(ReturnType.RETURN)}
                  className={`p-4 rounded-lg border-2 text-left transition-all ${
                    type === ReturnType.RETURN
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <RotateCcw className={`w-6 h-6 mb-2 ${type === ReturnType.RETURN ? 'text-blue-600' : 'text-gray-400'}`} />
                  <p className="font-semibold">Return</p>
                  <p className="text-xs text-muted-foreground">Get a refund</p>
                </button>
                <button
                  onClick={() => setType(ReturnType.EXCHANGE)}
                  className={`p-4 rounded-lg border-2 text-left transition-all ${
                    type === ReturnType.EXCHANGE
                      ? 'border-purple-500 bg-purple-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <ArrowLeftRight className={`w-6 h-6 mb-2 ${type === ReturnType.EXCHANGE ? 'text-purple-600' : 'text-gray-400'}`} />
                  <p className="font-semibold">Exchange</p>
                  <p className="text-xs text-muted-foreground">Swap for another item</p>
                </button>
              </div>
            </div>

            <Separator />

            {/* Order & Product */}
            <div className="space-y-4">
              <div>
                <Label htmlFor="orderId">Order ID *</Label>
                <Input
                  id="orderId"
                  placeholder="Enter your order ID"
                  value={orderId}
                  onChange={(e) => setOrderId(e.target.value)}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  You can find this in your order history
                </p>
              </div>
              <div>
                <Label htmlFor="productId">Product ID *</Label>
                <Input
                  id="productId"
                  placeholder="Enter the product ID"
                  value={productId}
                  onChange={(e) => setProductId(e.target.value)}
                />
              </div>
            </div>

            <Button className="w-full" disabled={!isStep1Valid} onClick={() => setStep(2)}>
              Continue
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Reason & Details */}
      {step === 2 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Return Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Reason Selection */}
            <div>
              <Label className="text-base mb-3 block">Why are you returning this?</Label>
              <div className="space-y-2">
                {returnReasons.map((r) => (
                  <button
                    key={r.value}
                    onClick={() => setReason(r.value)}
                    className={`w-full p-3 rounded-lg border-2 text-left transition-all ${
                      reason === r.value
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{r.label}</span>
                      {reason === r.value && <CheckCircle className="w-4 h-4 text-blue-600" />}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">{r.description}</p>
                  </button>
                ))}
              </div>
            </div>

            <Separator />

            {/* Description */}
            <div>
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                placeholder="Please describe the issue in detail (minimum 10 characters)..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
              />
              <p className="text-xs text-muted-foreground mt-1">
                {description.length} characters (min 10)
              </p>
            </div>

            {/* Image Upload */}
            <div>
              <Label className="flex items-center gap-1">
                <ImageIcon className="w-4 h-4" />
                Images (Optional)
              </Label>
              <div className="flex gap-2 mt-1">
                <Input
                  placeholder="Paste image URL..."
                  value={imageInput}
                  onChange={(e) => setImageInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddImage())}
                />
                <Button type="button" variant="outline" onClick={handleAddImage}>
                  <Upload className="w-4 h-4" />
                </Button>
              </div>
              {images.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {images.map((img, idx) => (
                    <Badge key={idx} variant="secondary" className="gap-1 pr-1">
                      Image {idx + 1}
                      <button onClick={() => handleRemoveImage(idx)} className="ml-1 hover:text-red-500">
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => setStep(1)}>
                Back
              </Button>
              <Button className="flex-1" disabled={!isStep2Valid} onClick={() => setStep(3)}>
                Continue
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Refund Method & Submit */}
      {step === 3 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Review & Submit</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Summary */}
            <div className="bg-muted p-4 rounded-lg space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Type</span>
                <span className="font-medium capitalize">{type}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Order</span>
                <span className="font-medium">#{orderId}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Product</span>
                <span className="font-medium">#{productId}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Reason</span>
                <span className="font-medium capitalize">{reason?.replace('_', ' ')}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Images</span>
                <span className="font-medium">{images.length} attached</span>
              </div>
            </div>

            {/* Refund Method (for returns only) */}
            {type === ReturnType.RETURN && (
              <div>
                <Label className="text-base mb-3 block">Refund Method</Label>
                <div className="space-y-2">
                  {refundMethods.map((method) => (
                    <button
                      key={method.value}
                      onClick={() => setRefundMethod(method.value)}
                      className={`w-full p-3 rounded-lg border-2 text-left transition-all ${
                        refundMethod === method.value
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{method.label}</span>
                        {refundMethod === method.value && <CheckCircle className="w-4 h-4 text-blue-600" />}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <Separator />

            {/* Policy Agreement */}
            <div className="flex items-start gap-2 text-sm text-muted-foreground">
              <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
              <p>
                By submitting this request, you agree to our return policy. Items must be in 
                original condition with all packaging. Returns are typically processed within 
                5-7 business days.
              </p>
            </div>

            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => setStep(2)}>
                Back
              </Button>
              <Button
                className="flex-1"
                onClick={handleSubmit}
                disabled={createReturn.isPending}
              >
                {createReturn.isPending ? 'Submitting...' : 'Submit Request'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
