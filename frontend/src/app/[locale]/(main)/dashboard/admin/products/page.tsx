"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import { useDebounce } from "use-debounce";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/Badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

import { isAdminRole } from "@/lib/auth-helpers";
import { useAuth } from "@/hooks/useAuth";
import { useAdminProducts, useAdminUpdateProductStatus, useAdminModerateReview } from "@/hooks/useAdmin";

import {
  Search,
  Package,
  Store,
  Eye,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Star,
  RefreshCw,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  MessageSquare,
  ThumbsUp,
  ThumbsDown,
  Ban,
} from "lucide-react";

interface ProductItem {
  id: string;
  name: string;
  description?: string;
  price: number;
  stock: number;
  status: string;
  image?: string;
  category: string;
  storeName: string;
  rating: number;
  reviewsCount: number;
  createdAt: string;
}

interface ReviewItem {
  id: string;
  userName: string;
  userAvatar?: string;
  rating: number;
  comment: string;
  status: string;
  createdAt: string;
}

export default function AdminProductsPage() {
  const t = useTranslations("dashboard.admin.products");
  const router = useRouter();
  const { user } = useAuth();

  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [selectedProduct, setSelectedProduct] = useState<ProductItem | null>(null);
  const [reviewsModalOpen, setReviewsModalOpen] = useState(false);
  const [moderateDialog, setModerateDialog] = useState<{ open: boolean; reviewId: string; action: "approve" | "reject" } | null>(null);

  const [debouncedSearch] = useDebounce(search, 300);

  const {
    data: productsData,
    isLoading,
    isError,
    error,
    refetch,
  } = useAdminProducts({
    page,
    limit,
    search: debouncedSearch || undefined,
    status: statusFilter !== "all" ? statusFilter : undefined,
    category: categoryFilter !== "all" ? categoryFilter : undefined,
  });

  const updateStatusMutation = useAdminUpdateProductStatus();
  const moderateReviewMutation = useAdminModerateReview();

  const products: ProductItem[] = (productsData?.products ?? []).map((p) => ({
    ...p,
    rating: 0,
    reviewsCount: 0,
  }));
  const totalProducts = productsData?.total ?? 0;
  const totalPages = Math.ceil(totalProducts / limit);
  const categories = productsData?.categories ?? [];

  // Mock reviews data - in real app, fetch from API
  const reviews: ReviewItem[] = selectedProduct
    ? [
        {
          id: "1",
          userName: "Ahmed Al-Rashdi",
          rating: 4,
          comment: "Great product, fast delivery!",
          status: "pending",
          createdAt: "2024-01-15",
        },
        {
          id: "2",
          userName: "Fatima Al-Balushi",
          rating: 5,
          comment: "Excellent quality, highly recommend.",
          status: "approved",
          createdAt: "2024-01-14",
        },
      ]
    : [];

  useEffect(() => {
    if (!isLoading && (!user || !isAdminRole(user.role))) {
      toast.error(t("unauthorized"));
      router.push("/");
    }
  }, [user, isLoading, router, t]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, statusFilter, categoryFilter]);

  const handleUpdateStatus = (productId: string, status: string) => {
    updateStatusMutation.mutate(
      { productId, status },
      {
        onSuccess: () => {
          toast.success(t("statusUpdateSuccess"));
          refetch();
        },
        onError: (err: any) => {
          toast.error(t("statusUpdateError"), {
            description: err?.response?.data?.message || err?.message,
          });
        },
      }
    );
  };

  const handleModerateReview = (reviewId: string, action: "approve" | "reject") => {
    moderateReviewMutation.mutate(
      { reviewId, action },
      {
        onSuccess: () => {
          toast.success(action === "approve" ? t("reviewApproved") : t("reviewRejected"));
          setModerateDialog(null);
        },
        onError: (err: any) => {
          toast.error(t("reviewModerateError"), {
            description: err?.response?.data?.message || err?.message,
          });
        },
      }
    );
  };

  const getStatusBadge = (status: string) => {
    const configs: Record<string, { label: string; className: string }> = {
      active: { label: t("status.active"), className: "bg-green-100 text-green-800" },
      inactive: { label: t("status.inactive"), className: "bg-gray-100 text-gray-800" },
      out_of_stock: { label: t("status.outOfStock"), className: "bg-red-100 text-red-800" },
      pending: { label: t("status.pending"), className: "bg-yellow-100 text-yellow-800" },
      flagged: { label: t("status.flagged"), className: "bg-orange-100 text-orange-800" },
    };
    const config = configs[status] || configs.inactive;
    return (
      <Badge variant="outline" className={config.className}>
        {config.label}
      </Badge>
    );
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center gap-0.5">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star
            key={i}
            className={`h-3.5 w-3.5 ${
              i < rating ? "text-yellow-400 fill-yellow-400" : "text-gray-300"
            }`}
          />
        ))}
      </div>
    );
  };

  if (!user || !isAdminRole(user.role)) return null;

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="flex gap-4">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-10 w-32" />
        </div>
        <Skeleton className="h-[500px] w-full rounded-lg" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="container mx-auto px-4 py-12">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>{t("error.title")}</AlertTitle>
          <AlertDescription className="flex flex-col gap-4">
            <span>{(error as any)?.message || t("error.description")}</span>
            <Button variant="outline" size="sm" onClick={() => refetch()} className="w-fit">
              <RefreshCw className="mr-2 h-4 w-4" />
              {t("error.retry")}
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Package className="h-7 w-7" />
            {t("title")}
          </h1>
          <p className="text-muted-foreground mt-1">{t("subtitle", { count: totalProducts })}</p>
        </div>
        <Button variant="outline" onClick={() => refetch()}>
          <RefreshCw className="mr-2 h-4 w-4" />
          {t("refresh")}
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t("searchPlaceholder")}
                className="pl-10"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder={t("filters.status")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("filters.allStatuses")}</SelectItem>
                <SelectItem value="active">{t("filters.active")}</SelectItem>
                <SelectItem value="inactive">{t("filters.inactive")}</SelectItem>
                <SelectItem value="out_of_stock">{t("filters.outOfStock")}</SelectItem>
                <SelectItem value="pending">{t("filters.pending")}</SelectItem>
                <SelectItem value="flagged">{t("filters.flagged")}</SelectItem>
              </SelectContent>
            </Select>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder={t("filters.category")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("filters.allCategories")}</SelectItem>
                {categories.map((cat: string) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Data Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("table.product")}</TableHead>
                  <TableHead>{t("table.store")}</TableHead>
                  <TableHead>{t("table.price")}</TableHead>
                  <TableHead>{t("table.stock")}</TableHead>
                  <TableHead>{t("table.status")}</TableHead>
                  <TableHead>{t("table.rating")}</TableHead>
                  <TableHead className="text-right">{t("table.actions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                      <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>{t("empty.title")}</p>
                      <p className="text-sm">{t("empty.description")}</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  products.map((product: ProductItem) => (
                    <TableRow key={product.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center overflow-hidden">
                            {product.image ? (
                              <img src={product.image} alt={product.name} className="h-full w-full object-cover" />
                            ) : (
                              <Package className="h-5 w-5 text-muted-foreground" />
                            )}
                          </div>
                          <div>
                            <p className="font-medium">{product.name}</p>
                            <p className="text-sm text-muted-foreground">{product.category}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Store className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">{product.storeName}</span>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">
                        OMR {product.price?.toFixed(3)}
                      </TableCell>
                      <TableCell>
                        <span className={product.stock === 0 ? "text-red-600 font-medium" : ""}>
                          {product.stock}
                        </span>
                      </TableCell>
                      <TableCell>{getStatusBadge(product.status)}</TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          {renderStars(product.rating)}
                          <p className="text-xs text-muted-foreground">
                            {product.reviewsCount} {t("reviews")}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => router.push(`/dashboard/admin/products/${product.id}`)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          {product.reviewsCount > 0 && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedProduct(product);
                                setReviewsModalOpen(true);
                              }}
                            >
                              <MessageSquare className="h-4 w-4" />
                            </Button>
                          )}
                          {product.status === "active" ? (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleUpdateStatus(product.id, "inactive")}
                            >
                              <Ban className="h-4 w-4 mr-1" />
                              {t("actions.deactivate")}
                            </Button>
                          ) : (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleUpdateStatus(product.id, "active")}
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              {t("actions.activate")}
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between p-4 border-t">
              <p className="text-sm text-muted-foreground">
                {t("pagination.showing", {
                  from: (page - 1) * limit + 1,
                  to: Math.min(page * limit, totalProducts),
                  total: totalProducts,
                })}
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm text-muted-foreground">
                  {page} / {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Reviews Modal */}
      <Dialog open={reviewsModalOpen} onOpenChange={setReviewsModalOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              {t("reviews.title", { productName: selectedProduct?.name })}
            </DialogTitle>
            <DialogDescription>{t("reviews.description")}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {reviews.map((review: ReviewItem) => (
              <Card key={review.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-full bg-muted flex items-center justify-center">
                        {review.userAvatar ? (
                          <img src={review.userAvatar} alt={review.userName} className="h-full w-full object-cover rounded-full" />
                        ) : (
                          <span className="text-sm font-medium">{review.userName.charAt(0)}</span>
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-sm">{review.userName}</p>
                        <div className="flex items-center gap-2">
                          {renderStars(review.rating)}
                          <span className="text-xs text-muted-foreground">
                            {new Date(review.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                    <Badge
                      variant="outline"
                      className={
                        review.status === "approved"
                          ? "bg-green-100 text-green-800"
                          : review.status === "rejected"
                          ? "bg-red-100 text-red-800"
                          : "bg-yellow-100 text-yellow-800"
                      }
                    >
                      {review.status}
                    </Badge>
                  </div>
                  <p className="mt-3 text-sm text-muted-foreground">{review.comment}</p>
                  {review.status === "pending" && (
                    <div className="flex items-center gap-2 mt-3">
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-green-600 hover:bg-green-50"
                        onClick={() =>
                          setModerateDialog({ open: true, reviewId: review.id, action: "approve" })
                        }
                      >
                        <ThumbsUp className="h-3.5 w-3.5 mr-1" />
                        {t("reviews.approve")}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-red-600 hover:bg-red-50"
                        onClick={() =>
                          setModerateDialog({ open: true, reviewId: review.id, action: "reject" })
                        }
                      >
                        <ThumbsDown className="h-3.5 w-3.5 mr-1" />
                        {t("reviews.reject")}
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Moderate Dialog */}
      <Dialog open={moderateDialog?.open ?? false} onOpenChange={() => setModerateDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {moderateDialog?.action === "approve"
                ? t("moderate.approve.title")
                : t("moderate.reject.title")}
            </DialogTitle>
            <DialogDescription>
              {moderateDialog?.action === "approve"
                ? t("moderate.approve.description")
                : t("moderate.reject.description")}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModerateDialog(null)}>
              {t("moderate.cancel")}
            </Button>
            <Button
              variant={moderateDialog?.action === "approve" ? "default" : "destructive"}
              onClick={() =>
                moderateDialog && handleModerateReview(moderateDialog.reviewId, moderateDialog.action)
              }
              disabled={moderateReviewMutation.isPending}
            >
              {moderateReviewMutation.isPending ? (
                <RefreshCw className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              {moderateDialog?.action === "approve"
                ? t("moderate.approve.confirm")
                : t("moderate.reject.confirm")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
