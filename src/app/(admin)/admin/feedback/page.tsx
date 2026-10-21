"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
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
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Search,
  RefreshCw,
  Eye,
  Loader2,
  MessageSquareText,
  ImageIcon,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import RoleGuard from "@/components/auth/RoleGuard";
import {
  getAllSupportRequests,
  updateSupportRequestStatus,
} from "@/actions/support";

// ============================================================
// Types
// ============================================================

interface SupportRequest {
  id: string;
  description: string;
  image_url: string | null;
  status: string;
  admin_response: string | null;
  created_at: Date;
  users: {
    id: string;
    full_name: string;
    email: string;
    avatar_url: string | null;
  };
}

// ============================================================
// Constants
// ============================================================

const STATUS_OPTIONS = [
  { value: "ALL", label: "Tất cả trạng thái" },
  { value: "PENDING", label: "Chờ xử lý" },
  { value: "IN_PROGRESS", label: "Đang xử lý" },
  { value: "RESOLVED", label: "Đã giải quyết" },
  { value: "CLOSED", label: "Đã đóng" },
];

const STATUS_COLORS: Record<string, string> = {
  PENDING:
    "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  IN_PROGRESS:
    "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  RESOLVED:
    "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  CLOSED: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400",
};

const STATUS_LABELS: Record<string, string> = {
  PENDING: "Chờ xử lý",
  IN_PROGRESS: "Đang xử lý",
  RESOLVED: "Đã giải quyết",
  CLOSED: "Đã đóng",
};

const PAGE_SIZE = 15;

// ============================================================
// Page Component
// ============================================================

