'use client';

import { useState } from 'react';
import { useReturnsAdmin, useUpdateReturnStatus, useApproveReturn, useRejectReturn, useProcessRefund, useProcessExchange, useMarkReceived } from '@/hooks/useReturns';
import { ReturnRequest, ReturnStatus } from '@/services/returns.service';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import {
  RotateCcw,
  Search,
  PackageOpen,
  CheckCircle,
  XCircle,
  Truck,
  Banknote,
  ArrowLeftRight,
  Warehouse,
  Eye,
  AlertTriangle,
} from 'lucide-react';

const statusOptions = [
  { value: ReturnStatus.PENDING, label: 'Pending' },
  { value: ReturnStatus.APPROVED, label: 'Approved' },
  { value: ReturnStatus.REJECTED, label: 'Rejected' },
  { value: ReturnStatus.PICKED_UP, label: 'Picked Up' },
  { value: ReturnStatus.RECEIVED, label: 'Received' },
  { value: ReturnStatus.REFUNDED, label: 'Refunded' },
  { value: ReturnStatus.EXCHANGED, label: 'Exchanged' },
  { value: ReturnStatus.CLOSED, label: 'Closed' },
];

export default function AdminReturnsPage() {
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<string>('all');
  const [selectedReturn, setSelectedReturn] = useState<ReturnRequest | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [refundAmount, setRefundAmount] = useState('');
  const [showRejectDialog, setShowRejectDialog] = useState(false);

  const statusFilter = activeTab === 'all' ? undefined : (activeTab as ReturnStatus);

  const { data, isLoading, error } = useReturnsAdmin({
    status: statusFilter,
    page: 1,
    limit: 50,
  });

  const updateStatus = useUpdateReturnStatus();
  const approveReturn = useApproveReturn();
  const rejectReturn = useRejectReturn();
  const processRefund = useProcessRefund();
  const processExchange = useProcessExchange();
  const markReceived = useMarkReceived();

  const filteredItems = data?.items?.filter((item) => {
    if (!search) return true;
    const searchLower = search.toLowerCase();
    return (
      item.id.toLowerCase().includes(searchLower) ||
      item.orderId.toLowerCase().includes(searchLower) ||
      item.userId.toLowerCase().includes(searchLower)
    );
  }) || [];

  const handleApprove = async (id: string) => {
    try {
      await approveReturn.mutateAsync({ id, refundAmount: refundAmount ? parseFloat(refundAmount) : undefined });
      toast.success('Return approved successfully');
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to approve return');
    }
  };

  const handleReject = async (id: string) => {
    if (!rejectReason.trim()) {
      toast.error('Please provide a rejection reason');
      return;
    }
    try {
      await rejectReturn.mutateAsync({ id, reason: rejectReason });
      setShowRejectDialog(false);
      setRejectReason('');
      toast.success('Return rejected');
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to reject return');
    }
  };

  const handleStatusChange = async (id: string, status: ReturnStatus) => {
    try {
      await updateStatus.mutateAsync({ id, status });
      toast.success(`Status updated to ${status}`);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to update status');
    }
  };

  const handleProcessRefund = async (id: string) => {
    try {
      await processRefund.mutateAsync(id);
      toast.success('Refund processed successfully');
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to process refund');
    }
  };

  const handleProcessExchange = async (id: string) => {
    try {
      await processExchange.mutateAsync(id);
      toast.success('Exchange processed successfully');
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to process exchange');
    }
  };

  const handleMarkReceived = async (id: string) => {
    try {
      await markReceived.mutateAsync(id);
      toast.success('Item marked as received');
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to mark as received');
    }
  };

  const getStatusBadge = (status: ReturnStatus) => {
    const variants: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100',
      approved: 'bg-green-100 text-green-800 hover:bg-green-100',
      rejected: 'bg-red-100 text-red-800 hover:bg-red-100',
      picked_up: 'bg-blue-100 text-blue-800 hover:bg-blue-100',
      received: 'bg-purple-100 text-purple-800 hover:bg-purple-100',
      refunded: 'bg-emerald-100 text-emerald-800 hover:bg-emerald-100',
      exchanged: 'bg-emerald-100 text-emerald-800 hover:bg-emerald-100',
      closed: 'bg-gray-100 text-gray-800 hover:bg-gray-100',
    };
    return (
      <Badge className={variants[status] || ''}>
        {status.replace('_', ' ')}
      </Badge>
    );
  };

  if (error) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="flex items-center gap-2 text-red-600 bg-red-50 p-4 rounded-lg">
          <AlertTriangle className="w-5 h-5" />
          <p>Failed to load returns. Please try again.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-blue-100">
            <RotateCcw className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Returns Management</h1>
            <p className="text-sm text-muted-foreground">
              Manage customer return and exchange requests
            </p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Pending', count: data?.items?.filter((i) => i.status === ReturnStatus.PENDING).length || 0, icon: <AlertTriangle className="w-4 h-4 text-yellow-600" />, color: 'bg-yellow-50' },
          { label: 'Approved', count: data?.items?.filter((i) => i.status === ReturnStatus.APPROVED).length || 0, icon: <CheckCircle className="w-4 h-4 text-green-600" />, color: 'bg-green-50' },
          { label: 'To Refund', count: data?.items?.filter((i) => i.status === ReturnStatus.RECEIVED).length || 0, icon: <Banknote className="w-4 h-4 text-emerald-600" />, color: 'bg-emerald-50' },
          { label: 'Total', count: data?.total || 0, icon: <RotateCcw className="w-4 h-4 text-blue-600" />, color: 'bg-blue-50' },
        ].map((stat) => (
          <Card key={stat.label} className={stat.color}>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-1">
                {stat.icon}
                <span className="text-sm font-medium text-muted-foreground">{stat.label}</span>
              </div>
              <p className="text-2xl font-bold">{stat.count}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search by return ID, order ID, or user ID..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="flex flex-wrap h-auto gap-1 mb-4">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="pending">Pending</TabsTrigger>
          <TabsTrigger value="approved">Approved</TabsTrigger>
          <TabsTrigger value="picked_up">Picked Up</TabsTrigger>
          <TabsTrigger value="received">Received</TabsTrigger>
          <TabsTrigger value="refunded">Refunded</TabsTrigger>
          <TabsTrigger value="rejected">Rejected</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab}>
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-20" />
              ))}
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="text-center py-16">
              <PackageOpen className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-1">No returns found</h3>
              <p className="text-sm text-muted-foreground">
                {search ? 'No results match your search' : 'No return requests in this category'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredItems.map((item) => (
                <Card key={item.id} className="overflow-hidden">
                  <CardContent className="p-4">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono text-sm font-medium">#{item.id.slice(0, 8)}</span>
                          {getStatusBadge(item.status)}
                          <Badge variant="outline" className="text-xs capitalize">
                            {item.type}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                          <span>Order: #{item.orderId.slice(0, 8)}</span>
                          <span>User: {item.userId.slice(0, 8)}...</span>
                          <span>Product: {item.productId.slice(0, 8)}...</span>
                          <span className="capitalize">{item.reason.replace('_', ' ')}</span>
                        </div>
                        {item.description && (
                          <p className="text-sm mt-1 truncate">{item.description}</p>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2 flex-wrap">
                        {item.status === ReturnStatus.PENDING && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-green-600 border-green-300 hover:bg-green-50"
                              onClick={() => setSelectedReturn(item)}
                            >
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-red-600 border-red-300 hover:bg-red-50"
                              onClick={() => { setSelectedReturn(item); setShowRejectDialog(true); }}
                            >
                              <XCircle className="w-3 h-3 mr-1" />
                              Reject
                            </Button>
                          </>
                        )}
                        {item.status === ReturnStatus.APPROVED && (
                          <Select
                            onValueChange={(val) => handleStatusChange(item.id, val as ReturnStatus)}
                          >
                            <SelectTrigger className="w-32 h-8 text-xs">
                              <SelectValue placeholder="Update" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value={ReturnStatus.PICKED_UP}>Mark Picked Up</SelectItem>
                              <SelectItem value={ReturnStatus.CLOSED}>Close</SelectItem>
                            </SelectContent>
                          </Select>
                        )}
                        {item.status === ReturnStatus.PICKED_UP && (
                          <Button size="sm" variant="outline" onClick={() => handleMarkReceived(item.id)}>
                            <Warehouse className="w-3 h-3 mr-1" />
                            Mark Received
                          </Button>
                        )}
                        {item.status === ReturnStatus.RECEIVED && (
                          <>
                            {item.type === 'return' ? (
                              <Button size="sm" variant="outline" className="text-green-600" onClick={() => handleProcessRefund(item.id)}>
                                <Banknote className="w-3 h-3 mr-1" />
                                Process Refund
                              </Button>
                            ) : (
                              <Button size="sm" variant="outline" className="text-purple-600" onClick={() => handleProcessExchange(item.id)}>
                                <ArrowLeftRight className="w-3 h-3 mr-1" />
                                Process Exchange
                              </Button>
                            )}
                          </>
                        )}
                        <Select
                          onValueChange={(val) => handleStatusChange(item.id, val as ReturnStatus)}
                        >
                          <SelectTrigger className="w-28 h-8 text-xs">
                            <SelectValue placeholder="Status" />
                          </SelectTrigger>
                          <SelectContent>
                            {statusOptions.map((opt) => (
                              <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Approve Dialog */}
      {selectedReturn && selectedReturn.status === ReturnStatus.PENDING && !showRejectDialog && (
        <Dialog open={!!selectedReturn} onOpenChange={() => setSelectedReturn(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Approve Return Request</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Approve return request #{selectedReturn.id.slice(0, 8)} for order #{selectedReturn.orderId.slice(0, 8)}.
              </p>
              <div>
                <Label className="text-sm">Refund Amount (OMR)</Label>
                <Input
                  type="number"
                  step="0.001"
                  placeholder="Enter refund amount..."
                  value={refundAmount}
                  onChange={(e) => setRefundAmount(e.target.value)}
                />
              </div>
              <div className="flex gap-3">
                <Button variant="outline" className="flex-1" onClick={() => setSelectedReturn(null)}>
                  Cancel
                </Button>
                <Button
                  className="flex-1"
                  onClick={() => { handleApprove(selectedReturn.id); setSelectedReturn(null); }}
                  disabled={approveReturn.isPending}
                >
                  {approveReturn.isPending ? 'Approving...' : 'Approve Return'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Reject Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Return Request</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Provide a reason for rejecting this return request.
            </p>
            <Textarea
              placeholder="Enter rejection reason..."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={3}
            />
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => setShowRejectDialog(false)}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                className="flex-1"
                onClick={() => selectedReturn && handleReject(selectedReturn.id)}
                disabled={rejectReturn.isPending}
              >
                {rejectReturn.isPending ? 'Rejecting...' : 'Reject Return'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
