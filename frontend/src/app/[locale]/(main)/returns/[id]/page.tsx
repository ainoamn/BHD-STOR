'use client';

import { useParams, useRouter } from 'next/navigation';
import { useReturn, useUpdateReturnStatus } from '@/hooks/useReturns';
import { ReturnTimeline } from '@/components/returns/ReturnTimeline';
import { ReturnPolicyDisplay } from '@/components/returns/ReturnPolicy';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import {
  ArrowLeft,
  RotateCcw,
  ArrowLeftRight,
  Package,
  AlertTriangle,
  Calendar,
  Banknote,
  MapPin,
  ImageIcon,
} from 'lucide-react';
import Image from 'next/image';

export default function ReturnDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const { data: returnRequest, isLoading, error } = useReturn(id);
  const updateStatus = useUpdateReturnStatus();

  if (isLoading) {
    return (
      <div className="container mx-auto py-8 px-4 max-w-4xl">
        <Skeleton className="h-8 w-48 mb-4" />
        <Skeleton className="h-64 mb-4" />
        <Skeleton className="h-96" />
      </div>
    );
  }

  if (error || !returnRequest) {
    return (
      <div className="container mx-auto py-8 px-4 max-w-4xl">
        <div className="flex items-center gap-2 text-red-600 bg-red-50 p-4 rounded-lg">
          <AlertTriangle className="w-5 h-5" />
          <p>Return request not found or failed to load.</p>
        </div>
        <Button variant="outline" className="mt-4" onClick={() => router.push('/returns')}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Returns
        </Button>
      </div>
    );
  }

  const statusColors: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    approved: 'bg-green-100 text-green-800 border-green-300',
    rejected: 'bg-red-100 text-red-800 border-red-300',
    picked_up: 'bg-blue-100 text-blue-800 border-blue-300',
    received: 'bg-purple-100 text-purple-800 border-purple-300',
    refunded: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    exchanged: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    closed: 'bg-gray-100 text-gray-800 border-gray-300',
  };

  const formatDate = (date: string | null) => {
    if (!date) return 'Not scheduled';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button variant="outline" size="icon" onClick={() => router.push('/returns')}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            {returnRequest.type === 'return' ? (
              <RotateCcw className="w-5 h-5 text-blue-600" />
            ) : (
              <ArrowLeftRight className="w-5 h-5 text-purple-600" />
            )}
            <h1 className="text-xl font-bold">
              {returnRequest.type === 'return' ? 'Return' : 'Exchange'} Request
            </h1>
            <Badge className={statusColors[returnRequest.status] || ''}>
              {returnRequest.status.replace('_', ' ').toUpperCase()}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground ml-8">
            Request #{returnRequest.id.slice(0, 8)} · Order #{returnRequest.orderId.slice(0, 8)}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Timeline */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <ReturnTimeline
                timeline={returnRequest.timeline || []}
                currentStatus={returnRequest.status}
              />
            </CardContent>
          </Card>

          {/* Details */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Request Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Reason</p>
                  <p className="font-medium capitalize">{returnRequest.reason.replace('_', ' ')}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Type</p>
                  <p className="font-medium capitalize">{returnRequest.type}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Submitted</p>
                  <p className="font-medium">{formatDate(returnRequest.createdAt)}</p>
                </div>
                {returnRequest.refundAmount && (
                  <div>
                    <p className="text-sm text-muted-foreground">Refund Amount</p>
                    <p className="font-medium text-green-600">
                      OMR {returnRequest.refundAmount.toFixed(3)}
                    </p>
                  </div>
                )}
                {returnRequest.refundMethod && (
                  <div>
                    <p className="text-sm text-muted-foreground">Refund Method</p>
                    <p className="font-medium capitalize">{returnRequest.refundMethod.replace('_', ' ')}</p>
                  </div>
                )}
                {returnRequest.pickupDate && (
                  <div>
                    <p className="text-sm text-muted-foreground">Pickup Date</p>
                    <p className="font-medium">{formatDate(returnRequest.pickupDate)}</p>
                  </div>
                )}
                {returnRequest.trackingNumber && (
                  <div>
                    <p className="text-sm text-muted-foreground">Tracking Number</p>
                    <p className="font-medium font-mono">{returnRequest.trackingNumber}</p>
                  </div>
                )}
              </div>

              <Separator />

              <div>
                <p className="text-sm text-muted-foreground mb-1">Description</p>
                <p className="text-sm bg-muted p-3 rounded-lg">{returnRequest.description}</p>
              </div>

              {returnRequest.adminNotes && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Admin Notes</p>
                  <p className="text-sm bg-blue-50 p-3 rounded-lg text-blue-800">
                    {returnRequest.adminNotes}
                  </p>
                </div>
              )}

              {/* Images */}
              {returnRequest.images && returnRequest.images.length > 0 && (
                <div>
                  <p className="text-sm text-muted-foreground mb-2 flex items-center gap-1">
                    <ImageIcon className="w-4 h-4" />
                    Attached Images
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {returnRequest.images.map((img, idx) => (
                      <div key={idx} className="relative w-24 h-24 rounded-lg overflow-hidden border">
                        <img
                          src={img}
                          alt={`Return image ${idx + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Pickup Address */}
          {returnRequest.pickupAddress && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  Pickup Address
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-1 text-sm">
                  <p className="font-medium">{returnRequest.pickupAddress.fullName}</p>
                  <p>{returnRequest.pickupAddress.address}</p>
                  <p>{returnRequest.pickupAddress.city}, {returnRequest.pickupAddress.governorate}</p>
                  <p className="text-muted-foreground">{returnRequest.pickupAddress.phone}</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {returnRequest.status === 'pending' && (
                <p className="text-sm text-muted-foreground">
                  Your request is being reviewed. You will be notified once a decision is made.
                </p>
              )}
              {returnRequest.status === 'approved' && (
                <div className="space-y-2">
                  <p className="text-sm text-green-700 bg-green-50 p-3 rounded-lg">
                    Your return has been approved. Please prepare the item for pickup.
                  </p>
                  {returnRequest.pickupDate ? (
                    <p className="text-sm text-muted-foreground">
                      Pickup scheduled for {formatDate(returnRequest.pickupDate)}
                    </p>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      A pickup date will be scheduled soon.
                    </p>
                  )}
                </div>
              )}
              {returnRequest.status === 'rejected' && (
                <p className="text-sm text-red-700 bg-red-50 p-3 rounded-lg">
                  This return request has been rejected.
                  {returnRequest.adminNotes && ` Reason: ${returnRequest.adminNotes}`}
                </p>
              )}
              {returnRequest.status === 'refunded' && (
                <p className="text-sm text-green-700 bg-green-50 p-3 rounded-lg">
                  Your refund of OMR {returnRequest.refundAmount?.toFixed(3)} has been processed.
                </p>
              )}
              {returnRequest.status === 'exchanged' && (
                <p className="text-sm text-green-700 bg-green-50 p-3 rounded-lg">
                  Your exchange has been processed. Check your orders for the new item.
                </p>
              )}
            </CardContent>
          </Card>

          {/* Return Policy */}
          <ReturnPolicyDisplay
            policy={{
              id: 'default',
              storeId: 'store-id',
              returnWindow: 14,
              exchangeWindow: 14,
              conditions: [
                'Item must be in original condition',
                'Original packaging required',
                'Receipt or proof of purchase required',
              ],
              nonReturnableCategories: ['intimates', 'perishables'],
              restockingFee: 0,
              autoApprove: false,
              createdAt: '',
              updatedAt: '',
            }}
          />
        </div>
      </div>
    </div>
  );
}
