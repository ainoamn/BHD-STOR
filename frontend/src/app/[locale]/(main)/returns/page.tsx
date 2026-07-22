'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useReturns, useDeleteReturn } from '@/hooks/useReturns';
import { ReturnCard } from '@/components/returns/ReturnCard';
import { ReturnStatus } from '@/services/returns.service';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  RotateCcw,
  Plus,
  Search,
  PackageOpen,
  AlertTriangle,
} from 'lucide-react';

export default function ReturnsPage() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<string>('all');

  const statusFilter = activeTab === 'all' ? undefined : (activeTab as ReturnStatus);

  const { data, isLoading, error } = useReturns({
    status: statusFilter,
    page: 1,
    limit: 20,
  });

  const deleteReturn = useDeleteReturn();

  const filteredItems = data?.items?.filter((item) => {
    if (!search) return true;
    const searchLower = search.toLowerCase();
    return (
      item.id.toLowerCase().includes(searchLower) ||
      item.orderId.toLowerCase().includes(searchLower) ||
      item.reason.toLowerCase().includes(searchLower)
    );
  }) || [];

  const statusCounts = {
    all: data?.total || 0,
    pending: data?.items?.filter((i) => i.status === ReturnStatus.PENDING).length || 0,
    approved: data?.items?.filter((i) => i.status === ReturnStatus.APPROVED).length || 0,
    rejected: data?.items?.filter((i) => i.status === ReturnStatus.REJECTED).length || 0,
    picked_up: data?.items?.filter((i) => i.status === ReturnStatus.PICKED_UP).length || 0,
    received: data?.items?.filter((i) => i.status === ReturnStatus.RECEIVED).length || 0,
    refunded: data?.items?.filter((i) => i.status === ReturnStatus.REFUNDED).length || 0,
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
    <div className="container mx-auto py-8 px-4 max-w-6xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-blue-100">
            <RotateCcw className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">My Returns</h1>
            <p className="text-sm text-muted-foreground">
              Manage your return and exchange requests
            </p>
          </div>
        </div>
        <Button onClick={() => router.push('/returns/create')} className="gap-2">
          <Plus className="w-4 h-4" />
          New Return Request
        </Button>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search by order ID, product, or reason..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Status Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="flex flex-wrap h-auto gap-1">
          <TabsTrigger value="all" className="gap-1">
            All
            <Badge variant="secondary" className="ml-1 text-xs">{statusCounts.all}</Badge>
          </TabsTrigger>
          <TabsTrigger value="pending" className="gap-1">
            Pending
            {statusCounts.pending > 0 && (
              <Badge variant="destructive" className="ml-1 text-xs">{statusCounts.pending}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="approved">Approved</TabsTrigger>
          <TabsTrigger value="picked_up">Picked Up</TabsTrigger>
          <TabsTrigger value="received">Received</TabsTrigger>
          <TabsTrigger value="refunded">Refunded</TabsTrigger>
          <TabsTrigger value="rejected">Rejected</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-4">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-48" />
              ))}
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="text-center py-16">
              <PackageOpen className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-1">No returns found</h3>
              <p className="text-sm text-muted-foreground mb-4">
                {search
                  ? 'No results match your search'
                  : 'You have no return requests yet'}
              </p>
              {!search && (
                <Button onClick={() => router.push('/returns/create')} variant="outline">
                  Start a Return
                </Button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredItems.map((returnRequest) => (
                <ReturnCard key={returnRequest.id} returnRequest={returnRequest} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