function AdminFeedbackPage() {
  const [requests, setRequests] = useState<SupportRequest[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedRequest, setSelectedRequest] =
    useState<SupportRequest | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [draftResponse, setDraftResponse] = useState("");

  const totalPages = Math.ceil(total / PAGE_SIZE);

  // ---- Fetch data ----
  const fetchRequests = useCallback(async (isManualRefresh = false) => {
    if (isManualRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    try {
      const result = await getAllSupportRequests({
        status: statusFilter === "ALL" ? undefined : statusFilter,
        limit: PAGE_SIZE,
        offset: (page - 1) * PAGE_SIZE,
      });

      if (result.success) {
        setRequests(result.data);
        setTotal(result.total);
      }
    } catch (error) {
      console.error("Error fetching feedback:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [statusFilter, page]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  // Reset page when filter changes
  useEffect(() => {
    setPage(1);
  }, [statusFilter]);

  // ---- Filter by search (client-side) ----
  const filteredRequests = searchQuery
    ? requests.filter(
        (r) =>
          r.users.full_name
            .toLowerCase()
            .includes(searchQuery.toLowerCase()) ||
          r.users.email
            .toLowerCase()
            .includes(searchQuery.toLowerCase()) ||
          r.description.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : requests;

  // ---- Handle status update ----
  const handleStatusUpdate = async (requestId: string, newStatus: string) => {
    setUpdatingStatus(true);
    try {
      const result = await updateSupportRequestStatus(requestId, newStatus, draftResponse);
      if (result.success) {
        toast.success("Cập nhật thành công!");
        // Update local state
        setRequests((prev) =>
          prev.map((r) =>
            r.id === requestId ? { ...r, status: newStatus, admin_response: draftResponse } : r
          )
        );
        if (selectedRequest?.id === requestId) {
          setSelectedRequest((prev) =>
            prev ? { ...prev, status: newStatus, admin_response: draftResponse } : null
          );
        }
      } else {
        toast.error(result.error || "Có lỗi xảy ra");
      }
    } catch (error) {
      console.error("Error updating status:", error);
    } finally {
      setUpdatingStatus(false);
    }
  };

  // ---- Open detail ----
  const openDetail = (req: SupportRequest) => {
    setSelectedRequest(req);
    setDraftResponse(req.admin_response || "");
    setDetailOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-100 dark:bg-indigo-900/30">
            <MessageSquareText className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              Feedback học viên
            </h1>
            <p className="text-sm text-muted-foreground">
              Quản lý yêu cầu hỗ trợ & phản hồi từ học viên ({total} yêu cầu)
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => fetchRequests(true)}
          disabled={loading || refreshing}
        >
          <RefreshCw
            className={`mr-2 h-4 w-4 ${loading || refreshing ? "animate-spin" : ""}`}
          />
          {refreshing ? "Đang làm mới..." : "Làm mới"}
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Tìm theo tên, email hoặc nội dung..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Trạng thái" />
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="rounded-xl border bg-card shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px]">#</TableHead>
              <TableHead>Học viên</TableHead>
              <TableHead className="hidden md:table-cell">Nội dung</TableHead>
              <TableHead className="w-[120px]">Trạng thái</TableHead>
              <TableHead className="hidden sm:table-cell w-[140px]">
                Ngày gửi
              </TableHead>
              <TableHead className="w-[100px] text-right">Hành động</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="h-32 text-center">
                  <div className="flex items-center justify-center gap-2">
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                    <span className="text-muted-foreground">
                      Đang tải dữ liệu...
                    </span>
                  </div>
                </TableCell>
              </TableRow>
            ) : filteredRequests.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-32 text-center">
                  <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    <MessageSquareText className="h-8 w-8 opacity-50" />
                    <p>Không có yêu cầu nào</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filteredRequests.map((req, idx) => (
                <TableRow
                  key={req.id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => openDetail(req)}
                >
                  <TableCell className="font-medium text-muted-foreground">
                    {(page - 1) * PAGE_SIZE + idx + 1}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                        {req.users.full_name?.charAt(0).toUpperCase() || "?"}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate font-medium text-sm">
                          {req.users.full_name}
                        </p>
                        <p className="truncate text-xs text-muted-foreground">
                          {req.users.email}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <p className="line-clamp-2 text-sm text-muted-foreground max-w-md">
                      {req.description}
                    </p>
                  </TableCell>
                  <TableCell>
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_COLORS[req.status] || STATUS_COLORS.PENDING}`}
                    >
                      {STATUS_LABELS[req.status] || req.status}
                    </span>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell text-sm text-muted-foreground">
                    {format(new Date(req.created_at), "dd/MM/yyyy HH:mm", {
                      locale: vi,
                    })}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation();
                        openDetail(req);
                      }}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Trang {page} / {totalPages} · Tổng {total} yêu cầu
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Detail Dialog */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] flex flex-col gap-0 p-0">
          <div className="shrink-0 px-6 pt-6 pb-2 pr-10 border-b border-border">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <MessageSquareText className="h-5 w-5 text-indigo-500" />
                Chi tiết phản hồi
              </DialogTitle>
            </DialogHeader>
          </div>
          <div className="flex-1 overflow-y-auto px-6 py-4">
          {selectedRequest && (
            <div className="space-y-4">
              {/* Student info */}
              <div className="flex items-center gap-3 rounded-lg bg-muted/50 p-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                  {selectedRequest.users.full_name
                    ?.charAt(0)
                    .toUpperCase() || "?"}
                </div>
                <div>
                  <p className="font-medium">
                    {selectedRequest.users.full_name}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {selectedRequest.users.email}
                  </p>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Nội dung phản hồi
                </label>
                <div className="mt-1.5 rounded-lg border bg-background p-3 text-sm leading-relaxed whitespace-pre-wrap">
                  {selectedRequest.description}
                </div>
              </div>

              {/* Image */}
              {selectedRequest.image_url && (
                <div>
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-1">
                    <ImageIcon className="h-3.5 w-3.5" />
                    Hình ảnh đính kèm
                  </label>
                  <div className="mt-1.5">
                    <a
                      href={selectedRequest.image_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block"
                    >
                      <img
                        src={selectedRequest.image_url}
                        alt="Ảnh đính kèm"
                        className="max-h-60 rounded-lg border object-contain"
                      />
                    </a>
                  </div>
                </div>
              )}

              {/* Status + Date */}
              <div className="flex items-center justify-between gap-4">
                <div>
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Ngày gửi
                  </label>
                  <p className="text-sm mt-0.5">
                    {format(
                      new Date(selectedRequest.created_at),
                      "dd/MM/yyyy 'lúc' HH:mm",
                      { locale: vi }
                    )}
                  </p>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Trạng thái
                  </label>
                  <div className="mt-0.5">
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_COLORS[selectedRequest.status] || STATUS_COLORS.PENDING}`}
                    >
                      {STATUS_LABELS[selectedRequest.status] ||
                        selectedRequest.status}
                    </span>
                  </div>
                </div>
              </div>

              {/* Admin Response */}
              <div className="pt-2">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Trả lời học viên
                </label>
                <div className="mt-1.5">
                  <Textarea
                    placeholder="Nhập nội dung trả lời cho học viên..."
                    value={draftResponse}
                    onChange={(e) => setDraftResponse(e.target.value)}
                    className="min-h-[100px] resize-y"
                  />
                </div>
              </div>

              {/* Status update buttons */}
              <div className="border-t pt-4">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Cập nhật trạng thái
                </label>
                <div className="mt-2 flex flex-wrap gap-2">
                  {["PENDING", "IN_PROGRESS", "RESOLVED", "CLOSED"].map(
                    (status) => (
                      <Button
                        key={status}
                        variant={
                          selectedRequest.status === status
                            ? "default"
                            : "outline"
                        }
                        size="sm"
                        disabled={
                          updatingStatus ||
                          selectedRequest.status === status
                        }
                        onClick={() =>
                          handleStatusUpdate(selectedRequest.id, status)
                        }
                      >
                        {updatingStatus ? (
                          <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                        ) : null}
                        {STATUS_LABELS[status]}
                      </Button>
                    )
                  )}
                </div>
              </div>
            </div>
          )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function AdminFeedbackPageWrapper() {
  return (
    <RoleGuard allowedRoles={["ADMIN"]}>
      <AdminFeedbackPage />
    </RoleGuard>
  );
}
