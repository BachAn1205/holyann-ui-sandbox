'use client';

import React, { useState, useEffect, useMemo } from 'react';
import RoleGuard from '@/components/auth/RoleGuard';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Check, Trash2, Search, Loader2 } from 'lucide-react';

type MajorRow = {
  id: number;
  occupation_name: string;
  industry_group: string | null;
  occupation_code: string | null;
  status: string;
  created_by_user_id: string | null;
};

export default function AdminMajorsPage() {
  const [list, setList] = useState<MajorRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [actionId, setActionId] = useState<number | null>(null);

  const load = () => {
    setLoading(true);
    fetch('/api/admin/majors')
      .then((r) => r.json())
      .then((data) => setList(data.majors ?? []))
      .catch(() => toast.error('Không tải được danh sách ngành'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const filteredList = useMemo(() => {
    return list.filter((m) => {
      const q = search.trim().toLowerCase();
      if (!q) return true;
      return (
        m.occupation_name.toLowerCase().includes(q) ||
        (m.industry_group || '').toLowerCase().includes(q)
      );
    });
  }, [list, search]);

  const handleApprove = async (id: number) => {
    setActionId(id);
    try {
      const res = await fetch(`/api/admin/majors/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'APPROVED' }),
      });
      if (res.ok) {
        toast.success('Đã duyệt ngành');
        setList((prev) =>
          prev.map((m) => (m.id === id ? { ...m, status: 'APPROVED' } : m))
        );
      } else {
        const data = await res.json();
        toast.error(data.error || 'Lỗi khi duyệt');
      }
    } catch {
      toast.error('Lỗi kết nối');
    } finally {
      setActionId(null);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Bạn có chắc chắn muốn xóa ngành này không?')) return;
    setActionId(id);
    try {
      const res = await fetch(`/api/admin/majors/${id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        toast.success('Đã xóa ngành');
        setList((prev) => prev.filter((m) => m.id !== id));
      } else {
        const data = await res.json();
        toast.error(data.error || 'Lỗi khi xóa');
      }
    } catch {
      toast.error('Lỗi kết nối');
    } finally {
      setActionId(null);
    }
  };

  return (
    <RoleGuard allowedRoles={['ADMIN', 'admin']}>
      <div className="p-6">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold">Danh sách Ngành học</h1>
        </div>

        <div className="mb-4 relative max-w-sm">
          <input
            type="text"
            placeholder="Tìm kiếm theo tên ngành..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-border px-10 py-2"
          />
          <Search className="absolute left-3 top-2.5 size-5 text-muted-foreground" />
        </div>

        <div className="rounded-xl border bg-card shadow">
          {loading ? (
            <div className="p-8 text-center text-muted-foreground">Đang tải...</div>
          ) : filteredList.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">Không có dữ liệu.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b bg-muted/50 text-muted-foreground">
                    <th className="px-4 py-3">ID</th>
                    <th className="px-4 py-3">Tên ngành</th>
                    <th className="px-4 py-3">Nhóm ngành</th>
                    <th className="px-4 py-3">Code</th>
                    <th className="px-4 py-3">Trạng thái</th>
                    <th className="px-4 py-3">Hành động</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredList.map((m) => {
                    const isPending = m.status === 'PENDING';
                    const isProcessing = actionId === m.id;
                    return (
                      <tr key={m.id} className="border-b hover:bg-muted/20">
                        <td className="px-4 py-3">{m.id}</td>
                        <td className="px-4 py-3 font-medium">{m.occupation_name}</td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {m.industry_group || '-'}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {m.occupation_code || '-'}
                        </td>
                        <td className="px-4 py-3">
                          {isPending ? (
                            <span className="inline-flex rounded-full bg-orange-100 px-2 py-1 text-xs font-semibold text-orange-700">
                              Chờ duyệt
                            </span>
                          ) : (
                            <span className="inline-flex rounded-full bg-green-100 px-2 py-1 text-xs font-semibold text-green-700">
                              Đã duyệt
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex justify-end gap-2">
                            {isPending && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleApprove(m.id)}
                                disabled={isProcessing}
                                className="border-green-200 text-green-700 hover:bg-green-50"
                              >
                                {isProcessing ? (
                                  <Loader2 className="size-4 animate-spin" />
                                ) : (
                                  <Check className="size-4" />
                                )}
                                <span className="ml-1">Duyệt</span>
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDelete(m.id)}
                              disabled={isProcessing}
                              className="border-red-200 text-red-700 hover:bg-red-50"
                            >
                              {isProcessing && !isPending && (
                                <Loader2 className="size-4 animate-spin" />
                              )}
                              {!isProcessing || isPending ? (
                                <Trash2 className="size-4" />
                              ) : null}
                              <span className="ml-1">Xóa</span>
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </RoleGuard>
  );
}
