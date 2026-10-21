"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  MessageSquare,
  Clock,
  CheckCircle2,
  AlertCircle,
  Trash2,
  Plus,
  Pencil,
  RefreshCw,
  Loader2,
  Info,
  Search,
  Eye,
} from "lucide-react";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { toast } from "sonner";
import { 
  getStudentSupportRequests, 
  deleteSupportRequest,
  submitSupportRequest,
  updateSupportRequest,
  uploadSupportImage 
} from "@/actions/support";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

// ==========================================
// Constants & Types
// ==========================================

const STATUS_CONFIG: Record<string, { label: string; bg: string; text: string; icon: any }> = {
  PENDING: { 
    label: "Chờ xử lý", 
    bg: "bg-yellow-100 dark:bg-yellow-900/30", 
    text: "text-yellow-700 dark:text-yellow-400", 
    icon: Clock 
  },
  IN_PROGRESS: { 
    label: "Đang xử lý", 
    bg: "bg-blue-100 dark:bg-blue-900/30", 
    text: "text-blue-700 dark:text-blue-400", 
    icon: Loader2 
  },
  RESOLVED: { 
    label: "Đã giải quyết", 
    bg: "bg-green-100 dark:bg-green-900/30", 
    text: "text-green-700 dark:text-green-400", 
    icon: CheckCircle2 
  },
  CLOSED: { 
    label: "Đã đóng", 
    bg: "bg-gray-100 dark:bg-gray-800", 
    text: "text-gray-700 dark:text-gray-400", 
    icon: AlertCircle 
  },
};

interface SupportRequest {
  id: string;
  description: string;
  image_url: string | null;
  status: string;
  admin_response: string | null;
  created_at: Date;
}

// ==========================================
// Page Component
// ==========================================

