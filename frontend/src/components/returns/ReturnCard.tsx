'use client';

import { useRouter } from 'next/navigation';
import { ReturnRequest, ReturnStatus, ReturnType, ReturnReason } from '@/services/returns.service';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  RotateCcw, 
  ArrowLeftRight, 
  Calendar, 
  ChevronRight,
  Package,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Truck,
  Warehouse,
  Banknote,
  CheckCircle2,
  Lock
} from 'lucide-react';

interface ReturnCardProps {
  returnRequest: ReturnRequest;
  onViewDetail?: (id: string) => void;
  isAdmin?: boolean;
}

const statusConfig: Record<ReturnStatus, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' | 'warning' | 'success'; icon: React.ReactNode }> = {
  pending: { label: 'Pending', variant: 'warning', icon: <AlertTriangle className="w-3 h-3" /> },
  approved: { label: 'Approved', variant: 'success', icon: <CheckCircle className="w-3 h-3" /> },
  rejected: { label: 'Rejected', variant: 'destructive', icon: <XCircle className="w-3 h-3" /> },
  picked_up: { label: 'Picked Up', variant: 'secondary', icon: <Truck className="w-3 h-3" /> },
  received: { label: 'Received', variant: 'secondary', icon: <Warehouse className="w-3 h-3" /> },
  refunded: { label: 'Refunded', variant: 'success', icon: <Banknote className="w-3 h-3" /> },
  exchanged: { label: 'Exchanged', variant: 'success', icon: <CheckCircle2 className="w-3 h-3" /> },
  closed: { label: 'Closed', variant: 'outline', icon: <Lock className="w-3 h-3" /> },
};

const reasonLabels: Record<ReturnReason, string> = {
  defective: 'Defective',
  wrong_item: 'Wrong Item',
  not_as_described: 'Not as Described',
  changed_mind: 'Changed Mind',
  damaged: 'Damaged in Shipping',
  other: 'Other',
};

export function ReturnCard({ returnRequest, onViewDetail, isAdmin = false }: ReturnCardProps) {
  const router = useRouter();
  const config = statusConfig[returnRequest.status];

  const handleClick = () => {
    if (onViewDetail) {
      onViewDetail(returnRequest.id);
    } else {
      router.push(`/returns/${returnRequest.id}`);
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <Card 
      className="cursor-pointer hover:shadow-md transition-shadow duration-200"
      onClick={handleClick}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-muted">
              {returnRequest.type === ReturnType.RETURN ? (
                <RotateCcw className="w-5 h-5 text-blue-600" />
              ) : (
                <ArrowLeftRight className="w-5 h-5 text-purple-600" />
              )}
            </div>
            <div>
              <p className="text-sm font-medium">
                {returnRequest.type === ReturnType.RETURN ? 'Return' : 'Exchange'} Request
              </p>
              <p className="text-xs text-muted-foreground">
                #{returnRequest.id.slice(0, 8)}
              </p>
            </div>
          </div>
          <Badge variant={config.variant as any} className="flex items-center gap-1">
            {config.icon}
            {config.label}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground flex items-center gap-1">
              <Package className="w-3 h-3" />
              Product
            </span>
            <span className="font-medium">{returnRequest.productId.slice(0, 8)}...</span>
          </div>

          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Reason</span>
            <span className="font-medium">{reasonLabels[returnRequest.reason]}</span>
          </div>

          {returnRequest.refundAmount && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Refund Amount</span>
              <span className="font-medium text-green-600">
                OMR {returnRequest.refundAmount.toFixed(3)}
              </span>
            </div>
          )}

          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              Submitted
            </span>
            <span>{formatDate(returnRequest.createdAt)}</span>
          </div>

          {isAdmin && (
            <div className="pt-2 border-t mt-2">
              <p className="text-xs text-muted-foreground">
                User: {returnRequest.userId.slice(0, 8)}... | Order: {returnRequest.orderId.slice(0, 8)}...
              </p>
            </div>
          )}
        </div>

        <Button 
          variant="ghost" 
          size="sm" 
          className="w-full mt-3 text-xs"
          onClick={(e) => {
            e.stopPropagation();
            handleClick();
          }}
        >
          View Details
          <ChevronRight className="w-3 h-3 ml-1" />
        </Button>
      </CardContent>
    </Card>
  );
}
