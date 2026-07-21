'use client';

import { TimelineEvent, ReturnStatus } from '@/services/returns.service';
import { 
  CheckCircle, 
  XCircle, 
  Truck, 
  Warehouse, 
  Banknote, 
  AlertTriangle,
  Package,
  Clock,
  CheckCircle2,
  Lock
} from 'lucide-react';

interface ReturnTimelineProps {
  timeline: TimelineEvent[];
  currentStatus: ReturnStatus;
}

const statusIcons: Record<ReturnStatus, React.ReactNode> = {
  pending: <Clock className="w-4 h-4" />,
  approved: <CheckCircle className="w-4 h-4" />,
  rejected: <XCircle className="w-4 h-4" />,
  picked_up: <Truck className="w-4 h-4" />,
  received: <Warehouse className="w-4 h-4" />,
  refunded: <Banknote className="w-4 h-4" />,
  exchanged: <CheckCircle2 className="w-4 h-4" />,
  closed: <Lock className="w-4 h-4" />,
};

const statusOrder: ReturnStatus[] = [
  ReturnStatus.PENDING,
  ReturnStatus.APPROVED,
  ReturnStatus.PICKED_UP,
  ReturnStatus.RECEIVED,
  ReturnStatus.REFUNDED,
  ReturnStatus.EXCHANGED,
  ReturnStatus.CLOSED,
];

export function ReturnTimeline({ timeline, currentStatus }: ReturnTimelineProps) {
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const isCompleted = (status: ReturnStatus) => {
    const currentIdx = statusOrder.indexOf(currentStatus);
    const statusIdx = statusOrder.indexOf(status);
    return statusIdx <= currentIdx && currentStatus !== ReturnStatus.REJECTED;
  };

  const isRejected = currentStatus === ReturnStatus.REJECTED;

  // Build timeline from events, fill in gaps
  const events = timeline?.length > 0 ? timeline : [];

  return (
    <div className="space-y-0">
      {/* Progress Steps */}
      <div className="flex items-center justify-between mb-6 px-2">
        {[
          { status: ReturnStatus.PENDING, label: 'Submitted' },
          { status: ReturnStatus.APPROVED, label: 'Approved' },
          { status: ReturnStatus.PICKED_UP, label: 'Pickup' },
          { status: ReturnStatus.RECEIVED, label: 'Received' },
          { status: ReturnStatus.REFUNDED, label: 'Completed' },
        ].map((step, idx, arr) => {
          const completed = isCompleted(step.status);
          const isCurrent = currentStatus === step.status;
          const showConnector = idx < arr.length - 1;

          return (
            <div key={step.status} className="flex items-center flex-1">
              <div className="flex flex-col items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-colors ${
                    completed
                      ? isRejected && step.status === ReturnStatus.APPROVED
                        ? 'bg-red-100 border-red-500 text-red-600'
                        : 'bg-green-100 border-green-500 text-green-600'
                      : isCurrent
                      ? 'bg-blue-100 border-blue-500 text-blue-600'
                      : 'bg-gray-100 border-gray-300 text-gray-400'
                  }`}
                >
                  {isRejected && step.status === ReturnStatus.APPROVED ? (
                    <XCircle className="w-4 h-4" />
                  ) : completed ? (
                    <CheckCircle className="w-4 h-4" />
                  ) : (
                    statusIcons[step.status]
                  )}
                </div>
                <span
                  className={`text-[10px] mt-1 font-medium ${
                    completed || isCurrent ? 'text-foreground' : 'text-muted-foreground'
                  }`}
                >
                  {isRejected && step.status === ReturnStatus.APPROVED ? 'Rejected' : step.label}
                </span>
              </div>
              {showConnector && (
                <div
                  className={`flex-1 h-0.5 mx-2 ${
                    isCompleted(arr[idx + 1].status) && !isRejected
                      ? 'bg-green-500'
                      : 'bg-gray-200'
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Timeline Events */}
      <div className="space-y-3">
        <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          Activity History
        </h4>
        {events.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            No activity recorded yet.
          </p>
        ) : (
          events.map((event, idx) => (
            <div
              key={idx}
              className="flex items-start gap-3 p-3 rounded-lg bg-muted/50"
            >
              <div className="mt-0.5 text-muted-foreground">
                {statusIcons[event.status] || <Package className="w-4 h-4" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">{event.note}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {formatDate(event.timestamp)}
                  {event.actor && ` · by ${event.actor.slice(0, 8)}...`}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
