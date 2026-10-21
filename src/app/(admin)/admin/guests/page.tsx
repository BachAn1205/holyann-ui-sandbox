"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { Textarea } from "@/components/ui/textarea";
import {
  ArrowLeft,
  Search,
  RefreshCw,
  Eye,
  Edit,
  Trash2,
  Phone,
  Mail,
  MapPin,
  School,
  GraduationCap,
  Globe,
  Building,
  DollarSign,
  Loader2,
  UserCheck,
} from "lucide-react";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import RoleGuard from "@/components/auth/RoleGuard";

interface Lead {
  id: string;
  full_name: string;
  phone: string;
  email: string;
  current_location: string | null;
  current_school: string | null;
  current_grade: string | null;
  study_level: string | null;
  intended_major: string | null;
  intended_country: string | null;
  intended_university: string | null;
  budget_per_year: string | null;
  status: string;
  notes: string | null;
  created_at: string;
}

interface Pagination {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

const STATUS_OPTIONS = [
  { value: "ALL", label: "Tất cả trạng thái" },
  { value: "NEW", label: "Mới" },
  { value: "CONTACTED", label: "Đã liên hệ" },
  { value: "INTERESTED", label: "Quan tâm" },
  { value: "NOT_INTERESTED", label: "Không quan tâm" },
  { value: "CONVERTED", label: "Đã chuyển đổi" },
];

const STATUS_COLORS: Record<string, string> = {
  NEW: "bg-blue-100 text-blue-800",
  CONTACTED: "bg-yellow-100 text-yellow-800",
  INTERESTED: "bg-green-100 text-green-800",
  NOT_INTERESTED: "bg-gray-100 text-gray-800",
  CONVERTED: "bg-purple-100 text-purple-800",
};

const STUDY_LEVEL_LABELS: Record<string, string> = {
  high_school: "Trung học",
  college: "Cao đẳng",
  university: "Đại học",
  master: "Thạc sỹ",
  other: "Khác",
};

const BUDGET_LABELS: Record<string, string> = {
  under_500m: "Dưới 500 triệu",
  "500m_1b": "500 triệu - 1 tỷ",
  "1b_2b": "1 tỷ - 2 tỷ",
  over_2b: "Trên 2 tỷ",
  undecided: "Chưa xác định",
};

export default function AdminGuestsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageQuery, setPageQuery] = useState("1");

  // Modal states
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [leadToDelete, setLeadToDelete] = useState<Lead | null>(null);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [editStatus, setEditStatus] = useState("");
  const [editNotes, setEditNotes] = useState("");
  const [updating, setUpdating] = useState(false);

  const fetchLeads = useCallback(async (isManualRefresh = false) => {
    if (isManualRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        pageSize: "15",
      });

      if (statusFilter !== "ALL") {
        params.append("status", statusFilter);
      }
      if (search.trim()) {
        params.append("search", search.trim());
      }
      params.append("sortOrder", sortOrder);

      const res = await fetch(`/api/admin/leads?${params.toString()}`, {
        credentials: "include",
      });

      if (res.ok) {
        const data = await res.json();
        setLeads(data.data || []);
        setPagination(data.pagination || null);
      }
    } catch (error) {
      console.error("Failed to fetch leads:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [currentPage, statusFilter, search, sortOrder]);

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  const handleSearch = () => {
    setCurrentPage(1);
    fetchLeads();
  };

  const totalPages = pagination?.totalPages ?? 1;
  const safeCurrentPage = Math.min(currentPage, totalPages);

  useEffect(() => {
    setPageQuery(String(safeCurrentPage));
  }, [safeCurrentPage]);

  const visiblePages = useMemo(() => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    const pages = new Set<number>([1, totalPages, safeCurrentPage]);
    if (safeCurrentPage - 1 > 1) pages.add(safeCurrentPage - 1);
    if (safeCurrentPage + 1 < totalPages) pages.add(safeCurrentPage + 1);
    return Array.from(pages).sort((a, b) => a - b);
  }, [safeCurrentPage, totalPages]);

  const jumpToPage = () => {
    const target = Number(pageQuery);
    if (!Number.isFinite(target)) return;
    const normalized = Math.min(totalPages, Math.max(1, Math.floor(target)));
    setCurrentPage(normalized);
  };

  const handleViewLead = (lead: Lead) => {
    setSelectedLead(lead);
    setViewModalOpen(true);
  };

  const handleEditLead = (lead: Lead) => {
    setSelectedLead(lead);
    setEditStatus(lead.status);
    setEditNotes(lead.notes || "");
    setEditModalOpen(true);
  };

  const handleUpdateLead = async () => {
    if (!selectedLead) return;

    setUpdating(true);
    try {
      const res = await fetch("/api/admin/leads", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          id: selectedLead.id,
          status: editStatus,
          notes: editNotes,
        }),
      });

      if (res.ok) {
        setEditModalOpen(false);
        fetchLeads();
      }
    } catch (error) {
      console.error("Failed to update lead:", error);
    } finally {
      setUpdating(false);
    }
  };

  const openDeleteConfirm = (lead: Lead) => {
    setLeadToDelete(lead);
    setDeleteConfirmOpen(true);
  };

  const closeDeleteConfirm = () => {
    setDeleteConfirmOpen(false);
    setLeadToDelete(null);
  };

  const handleConfirmDelete = async () => {
    if (!leadToDelete) return;
    setUpdating(true);
    try {
      const res = await fetch(`/api/admin/leads?id=${encodeURIComponent(leadToDelete.id)}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (res.ok) {
        closeDeleteConfirm();
        fetchLeads();
        if (selectedLead?.id === leadToDelete.id) {
          setViewModalOpen(false);
          setEditModalOpen(false);
          setSelectedLead(null);
        }
      } else {
        const data = await res.json().catch(() => ({}));
        alert(data.error || "Không thể xóa khách hàng.");
      }
    } catch (error) {
      console.error("Failed to delete lead:", error);
      alert("Không thể xóa khách hàng.");
    } finally {
      setUpdating(false);
    }
  };

  return (
    <RoleGuard allowedRoles={["admin", "ADMIN"]}>
      <div className="w-full max-w-7xl mx-auto p-6 md:p-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link href="/admin/dashboard">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-xl font-semibold text-foreground flex items-center gap-2">
                <UserCheck className="h-6 w-6 text-amber-500" />
                Khách hàng tiềm năng (Guests)
              </h1>
              <p className="text-sm text-muted-foreground">
                Danh sách học viên đăng ký tư vấn từ Landing Page
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              {pagination?.total || 0} khách hàng
            </span>
            <Button variant="outline" size="sm" onClick={() => fetchLeads(true)} disabled={refreshing}>
              <RefreshCw className={`h-4 w-4 mr-1 ${refreshing ? "animate-spin" : ""}`} />
              {refreshing ? "Refreshing..." : "Refresh"}
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Tìm theo tên, email, số điện thoại..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              className="pl-9"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-[200px]">
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
          <Select value={sortOrder} onValueChange={(v) => setSortOrder(v as "asc" | "desc")}>
            <SelectTrigger className="w-full sm:w-[200px]">
              <SelectValue placeholder="Sắp xếp theo ngày" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="desc">Mới nhất trước</SelectItem>
              <SelectItem value="asc">Cũ nhất trước</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={handleSearch}>Tìm kiếm</Button>
        </div>

        {/* Table */}
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Họ tên</TableHead>
                <TableHead>Liên hệ</TableHead>
                <TableHead>Bậc học</TableHead>
                <TableHead>Quốc gia mục tiêu</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead>Ngày đăng ký</TableHead>
                <TableHead className="text-right">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" />
                  </TableCell>
                </TableRow>
              ) : leads.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    Chưa có khách hàng tiềm năng nào
                  </TableCell>
                </TableRow>
              ) : (
                leads.map((lead) => (
                  <TableRow key={lead.id}>
                    <TableCell className="font-medium">{lead.full_name}</TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Phone className="h-3 w-3" />
                          {lead.phone}
                        </div>
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Mail className="h-3 w-3" />
                          {lead.email}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {lead.study_level
                        ? STUDY_LEVEL_LABELS[lead.study_level] || lead.study_level
                        : "-"}
                    </TableCell>
                    <TableCell>{lead.intended_country || "-"}</TableCell>
                    <TableCell>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          STATUS_COLORS[lead.status] || "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {STATUS_OPTIONS.find((s) => s.value === lead.status)?.label || lead.status}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {format(new Date(lead.created_at), "dd/MM/yyyy HH:mm", { locale: vi })}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleViewLead(lead)}
                          title="Xem chi tiết"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEditLead(lead)}
                          title="Cập nhật"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openDeleteConfirm(lead)}
                          title="Xóa khách hàng"
                          className="text-destructive hover:bg-destructive/15 hover:text-destructive dark:hover:bg-destructive/25"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {pagination && pagination.totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 flex-wrap">
            <Button
              variant="outline"
              size="sm"
              disabled={safeCurrentPage === 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            >
              Trước
            </Button>
            {visiblePages.map((page, index) => {
              const prev = visiblePages[index - 1];
              const showGap = index > 0 && prev != null && page - prev > 1;
              return (
                <div key={page} className="flex items-center gap-2">
                  {showGap && <span className="px-1 text-sm text-muted-foreground">...</span>}
                  <Button
                    variant={safeCurrentPage === page ? "default" : "outline"}
                    size="sm"
                    onClick={() => setCurrentPage(page)}
                  >
                    {page}
                  </Button>
                </div>
              );
            })}
            <Button
              variant="outline"
              size="sm"
              disabled={safeCurrentPage >= totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            >
              Sau
            </Button>
            <div className="hidden sm:flex items-center gap-1 ml-1">
              <Input
                type="number"
                min={1}
                max={totalPages}
                value={pageQuery}
                onChange={(e) => setPageQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") jumpToPage();
                }}
                className="h-8 w-16"
              />
              <Button variant="outline" size="sm" onClick={jumpToPage}>
                Đi
              </Button>
            </div>
          </div>
        )}

        {/* View Modal */}
        <Dialog open={viewModalOpen} onOpenChange={setViewModalOpen}>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto p-6">
            <DialogHeader>
              <DialogTitle className="mb-2">Chi tiết khách hàng tiềm năng</DialogTitle>
            </DialogHeader>
            {selectedLead && (
              <div className="space-y-4">
                {/* Basic Info */}
                <div className="space-y-3">
                  <h3 className="font-semibold text-lg">{selectedLead.full_name}</h3>
                  <div className="grid gap-2 text-sm">
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span>{selectedLead.phone}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span>{selectedLead.email}</span>
                    </div>
                    {selectedLead.current_location && (
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <span>{selectedLead.current_location}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Education Info */}
                <div className="border-t pt-4 space-y-2">
                  <h4 className="font-medium text-sm text-muted-foreground">Thông tin học vấn</h4>
                  <div className="grid gap-2 text-sm">
                    {selectedLead.current_school && (
                      <div className="flex items-center gap-2">
                        <School className="h-4 w-4 text-muted-foreground" />
                        <span>Trường: {selectedLead.current_school}</span>
                      </div>
                    )}
                    {selectedLead.current_grade && (
                      <div className="flex items-center gap-2">
                        <GraduationCap className="h-4 w-4 text-muted-foreground" />
                        <span>Lớp/Năm: {selectedLead.current_grade}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Study Plan */}
                <div className="border-t pt-4 space-y-2">
                  <h4 className="font-medium text-sm text-muted-foreground">Kế hoạch du học</h4>
                  <div className="grid gap-2 text-sm">
                    {selectedLead.study_level && (
                      <div className="flex items-center gap-2">
                        <GraduationCap className="h-4 w-4 text-muted-foreground" />
                        <span>
                          Bậc học: {STUDY_LEVEL_LABELS[selectedLead.study_level] || selectedLead.study_level}
                        </span>
                      </div>
                    )}
                    {selectedLead.intended_country && (
                      <div className="flex items-center gap-2">
                        <Globe className="h-4 w-4 text-muted-foreground" />
                        <span>Quốc gia: {selectedLead.intended_country}</span>
                      </div>
                    )}
                    {selectedLead.intended_major && (
                      <div className="flex items-center gap-2">
                        <GraduationCap className="h-4 w-4 text-muted-foreground" />
                        <span>Ngành học: {selectedLead.intended_major}</span>
                      </div>
                    )}
                    {selectedLead.intended_university && (
                      <div className="flex items-center gap-2">
                        <Building className="h-4 w-4 text-muted-foreground" />
                        <span>Trường mục tiêu: {selectedLead.intended_university}</span>
                      </div>
                    )}
                    {selectedLead.budget_per_year && (
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                        <span>
                          Ngân sách:{" "}
                          {BUDGET_LABELS[selectedLead.budget_per_year] || selectedLead.budget_per_year}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Status & Notes */}
                <div className="border-t pt-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Trạng thái:</span>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        STATUS_COLORS[selectedLead.status] || "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {STATUS_OPTIONS.find((s) => s.value === selectedLead.status)?.label ||
                        selectedLead.status}
                    </span>
                  </div>
                  {selectedLead.notes && (
                    <div>
                      <span className="text-sm text-muted-foreground">Ghi chú:</span>
                      <p className="mt-1 text-sm bg-muted/50 p-2 rounded">{selectedLead.notes}</p>
                    </div>
                  )}
                  <div className="text-xs text-muted-foreground">
                    Đăng ký lúc:{" "}
                    {format(new Date(selectedLead.created_at), "HH:mm dd/MM/yyyy", { locale: vi })}
                  </div>
                </div>

                <div className="flex justify-end pt-4 border-t">
                  <Button
                    variant="outline"
                    className="text-destructive border-destructive/50 hover:bg-destructive/15 hover:text-destructive hover:border-destructive dark:hover:bg-destructive/25"
                    onClick={() => openDeleteConfirm(selectedLead)}
                    disabled={updating}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Xóa khách hàng
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Edit Modal */}
        <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
          <DialogContent className="max-w-md p-6">
            <DialogHeader>
              <DialogTitle className="mb-2">Cập nhật trạng thái</DialogTitle>
            </DialogHeader>
            {selectedLead && (
              <div className="space-y-4">
                <div>
                  <p className="font-medium">{selectedLead.full_name}</p>
                  <p className="text-sm text-muted-foreground">{selectedLead.email}</p>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Trạng thái</label>
                  <Select value={editStatus} onValueChange={setEditStatus}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {STATUS_OPTIONS.filter((s) => s.value !== "ALL").map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Ghi chú</label>
                  <Textarea
                    value={editNotes}
                    onChange={(e) => setEditNotes(e.target.value)}
                    placeholder="Thêm ghi chú về khách hàng..."
                    rows={3}
                  />
                </div>

                <div className="flex justify-between gap-2">
                  <Button
                    variant="outline"
                    className="text-destructive border-destructive/50 hover:bg-destructive/15 hover:text-destructive hover:border-destructive dark:hover:bg-destructive/25"
                    onClick={() => openDeleteConfirm(selectedLead)}
                    disabled={updating}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Xóa
                  </Button>
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => setEditModalOpen(false)}>
                      Hủy
                    </Button>
                    <Button onClick={handleUpdateLead} disabled={updating}>
                      {updating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                      Lưu
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Delete Confirm Modal */}
        <Dialog open={deleteConfirmOpen} onOpenChange={(open) => !open && closeDeleteConfirm()}>
          <DialogContent className="max-w-md p-6">
            <DialogHeader>
              <div className="flex items-center justify-center w-14 h-14 mx-auto bg-destructive/10 rounded-full mb-2">
                <Trash2 className="h-7 w-7 text-destructive" />
              </div>
              <DialogTitle className="text-center">Xác nhận xóa khách hàng</DialogTitle>
            </DialogHeader>
            {leadToDelete && (
              <div className="space-y-4">
                <p className="text-center text-muted-foreground text-sm">
                  Bạn có chắc chắn muốn xóa khách hàng{" "}
                  <span className="font-semibold text-foreground">{leadToDelete.full_name}</span>?
                  <br />
                  Hành động này không thể hoàn tác.
                </p>
                <div className="flex gap-3">
                  <Button variant="outline" className="flex-1" onClick={closeDeleteConfirm}>
                    Hủy
                  </Button>
                  <Button
                    variant="destructive"
                    className="flex-1"
                    onClick={handleConfirmDelete}
                    disabled={updating}
                  >
                    {updating ? <Loader2 className="h-4 w-4 animate-spin" /> : "Xóa"}
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </RoleGuard>
  );
}
