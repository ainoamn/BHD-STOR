"use client";

import { useState, useEffect, useCallback } from "react";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";

import { isAdminRole } from "@/lib/auth-helpers";
import { useAuth } from "@/hooks/useAuth";
import { useAdminUsers, useAdminUpdateUser } from "@/hooks/useAdmin";

import {
  Search,
  MoreHorizontal,
  Ban,
  CheckCircle,
  UserCog,
  Shield,
  Store,
  User,
  RefreshCw,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Trash2,
  Users,
} from "lucide-react";

interface UserItem {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: string;
  status: string;
  avatar?: string;
  createdAt: string;
  lastLogin?: string;
}

export default function AdminUsersPage() {
  const t = useTranslations("dashboard.admin.users");
  const router = useRouter();
  const { user } = useAuth();

  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [search, setSearch] = useState("");
  const [role, setRole] = useState<string>("all");
  const [status, setStatus] = useState<string>("all");
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [confirmDialog, setConfirmDialog] = useState<{ open: boolean; userId: string; action: string } | null>(null);

  const [debouncedSearch] = useDebounce(search, 300);

  const {
    data: usersData,
    isLoading,
    isError,
    error,
    refetch,
  } = useAdminUsers({
    page,
    limit,
    search: debouncedSearch || undefined,
    role: role !== "all" ? role : undefined,
    status: status !== "all" ? status : undefined,
  });

  const updateUserMutation = useAdminUpdateUser();

  const users: UserItem[] = (usersData?.users ?? []).map((u) => ({
    id: u.id,
    name: `${u.firstName} ${u.lastName}`.trim() || u.email,
    email: u.email,
    role: u.role,
    status: u.status,
    createdAt: u.createdAt,
  }));
  const totalUsers = usersData?.total ?? 0;
  const totalPages = Math.ceil(totalUsers / limit);

  useEffect(() => {
    if (!isLoading && (!user || !isAdminRole(user.role))) {
      toast.error(t("unauthorized"));
      router.push("/");
    }
  }, [user, isLoading, router, t]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, role, status]);

  const handleSelectAll = useCallback(() => {
    if (selectedUsers.length === users.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(users.map((u: UserItem) => u.id));
    }
  }, [selectedUsers.length, users]);

  const handleSelectUser = useCallback((userId: string) => {
    setSelectedUsers((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  }, []);

  const handleUpdateUser = (userId: string, data: Partial<UserItem>) => {
    updateUserMutation.mutate(
      { userId, data: data as any },
      {
        onSuccess: () => {
          toast.success(t("updateSuccess"));
          refetch();
          setConfirmDialog(null);
        },
        onError: (err: any) => {
          toast.error(t("updateError"), {
            description: err?.response?.data?.message || err?.message,
          });
        },
      }
    );
  };

  const handleBulkAction = (action: string) => {
    if (selectedUsers.length === 0) {
      toast.warning(t("noSelection"));
      return;
    }

    const updates = selectedUsers.map((id) =>
      updateUserMutation.mutateAsync({ userId: id, data: { status: action } as any })
    );

    Promise.all(updates)
      .then(() => {
        toast.success(t("bulkSuccess", { count: selectedUsers.length, action }));
        setSelectedUsers([]);
        refetch();
      })
      .catch((err) => {
        toast.error(t("bulkError"), { description: err?.message });
      });
  };

  const getRoleBadge = (role: string) => {
    const configs: Record<string, { label: string; className: string; icon: any }> = {
      admin: { label: "Admin", className: "bg-purple-100 text-purple-800", icon: Shield },
      seller: { label: "Seller", className: "bg-blue-100 text-blue-800", icon: Store },
      user: { label: "User", className: "bg-gray-100 text-gray-800", icon: User },
    };
    const config = configs[role] || configs.user;
    return (
      <Badge variant="outline" className={config.className}>
        <config.icon className="h-3 w-3 mr-1" />
        {config.label}
      </Badge>
    );
  };

  const getStatusBadge = (status: string) => {
    const configs: Record<string, string> = {
      active: "bg-green-100 text-green-800",
      inactive: "bg-gray-100 text-gray-800",
      banned: "bg-red-100 text-red-800",
      pending: "bg-yellow-100 text-yellow-800",
    };
    return (
      <Badge variant="outline" className={configs[status] || configs.inactive}>
        {status}
      </Badge>
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
            <Users className="h-7 w-7" />
            {t("title")}
          </h1>
          <p className="text-muted-foreground mt-1">{t("subtitle", { count: totalUsers })}</p>
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
            <Select value={role} onValueChange={setRole}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder={t("filters.role")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("filters.allRoles")}</SelectItem>
                <SelectItem value="admin">{t("filters.admin")}</SelectItem>
                <SelectItem value="seller">{t("filters.seller")}</SelectItem>
                <SelectItem value="user">{t("filters.user")}</SelectItem>
              </SelectContent>
            </Select>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder={t("filters.status")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("filters.allStatuses")}</SelectItem>
                <SelectItem value="active">{t("filters.active")}</SelectItem>
                <SelectItem value="inactive">{t("filters.inactive")}</SelectItem>
                <SelectItem value="banned">{t("filters.banned")}</SelectItem>
                <SelectItem value="pending">{t("filters.pending")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Bulk Actions */}
      {selectedUsers.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 p-3 bg-muted rounded-lg"
        >
          <span className="text-sm font-medium">
            {t("selectedCount", { count: selectedUsers.length })}
          </span>
          <div className="flex-1" />
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleBulkAction("active")}
          >
            <CheckCircle className="h-4 w-4 mr-1 text-green-600" />
            {t("bulk.activate")}
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleBulkAction("inactive")}
          >
            <Ban className="h-4 w-4 mr-1 text-yellow-600" />
            {t("bulk.deactivate")}
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="text-red-600 hover:bg-red-50"
            onClick={() => handleBulkAction("banned")}
          >
            <Trash2 className="h-4 w-4 mr-1" />
            {t("bulk.ban")}
          </Button>
        </motion.div>
      )}

      {/* Data Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[40px]">
                    <Checkbox
                      checked={users.length > 0 && selectedUsers.length === users.length}
                      onCheckedChange={handleSelectAll}
                    />
                  </TableHead>
                  <TableHead>{t("table.user")}</TableHead>
                  <TableHead>{t("table.role")}</TableHead>
                  <TableHead>{t("table.status")}</TableHead>
                  <TableHead>{t("table.created")}</TableHead>
                  <TableHead className="text-right">{t("table.actions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                      <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>{t("empty.title")}</p>
                      <p className="text-sm">{t("empty.description")}</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  users.map((u: UserItem) => (
                    <TableRow key={u.id}>
                      <TableCell>
                        <Checkbox
                          checked={selectedUsers.includes(u.id)}
                          onCheckedChange={() => handleSelectUser(u.id)}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-full bg-muted flex items-center justify-center overflow-hidden">
                            {u.avatar ? (
                              <img src={u.avatar} alt={u.name} className="h-full w-full object-cover" />
                            ) : (
                              <User className="h-4 w-4 text-muted-foreground" />
                            )}
                          </div>
                          <div>
                            <p className="font-medium">{u.name}</p>
                            <p className="text-sm text-muted-foreground">{u.email}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{getRoleBadge(u.role)}</TableCell>
                      <TableCell>{getStatusBadge(u.status)}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {new Date(u.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => router.push(`/dashboard/admin/users/${u.id}`)}
                            >
                              <UserCog className="h-4 w-4 mr-2" />
                              {t("actions.view")}
                            </DropdownMenuItem>
                            {u.status === "active" ? (
                              <DropdownMenuItem
                                onClick={() =>
                                  setConfirmDialog({ open: true, userId: u.id, action: "deactivate" })
                                }
                              >
                                <Ban className="h-4 w-4 mr-2 text-yellow-600" />
                                {t("actions.deactivate")}
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem
                                onClick={() => handleUpdateUser(u.id, { status: "active" })}
                              >
                                <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
                                {t("actions.activate")}
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-red-600"
                              onClick={() =>
                                setConfirmDialog({ open: true, userId: u.id, action: "ban" })
                              }
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              {t("actions.ban")}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
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
                  to: Math.min(page * limit, totalUsers),
                  total: totalUsers,
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

      {/* Confirm Dialog */}
      <Dialog open={confirmDialog?.open ?? false} onOpenChange={() => setConfirmDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {confirmDialog?.action === "ban" ? t("dialog.ban.title") : t("dialog.deactivate.title")}
            </DialogTitle>
            <DialogDescription>
              {confirmDialog?.action === "ban"
                ? t("dialog.ban.description")
                : t("dialog.deactivate.description")}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDialog(null)}>
              {t("dialog.cancel")}
            </Button>
            <Button
              variant="destructive"
              onClick={() =>
                confirmDialog &&
                handleUpdateUser(
                  confirmDialog.userId,
                  { status: confirmDialog.action === "ban" ? "banned" : "inactive" }
                )
              }
              disabled={updateUserMutation.isPending}
            >
              {updateUserMutation.isPending ? (
                <RefreshCw className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              {confirmDialog?.action === "ban" ? t("dialog.ban.confirm") : t("dialog.deactivate.confirm")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
