'use client';

import React, { useState, useEffect, useMemo } from 'react';
import RoleGuard from '@/components/auth/RoleGuard';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Upload, Download, RefreshCw, Plus, Trash2 } from 'lucide-react';

type Row = {
  id: number;
  qs_rank: number;
  previous_rank?: string | null;
  name: string;
  country: string;
  country_code: string | null;
  region: string | null;
  size?: string | null;
  qs_overall_score: number | null;
  ranking_year?: number;
};

/** Legacy tối thiểu (có thể thêm cột như API bulk hỗ trợ) */
const LEGACY_CSV_MIN_HEADER =
  'qs_rank,name,country,country_code,region,size,focus,research_level,type,qs_overall_score,ranking_year,academic_reputation,employer_reputation,faculty_student_ratio,citations_per_faculty,international_faculty,international_students,isd_score,irn_score,eo_score,sus_score';

export default function AdminUniversityRankingsPage() {
  const [list, setList] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageQuery, setPageQuery] = useState('1');
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [bulkResult, setBulkResult] = useState<{
    created: number;
    updated: number;
    errors?: string[];
  } | null>(null);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [addSaving, setAddSaving] = useState(false);
  const [addForm, setAddForm] = useState({
    qs_rank: '',
    name: '',
    country: '',
    country_code: '',
    region: '',
    type: '',
    qs_overall_score: '0',
    academic_reputation: '0',
    employer_reputation: '0',
    faculty_student_ratio: '0',
    citations_per_faculty: '0',
    international_faculty: '0',
    international_students: '0',
  });
  const [search, setSearch] = useState('');
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [schoolToDelete, setSchoolToDelete] = useState<Row | null>(null);

  const load = () => {
    setLoading(true);
    fetch('/api/admin/university-rankings')
      .then((r) => r.json())
      .then((data) => setList(data.universities ?? []))
      .finally(() => setLoading(false));
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetch('/api/admin/university-rankings')
      .then((r) => r.json())
      .then((data) => setList(data.universities ?? []))
      .finally(() => setRefreshing(false));
  };

  useEffect(() => {
    load();
  }, []);

  const filteredList = useMemo(
    () =>
      list.filter((u) => {
        const q = search.trim().toLowerCase();
        if (!q) return true;
        return (
          u.name.toLowerCase().includes(q) ||
          u.country.toLowerCase().includes(q) ||
          String(u.qs_rank).includes(q)
        );
      }),
    [list, search],
  );
  const itemsPerPage = 15;
  const totalPages = Math.max(1, Math.ceil(filteredList.length / itemsPerPage));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const indexOfFirstItem = (safeCurrentPage - 1) * itemsPerPage;
  const indexOfLastItem = indexOfFirstItem + itemsPerPage;
  const paginatedList = filteredList.slice(indexOfFirstItem, indexOfLastItem);

  useEffect(() => {
    setCurrentPage(1);
  }, [search]);

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [currentPage, totalPages]);

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

  const handleBulkSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;
    setUploading(true);
    setBulkResult(null);
    const formData = new FormData();
    formData.append('file', file);
    try {
      const res = await fetch('/api/admin/university-rankings/bulk', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setBulkResult({
          created: data.created ?? 0,
          updated: data.updated ?? 0,
          errors: data.errors,
        });
        setFile(null);
        load();
      } else {
        setBulkResult({
          created: 0,
          updated: 0,
          errors: [data.error || data.detail || 'Upload thất bại'],
        });
      }
    } finally {
      setUploading(false);
    }
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddSaving(true);
    try {
      const payload = {
        qs_rank: Number(addForm.qs_rank),
        name: addForm.name.trim(),
        country: addForm.country.trim(),
        country_code: addForm.country_code.trim() || null,
        region: addForm.region.trim() || null,
        type: addForm.type.trim() || null,
        qs_overall_score: Number(addForm.qs_overall_score) || 0,
        academic_reputation: Number(addForm.academic_reputation) || 0,
        employer_reputation: Number(addForm.employer_reputation) || 0,
        faculty_student_ratio: Number(addForm.faculty_student_ratio) || 0,
        citations_per_faculty: Number(addForm.citations_per_faculty) || 0,
        international_faculty: Number(addForm.international_faculty) || 0,
        international_students: Number(addForm.international_students) || 0,
      };
      const res = await fetch('/api/admin/university-rankings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setAddModalOpen(false);
        setAddForm({
          qs_rank: '',
          name: '',
          country: '',
          country_code: '',
          region: '',
          type: '',
          qs_overall_score: '0',
          academic_reputation: '0',
          employer_reputation: '0',
          faculty_student_ratio: '0',
          citations_per_faculty: '0',
          international_faculty: '0',
          international_students: '0',
        });
        load();
      } else {
        alert(data.error || 'Tạo trường thất bại');
      }
    } finally {
      setAddSaving(false);
    }
  };

  const handleDeleteClick = (u: Row) => {
    setSchoolToDelete(u);
  };

  const handleConfirmDelete = async () => {
    if (!schoolToDelete) return;
    const id = schoolToDelete.id;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/admin/university-rankings/${id}`, { method: 'DELETE' });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setSchoolToDelete(null);
        load();
      } else {
        alert(data.error || 'Không thể xóa trường');
      }
    } finally {
      setDeletingId(null);
    }
  };

  const downloadTemplate = () => {
    const line =
      LEGACY_CSV_MIN_HEADER +
      '\n1,MIT,United States,US,Americas,M,CO,VH,Private not for Profit,100,2026,100,100,100,100,100,100,90,90,90,90';
    const blob = new Blob([line], { type: 'text/csv;charset=utf-8;' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'university-rankings-template.csv';
    a.click();
    URL.revokeObjectURL(a.href);
  };

  return (
    <RoleGuard allowedRoles={['admin', 'ADMIN']}>
      <div className="w-full max-w-6xl mx-auto min-h-[300px] p-6 md:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <h1 className="text-2xl font-bold text-foreground">Xếp hạng trường (QS World)</h1>
          <div className="flex flex-wrap items-center gap-2">
            <Button size="sm" onClick={() => setAddModalOpen(true)} className="gap-1">
              <Plus className="h-4 w-4" /> Add school
            </Button>
            <Button variant="outline" size="sm" onClick={downloadTemplate} className="gap-1">
              <Download className="h-4 w-4" /> Tải mẫu CSV
            </Button>
            <Button variant="outline" size="sm" onClick={handleRefresh} disabled={loading || refreshing} className="gap-1">
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} /> {refreshing ? 'Đang tải lại...' : 'Tải lại'}
            </Button>
          </div>
        </div>

        {/* Bulk upload */}
        <form
          onSubmit={handleBulkSubmit}
          className="mb-6 p-4 rounded-xl border border-border bg-card flex flex-col sm:flex-row sm:items-end gap-3"
        >
          <div className="flex-1">
            <label className="block text-sm font-medium mb-1">
              Bulk upsert từ CSV (QS 2026 export hoặc legacy)
            </label>
            <input
              type="file"
              accept=".csv,text/csv,text/plain"
              className="w-full text-sm text-foreground file:mr-2 file:py-2 file:px-3 file:rounded-lg file:border-0 file:bg-primary file:text-primary-foreground file:text-sm"
              onChange={(e) => {
                setFile(e.target.files?.[0] ?? null);
                setBulkResult(null);
              }}
            />
          </div>
          <Button type="submit" disabled={!file || uploading} className="gap-1 shrink-0">
            <Upload className="h-4 w-4" /> {uploading ? 'Đang xử lý...' : 'Tải lên'}
          </Button>
        </form>

        {bulkResult && (
          <div className="mb-6 p-4 rounded-xl border border-border bg-muted/30">
            <p className="text-sm font-medium text-foreground">
              Kết quả: {bulkResult.created} tạo mới, {bulkResult.updated} cập nhật.
            </p>
            {bulkResult.errors && bulkResult.errors.length > 0 && (
              <ul className="mt-2 text-sm text-destructive list-disc list-inside">
                {bulkResult.errors.slice(0, 10).map((err, i) => (
                  <li key={i}>{err}</li>
                ))}
                {bulkResult.errors.length > 10 && (
                  <li>... và {bulkResult.errors.length - 10} lỗi khác</li>
                )}
              </ul>
            )}
          </div>
        )}

        {/* Search + Table */}
        {loading ? (
          <div className="rounded-xl border border-border overflow-hidden bg-card">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    <th className="text-left p-3 font-semibold">#</th>
                    <th className="text-left p-3 font-semibold">QS</th>
                    <th className="text-left p-3 font-semibold">2025</th>
                    <th className="text-left p-3 font-semibold min-w-[200px]">Tên trường</th>
                    <th className="text-left p-3 font-semibold">Quốc gia</th>
                    <th className="text-left p-3 font-semibold">Khu vực</th>
                    <th className="text-left p-3 font-semibold">Size</th>
                    <th className="text-left p-3 font-semibold">Năm</th>
                    <th className="text-left p-3 font-semibold">Điểm</th>
                    <th className="text-right p-3 font-semibold w-20">Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {Array.from({ length: 8 }).map((_, idx) => (
                    <tr key={idx} className="border-b border-border">
                      <td className="p-3"><div className="h-3 w-10 rounded bg-muted animate-pulse" /></td>
                      <td className="p-3"><div className="h-3 w-8 rounded bg-muted animate-pulse" /></td>
                      <td className="p-3"><div className="h-3 w-12 rounded bg-muted animate-pulse" /></td>
                      <td className="p-3"><div className="h-3 w-44 rounded bg-muted animate-pulse" /></td>
                      <td className="p-3"><div className="h-3 w-24 rounded bg-muted animate-pulse" /></td>
                      <td className="p-3"><div className="h-3 w-20 rounded bg-muted animate-pulse" /></td>
                      <td className="p-3"><div className="h-3 w-10 rounded bg-muted animate-pulse" /></td>
                      <td className="p-3"><div className="h-3 w-8 rounded bg-muted animate-pulse" /></td>
                      <td className="p-3"><div className="h-3 w-12 rounded bg-muted animate-pulse" /></td>
                      <td className="p-3"><div className="ml-auto h-7 w-7 rounded bg-muted animate-pulse" /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <>
            <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="sm:w-80">
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Tìm theo tên trường, quốc gia, QS rank..."
                  className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm text-foreground shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Đang hiển thị {filteredList.length} / {list.length} trường
              </p>
            </div>
            <div className="rounded-xl border border-border overflow-hidden bg-card">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/50">
                      <th className="text-left p-3 font-semibold">#</th>
                      <th className="text-left p-3 font-semibold">QS</th>
                      <th className="text-left p-3 font-semibold">2025</th>
                      <th className="text-left p-3 font-semibold min-w-[200px]">Tên trường</th>
                      <th className="text-left p-3 font-semibold">Quốc gia</th>
                      <th className="text-left p-3 font-semibold">Khu vực</th>
                      <th className="text-left p-3 font-semibold">Size</th>
                      <th className="text-left p-3 font-semibold">Năm</th>
                      <th className="text-left p-3 font-semibold">Điểm</th>
                      <th className="text-right p-3 font-semibold w-20">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedList.map((u) => (
                      <tr key={u.id} className="border-b border-border hover:bg-muted/30">
                        <td className="p-3 text-muted-foreground">{u.id}</td>
                        <td className="p-3 font-medium">{u.qs_rank}</td>
                        <td className="p-3 text-xs text-muted-foreground max-w-[72px] truncate" title={u.previous_rank ?? ''}>
                          {u.previous_rank ?? '—'}
                        </td>
                        <td className="p-3">{u.name}</td>
                        <td className="p-3">{u.country}</td>
                        <td className="p-3 text-xs">{u.region ?? '—'}</td>
                        <td className="p-3 text-xs">{u.size ?? '—'}</td>
                        <td className="p-3 text-xs">{u.ranking_year ?? '—'}</td>
                        <td className="p-3">{u.qs_overall_score != null ? u.qs_overall_score.toFixed(1) : '—'}</td>
                        <td className="p-3 text-right">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:bg-destructive/10 hover:text-destructive"
                            onClick={() => handleDeleteClick(u)}
                            disabled={deletingId === u.id}
                            title="Xóa trường"
                          >
                            {deletingId === u.id ? (
                              <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {filteredList.length === 0 && (
                <p className="text-center text-muted-foreground py-8">
                  Không tìm thấy trường phù hợp với từ khóa.
                </p>
              )}
              {filteredList.length > 0 && (
                <div className="flex items-center justify-between px-4 py-3 border-t border-border bg-muted/30">
                  <div className="text-sm text-muted-foreground">
                    Hiển thị {indexOfFirstItem + 1}-{Math.min(indexOfLastItem, filteredList.length)} / {filteredList.length}
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                      disabled={safeCurrentPage === 1}
                      className="px-3 py-1.5 text-sm rounded-md border border-border bg-background text-foreground hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Trước
                    </button>
                    {visiblePages.map((page, index) => {
                      const prev = visiblePages[index - 1];
                      const showGap = index > 0 && prev != null && page - prev > 1;
                      return (
                        <React.Fragment key={page}>
                          {showGap && (
                            <span className="px-1.5 py-1.5 text-sm text-muted-foreground">...</span>
                          )}
                          <button
                            type="button"
                            onClick={() => setCurrentPage(page)}
                            className={`min-w-8 px-2.5 py-1.5 text-sm rounded-md border transition-colors ${
                              safeCurrentPage === page
                                ? 'border-primary bg-primary text-primary-foreground'
                                : 'border-border bg-background text-foreground hover:bg-muted'
                            }`}
                          >
                            {page}
                          </button>
                        </React.Fragment>
                      );
                    })}
                    <button
                      type="button"
                      onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                      disabled={safeCurrentPage === totalPages}
                      className="px-3 py-1.5 text-sm rounded-md border border-border bg-background text-foreground hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Sau
                    </button>
                    <div className="hidden sm:flex items-center gap-1 ml-1">
                      <input
                        type="number"
                        min={1}
                        max={totalPages}
                        value={pageQuery}
                        onChange={(e) => setPageQuery(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') jumpToPage();
                        }}
                        className="w-16 h-8 rounded-md border border-input bg-background px-2 text-xs text-foreground"
                        aria-label="Nhập số trang"
                      />
                      <button
                        type="button"
                        onClick={jumpToPage}
                        className="px-2.5 py-1.5 text-xs rounded-md border border-border bg-background text-foreground hover:bg-muted"
                      >
                        Đi
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </>
        )}

        {/* Modal cảnh báo xóa trường */}
        <Dialog open={!!schoolToDelete} onOpenChange={(open) => !open && setSchoolToDelete(null)}>
          <DialogContent className="sm:max-w-md p-6 gap-6">
            <div className="flex flex-col items-center text-center">
              <div className="flex items-center justify-center w-14 h-14 rounded-full bg-destructive/10 mb-2">
                <Trash2 className="h-7 w-7 text-destructive" />
              </div>
              <DialogHeader className="pb-0">
                <DialogTitle className="text-lg">Xác nhận xóa trường</DialogTitle>
              </DialogHeader>
              <p className="text-sm text-muted-foreground mt-2 mb-4">
                Bạn có chắc chắn muốn xóa trường{' '}
                <span className="font-semibold text-foreground">{schoolToDelete?.name}</span>?
                <br />
                Hành động này không thể hoàn tác.
              </p>
              <div className="flex gap-3 w-full pt-2">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => setSchoolToDelete(null)}
                  disabled={!!deletingId}
                >
                  Hủy
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  className="flex-1"
                  onClick={handleConfirmDelete}
                  disabled={!!deletingId}
                >
                  {deletingId ? 'Đang xóa...' : 'Xóa'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        <div className="mt-4 max-w-full rounded-lg border border-border bg-muted/20 p-3 space-y-2">
          <p className="text-xs font-medium text-foreground">Định dạng CSV</p>
          <p className="text-xs text-muted-foreground">
            <strong>QS 2026 (khuyến nghị):</strong> file export dạng &quot;2026 Ranking.csv&quot; — hệ thống tự nhận dòng header có{' '}
            <code className="rounded bg-muted/50 px-1">Index, Rank, Country/Territory, Overall SCORE</code>.
            Ghép/cập nhật theo <strong>tên trường + quốc gia</strong>.
          </p>
          <p className="text-xs text-muted-foreground break-words">
            <strong>Legacy:</strong> header{' '}
            <code className="break-all rounded bg-muted/50 px-1 py-0.5 text-[11px]">{LEGACY_CSV_MIN_HEADER}</code>
          </p>
        </div>

        {/* Add school modal */}
        <Dialog open={addModalOpen} onOpenChange={setAddModalOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col gap-0 p-0">
            <div className="shrink-0 px-6 pt-6 pb-2 pr-10 border-b border-border">
              <DialogHeader>
                <DialogTitle>Add school</DialogTitle>
              </DialogHeader>
            </div>
            <div className="flex-1 overflow-y-auto px-6 py-4">
            <form onSubmit={handleAddSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">QS Rank *</label>
                  <input
                    type="number"
                    required
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                    value={addForm.qs_rank}
                    onChange={(e) => setAddForm((f) => ({ ...f, qs_rank: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Tên trường *</label>
                  <input
                    type="text"
                    required
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                    value={addForm.name}
                    onChange={(e) => setAddForm((f) => ({ ...f, name: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Quốc gia *</label>
                  <input
                    type="text"
                    required
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                    value={addForm.country}
                    onChange={(e) => setAddForm((f) => ({ ...f, country: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Mã quốc gia (ISO2)</label>
                  <input
                    type="text"
                    placeholder="US, GB — để trống nếu chưa có"
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                    value={addForm.country_code}
                    onChange={(e) => setAddForm((f) => ({ ...f, country_code: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Khu vực</label>
                  <input
                    type="text"
                    placeholder="Asia, Europe, ..."
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                    value={addForm.region}
                    onChange={(e) => setAddForm((f) => ({ ...f, region: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Loại</label>
                  <input
                    type="text"
                    placeholder="Public, Private"
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                    value={addForm.type}
                    onChange={(e) => setAddForm((f) => ({ ...f, type: e.target.value }))}
                  />
                </div>
              </div>
              <p className="text-xs text-muted-foreground">Điểm số (0–100)</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  'qs_overall_score',
                  'academic_reputation',
                  'employer_reputation',
                  'faculty_student_ratio',
                  'citations_per_faculty',
                  'international_faculty',
                  'international_students',
                ].map((key) => (
                  <div key={key}>
                    <label className="block text-xs font-medium mb-0.5">
                      {key.replace(/_/g, ' ')}
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      max="100"
                      required
                      className="w-full rounded-lg border border-border bg-background px-2 py-1.5 text-sm"
                      value={addForm[key as keyof typeof addForm]}
                      onChange={(e) =>
                        setAddForm((f) => ({ ...f, [key]: e.target.value }))
                      }
                    />
                  </div>
                ))}
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={() => setAddModalOpen(false)}>
                  Hủy
                </Button>
                <Button type="submit" disabled={addSaving}>
                  {addSaving ? 'Đang lưu...' : 'Thêm trường'}
                </Button>
              </div>
            </form>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </RoleGuard>
  );
}