export default function StudentSupportPage() {
  const [requests, setRequests] = useState<SupportRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Modals State
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingRequest, setEditingRequest] = useState<SupportRequest | null>(null);
  const [selectedTicket, setSelectedTicket] = useState<SupportRequest | null>(null);
  
  // Form State
  const [description, setDescription] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [keepExistingImage, setKeepExistingImage] = useState(true);

  // Fetch Requests
  const fetchRequests = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getStudentSupportRequests();
      if (result.success) {
        setRequests(result.data as SupportRequest[]);
      } else {
        toast.error(result.error || "Không thể tải danh sách yêu cầu");
      }
    } catch (error) {
      console.error("Error fetching support requests:", error);
      toast.error("Đã xảy ra lỗi khi tải dữ liệu");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  // Derived State
  const filteredRequests = useMemo(() => {
    return requests.filter(r => 
      r.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.id.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [requests, searchQuery]);

  // Handlers
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("File vượt quá 5MB");
        return;
      }
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setKeepExistingImage(false);
    }
  };

  const resetForm = () => {
    setEditingRequest(null);
    setDescription("");
    setSelectedFile(null);
    setPreviewUrl(null);
    setKeepExistingImage(true);
  };

  const handleCreateNew = () => {
    resetForm();
    setIsFormModalOpen(true);
  };

  const handleEditClick = (req: SupportRequest) => {
    setEditingRequest(req);
    setDescription(req.description);
    setPreviewUrl(req.image_url);
    setSelectedFile(null);
    setKeepExistingImage(true);
    setIsFormModalOpen(true);
  };

  const handleViewClick = (req: SupportRequest) => {
    setSelectedTicket(req);
    setIsViewModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Bạn có chắc chắn muốn xóa yêu cầu này?")) return;
    try {
      const result = await deleteSupportRequest(id);
      if (result.success) {
        toast.success("Đã xóa yêu cầu");
        setRequests(prev => prev.filter(r => r.id !== id));
      } else {
        toast.error(result.error || "Không thể xóa");
      }
    } catch (error) {
      toast.error("Đã xảy ra lỗi");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) {
      toast.error("Vui lòng nhập mô tả");
      return;
    }

    setIsSubmitting(true);
    try {
      let imageUrl = editingRequest?.image_url || null;
      if (selectedFile) {
        const formData = new FormData();
        formData.append("file", selectedFile);
        const uploadRes = await uploadSupportImage(formData);
        if (uploadRes.success) {
          imageUrl = uploadRes.url || null;
        } else {
          toast.error(uploadRes.error || "Lỗi upload ảnh");
          setIsSubmitting(false);
          return;
        }
      } else if (!keepExistingImage) {
        imageUrl = null;
      }

      const result = editingRequest 
        ? await updateSupportRequest(editingRequest.id, { description, imageUrl: selectedFile || !keepExistingImage ? imageUrl : undefined })
        : await submitSupportRequest({ description, imageUrl });

      if (result.success) {
        toast.success("Thành công!");
        setIsFormModalOpen(false);
        resetForm();
        fetchRequests();
      } else {
        toast.error(result.error || "Thất bại");
      }
    } catch (error) {
      toast.error("Lỗi hệ thống");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full px-4 md:px-8 py-6">
      {/* --- Header Section --- */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Hỗ trợ & Phản hồi</h1>
          <p className="text-sm text-gray-500 mt-1">
            Gửi yêu cầu hỗ trợ hoặc góp ý để chúng tôi hoàn thiện nền tảng hơn.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={() => fetchRequests()}
            disabled={loading}
            className="hidden sm:flex bg-white shadow-sm hover:bg-gray-50"
          >
            <RefreshCw className={cn("mr-2 h-4 w-4 text-gray-500", loading && "animate-spin")} />
            Làm mới
          </Button>
          <Button 
            onClick={handleCreateNew}
            className="bg-blue-600 hover:bg-blue-700 text-white shadow-md font-medium px-5"
          >
            <Plus className="mr-2 h-4 w-4" /> Tạo yêu cầu mới
          </Button>
        </div>
      </div>

      {/* --- Main Table Layout --- */}
      <div className="bg-white border rounded-2xl shadow-sm overflow-hidden flex flex-col h-[calc(100vh-220px)] min-h-[500px]">
        {/* Table Header Controls */}
        <div className="p-4 border-b flex items-center justify-between bg-white">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input 
              placeholder="Tìm kiếm nội dung yêu cầu hoặc mã..." 
              className="pl-9 bg-gray-50 border-gray-200 h-10 w-full rounded-xl text-sm focus-visible:ring-1 focus-visible:ring-blue-500"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Table Content */}
        <div className="flex-1 overflow-auto bg-gray-50/30">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-100/50 sticky top-0 z-10">
              <tr>
                <th className="px-6 py-4 font-semibold text-xs text-gray-500 uppercase tracking-wider w-[40%]">Nội dung</th>
                <th className="px-6 py-4 font-semibold text-xs text-gray-500 uppercase tracking-wider whitespace-nowrap">Trạng thái</th>
                <th className="px-6 py-4 font-semibold text-xs text-gray-500 uppercase tracking-wider whitespace-nowrap">Ngày gửi</th>
                <th className="px-6 py-4 font-semibold text-xs text-gray-500 uppercase tracking-wider">Phản hồi từ Admin</th>
                <th className="px-6 py-4 font-semibold text-xs text-gray-500 uppercase tracking-wider text-right">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {loading && requests.length === 0 ? (
                <tr>
                  <td colSpan={5} className="h-64 text-center">
                    <Loader2 className="h-6 w-6 animate-spin text-blue-500 mx-auto mb-3" />
                    <span className="text-gray-500 font-medium">Đang tải dữ liệu...</span>
                  </td>
                </tr>
              ) : filteredRequests.length === 0 ? (
                <tr>
                  <td colSpan={5} className="h-64 text-center">
                    <MessageSquare className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500 font-medium">Không tìm thấy yêu cầu nào</p>
                    {searchQuery && <p className="text-sm text-gray-400 mt-1">Thử thay đổi từ khóa tìm kiếm</p>}
                  </td>
                </tr>
              ) : (
                filteredRequests.map((req) => {
                  const config = STATUS_CONFIG[req.status] || STATUS_CONFIG.PENDING;
                  const isPending = req.status === "PENDING";
                  
                  return (
                    <tr key={req.id} className="hover:bg-gray-50/80 transition-colors group">
                      <td className="px-6 py-4">
                        <p className="text-gray-700 line-clamp-2 leading-relaxed" title={req.description}>
                          {req.description}
                        </p>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={cn("inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold", config.bg, config.text)}>
                          <config.icon className="w-3.5 h-3.5" />
                          {config.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-500 text-sm">
                        {format(new Date(req.created_at), "dd/MM/yyyy", { locale: vi })}
                      </td>
                      <td className="px-6 py-4">
                        {req.admin_response ? (
                          <div className="flex items-center gap-2 text-green-700 dark:text-green-600 bg-green-50 dark:bg-green-900/20 px-3 py-1.5 rounded-lg w-fit border border-green-100">
                            <CheckCircle2 className="w-4 h-4 shrink-0" />
                            <span className="text-xs font-medium line-clamp-1 max-w-[200px]" title={req.admin_response}>
                              {req.admin_response}
                            </span>
                          </div>
                        ) : (
                          <span className="text-gray-400 italic text-sm">Chưa phản hồi</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-full"
                            onClick={() => handleViewClick(req)}
                            title="Xem chi tiết"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          
                          {isPending && (
                            <>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-8 w-8 text-gray-500 hover:text-yellow-600 hover:bg-yellow-50 rounded-full"
                                onClick={() => handleEditClick(req)}
                                title="Chỉnh sửa"
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-8 w-8 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-full"
                                onClick={() => handleDelete(req.id)}
                                title="Xóa"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        
        {/* Table Footer / Pagination placeholder */}
        {filteredRequests.length > 0 && (
          <div className="px-6 py-3 border-t bg-white text-xs text-gray-500 flex justify-between items-center">
            <span>Hiển thị <strong>{filteredRequests.length}</strong> yêu cầu</span>
          </div>
        )}
      </div>

      {/* --- View Details Modal --- */}
      <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[85vh] p-0 overflow-hidden flex flex-col rounded-2xl">
          <div className="px-6 py-4 pr-14 border-b bg-gray-50/50 flex justify-between items-center">
            <div>
              <DialogTitle className="text-lg font-bold text-gray-800">Chi tiết Yêu cầu</DialogTitle>
              {selectedTicket && (
                <p className="text-xs text-gray-500 mt-1">
                  Gửi ngày {format(new Date(selectedTicket.created_at), "dd/MM/yyyy 'lúc' HH:mm", { locale: vi })}
                </p>
              )}
            </div>
            {selectedTicket && (
              <span className={cn(
                "px-3 py-1 rounded-full text-xs font-bold uppercase tracking-tight", 
                (STATUS_CONFIG[selectedTicket.status] || STATUS_CONFIG.PENDING).bg, 
                (STATUS_CONFIG[selectedTicket.status] || STATUS_CONFIG.PENDING).text
              )}>
                {(STATUS_CONFIG[selectedTicket.status] || STATUS_CONFIG.PENDING).label}
              </span>
            )}
          </div>
          
          <ScrollArea className="flex-1 p-6">
            {selectedTicket && (
              <div className="space-y-8">
                {/* User Request Section */}
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3 flex items-center gap-2">
                    <MessageSquare className="w-4 h-4" /> Nội dung của bạn
                  </h3>
                  <div className="prose prose-sm max-w-none text-gray-700 leading-relaxed whitespace-pre-wrap bg-white p-5 rounded-xl border shadow-sm">
                    {selectedTicket.description}
                  </div>
                  {selectedTicket.image_url && (
                    <div className="mt-4">
                      <h4 className="text-[10px] font-bold text-gray-400 uppercase mb-2">Ảnh đính kèm</h4>
                      <a href={selectedTicket.image_url} target="_blank" rel="noreferrer" className="inline-block group">
                        <div className="relative h-48 w-72 rounded-xl overflow-hidden border-2 border-gray-100 shadow-sm group-hover:border-blue-200 group-hover:shadow-md transition-all">
                          <img src={selectedTicket.image_url} alt="Attachment" className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500" />
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                            <span className="bg-white/90 text-gray-800 text-xs font-semibold px-3 py-1.5 rounded-full opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 transition-all duration-300 backdrop-blur-sm">
                              Phóng to
                            </span>
                          </div>
                        </div>
                      </a>
                    </div>
                  )}
                </div>

                {/* Admin Response Section */}
                <div className="pt-6 border-t border-dashed">
                  <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-4 flex items-center gap-2">
                    <Info className="h-4 w-4 text-blue-500" /> Phản hồi từ Ban quản trị
                  </h3>
                  {selectedTicket.admin_response ? (
                    <div className="bg-blue-50/50 border border-blue-100 p-6 rounded-xl shadow-sm relative overflow-hidden">
                      <div className="absolute top-0 left-0 w-1 h-full bg-blue-500"></div>
                      <div className="flex items-start gap-4">
                        <div className="h-10 w-10 rounded-full bg-white border border-blue-100 flex items-center justify-center shrink-0 shadow-sm">
                          <CheckCircle2 className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-1.5">
                            <span className="text-sm font-bold text-gray-800">Admin Holyann</span>
                            <span className="bg-blue-100 text-blue-700 text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full">Hỗ trợ chính thức</span>
                          </div>
                          <div className="text-sm text-gray-700 leading-relaxed bg-white p-4 rounded-lg border border-blue-50 shadow-sm mt-2 whitespace-pre-wrap">
                            {selectedTicket.admin_response}
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-gray-50 border-2 border-dashed border-gray-200 rounded-xl p-8 flex flex-col items-center justify-center text-center">
                      <Clock className="h-8 w-8 text-gray-300 mb-3" />
                      <p className="text-sm text-gray-500 font-medium">Chưa có phản hồi</p>
                      <p className="text-xs text-gray-400 max-w-[250px] mt-1">Yêu cầu của bạn đã được tiếp nhận và đang chờ xử lý. Chúng tôi sẽ phản hồi sớm nhất có thể.</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </ScrollArea>
          <div className="p-4 border-t bg-gray-50 flex justify-end">
             <Button variant="outline" onClick={() => setIsViewModalOpen(false)}>Đóng</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* --- Create/Edit Modal --- */}
      <Dialog open={isFormModalOpen} onOpenChange={(open) => { setIsFormModalOpen(open); if (!open) resetForm(); }}>
        <DialogContent className="sm:max-w-md rounded-2xl p-0 overflow-hidden">
          <form onSubmit={handleSubmit} className="flex flex-col h-full">
            <div className="px-6 py-5 border-b bg-gray-50/50">
              <DialogTitle className="text-xl font-bold text-gray-800">
                {editingRequest ? "Cập nhật yêu cầu" : "Tạo yêu cầu hỗ trợ mới"}
              </DialogTitle>
              <DialogDescription className="text-gray-500 text-sm mt-1">
                {editingRequest 
                  ? "Bạn chỉ có thể cập nhật nội dung khi yêu cầu đang ở trạng thái chờ xử lý."
                  : "Mô tả chi tiết vấn đề bạn gặp phải để được hỗ trợ tốt nhất."}
              </DialogDescription>
            </div>
            <div className="px-6 py-6 space-y-5">
              <div className="space-y-2">
                <Label htmlFor="description" className="text-xs font-bold text-gray-700 uppercase tracking-wide flex items-center gap-1">
                  Nội dung <span className="text-red-500">*</span>
                </Label>
                <Textarea 
                  id="description"
                  placeholder="Nhập mô tả chi tiết vấn đề..."
                  className="min-h-[140px] resize-none bg-white border-gray-200 focus-visible:ring-blue-500 rounded-xl"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  disabled={isSubmitting}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="image" className="text-xs font-bold text-gray-700 uppercase tracking-wide">Ảnh đính kèm (Tùy chọn)</Label>
                <div className="flex flex-col gap-3">
                  <Input id="image" type="file" accept="image/*" onChange={handleFileChange} disabled={isSubmitting} className="cursor-pointer bg-white border-dashed hover:bg-gray-50 transition-colors file:bg-blue-50 file:text-blue-700 file:border-0 file:rounded-md file:px-3 file:py-1 file:font-medium file:mr-3" />
                  {previewUrl && (
                    <div className="relative w-full h-36 rounded-xl border border-gray-200 overflow-hidden bg-gray-50 group">
                      <img src={previewUrl} alt="Preview" className="w-full h-full object-contain" />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors"></div>
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="absolute top-2 right-2 h-8 w-8 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => { setSelectedFile(null); setPreviewUrl(null); setKeepExistingImage(false); }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="px-6 py-4 border-t bg-gray-50 flex justify-end gap-3 mt-auto">
              <Button type="button" variant="outline" className="rounded-xl px-5" onClick={() => setIsFormModalOpen(false)} disabled={isSubmitting}>Hủy</Button>
              <Button type="submit" disabled={isSubmitting} className="bg-blue-600 hover:bg-blue-700 rounded-xl px-6 font-medium shadow-sm">
                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                {editingRequest ? "Lưu thay đổi" : "Gửi yêu cầu"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
