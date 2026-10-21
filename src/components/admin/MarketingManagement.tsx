"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Loader2, Megaphone, Pencil, Plus, Search, Users } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { MarketingPostListItem, MarketingPostStatus } from "@/types/marketing";

type PlacementFilter = "ALL" | "Slider" | "Banner" | "Normal";

const statusLabel: Record<MarketingPostStatus, string> = {
  DRAFT: "Đang làm",
  PUBLISHED: "Đã xong",
};

function formatDate(value?: string | null) {
  if (!value) return "-";
  return new Date(value).toLocaleDateString("vi-VN");
}

export default function MarketingManagement() {
  const [posts, setPosts] = useState<MarketingPostListItem[]>([]);
  const [marketingUsers, setMarketingUsers] = useState<
    Array<{
      id: string;
      full_name: string;
      email: string;
      is_active: boolean;
      created_at?: string;
    }>
  >([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | MarketingPostStatus>("ALL");
  const [placementFilter, setPlacementFilter] = useState<PlacementFilter>("ALL");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageQuery, setPageQuery] = useState("1");
  const itemsPerPage = 10;

  const fetchPosts = async (isManualRefresh = false) => {
    try {
      if (isManualRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      const response = await fetch("/api/marketing/posts", { credentials: "include" });
      if (!response.ok) return;
      const data = await response.json();
      setPosts(data.posts ?? []);
    } catch (error) {
      console.error("Failed to fetch marketing posts:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchMarketingUsers = async () => {
    try {
      const response = await fetch("/api/admin/users", { credentials: "include" });
      if (!response.ok) return;
      const data = await response.json();
      const users = Array.isArray(data?.users) ? data.users : [];
      const filtered = users
        .filter((user: { role?: string }) => user.role === "MARKETING")
        .map(
          (user: {
            id: string;
            full_name: string;
            email: string;
            is_active: boolean;
            created_at?: string;
          }) => ({
            id: user.id,
            full_name: user.full_name,
            email: user.email,
            is_active: Boolean(user.is_active),
            created_at: user.created_at,
          }),
        );
      setMarketingUsers(filtered);
    } catch (error) {
      console.error("Failed to fetch marketing users:", error);
    }
  };

  useEffect(() => {
    void fetchPosts();
    void fetchMarketingUsers();
  }, []);

  const stats = useMemo(() => {
    const total = posts.length;
    const published = posts.filter((post) => post.status === "PUBLISHED").length;
    const draft = posts.filter((post) => post.status === "DRAFT").length;
    const slider = posts.filter((post) => post.placement === "Slider").length;
    const marketers = marketingUsers.length;
    const activeMarketers = marketingUsers.filter((user) => user.is_active).length;
    return { total, published, draft, slider, marketers, activeMarketers };
  }, [posts, marketingUsers]);

  const filteredPosts = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase();
    return posts.filter((post) => {
      const matchesKeyword =
        !keyword ||
        post.title.toLowerCase().includes(keyword) ||
        post.slug.toLowerCase().includes(keyword) ||
        post.author.full_name.toLowerCase().includes(keyword);
      const matchesStatus = statusFilter === "ALL" || post.status === statusFilter;
      const matchesPlacement =
        placementFilter === "ALL" || (post.placement ?? "Normal") === placementFilter;
      return matchesKeyword && matchesStatus && matchesPlacement;
    });
  }, [posts, searchTerm, statusFilter, placementFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredPosts.length / itemsPerPage));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const indexOfFirstItem = (safeCurrentPage - 1) * itemsPerPage;
  const indexOfLastItem = indexOfFirstItem + itemsPerPage;
  const paginatedPosts = filteredPosts.slice(indexOfFirstItem, indexOfLastItem);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, placementFilter]);

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [currentPage, totalPages]);

  useEffect(() => {
    setPageQuery(String(safeCurrentPage));
  }, [safeCurrentPage]);

  const visiblePages = useMemo(() => {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
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

  return (
    <div className="w-full max-w-6xl mx-auto min-h-[300px] flex flex-col">
      <div className="flex-1 p-6 md:p-8 space-y-8">
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1">
              <h1 className="text-2xl font-semibold text-foreground flex items-center gap-2">
                <Megaphone className="h-5 w-5 text-primary" />
                Marketing Management
              </h1>
              <p className="text-sm text-muted-foreground">
                Quản lý pipeline nội dung và theo dõi đội ngũ user marketing tại một nơi.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => void fetchPosts(true)} disabled={refreshing}>
                {refreshing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                {refreshing ? "Refreshing..." : "Refresh"}
              </Button>
              <Button size="sm" asChild>
                <Link href="/marketing/posts/new">
                  <Plus className="mr-2 h-4 w-4" />
                  Tạo post
                </Link>
              </Button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4">
          <div className="rounded-xl border border-border p-4 bg-card">
            <p className="text-sm text-muted-foreground">Tổng post</p>
            <p className="text-2xl font-bold text-foreground">{stats.total}</p>
          </div>
          <div className="rounded-xl border border-border p-4 bg-card">
            <p className="text-sm text-muted-foreground">Đã xong</p>
            <p className="text-2xl font-bold text-foreground">{stats.published}</p>
          </div>
          <div className="rounded-xl border border-border p-4 bg-card">
            <p className="text-sm text-muted-foreground">Đang làm</p>
            <p className="text-2xl font-bold text-foreground">{stats.draft}</p>
          </div>
          <div className="rounded-xl border border-border p-4 bg-card">
            <p className="text-sm text-muted-foreground">Slider</p>
            <p className="text-2xl font-bold text-foreground">{stats.slider}</p>
          </div>
          <div className="rounded-xl border border-border p-4 bg-card">
            <p className="text-sm text-muted-foreground">User marketing</p>
            <p className="text-2xl font-bold text-foreground">{stats.marketers}</p>
          </div>
          <div className="rounded-xl border border-border p-4 bg-card">
            <p className="text-sm text-muted-foreground">Marketing active</p>
            <p className="text-2xl font-bold text-foreground">{stats.activeMarketers}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
          <div className="xl:col-span-8 space-y-4">
            <div className="rounded-xl border border-border p-4 bg-card space-y-4">
              <div>
                <p className="text-sm font-semibold text-foreground">Quản lý số lượng post</p>
                <p className="text-xs text-muted-foreground">Lọc nhanh theo trạng thái và vị trí hiển thị để điều phối số lượng nội dung.</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {(["ALL", "DRAFT", "PUBLISHED"] as const).map((value) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setStatusFilter(value)}
                    className={`rounded-full px-3 py-1.5 text-xs border transition-colors ${
                      statusFilter === value
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-background text-foreground hover:bg-muted"
                    }`}
                  >
                    {value === "ALL" ? "Tất cả trạng thái" : statusLabel[value]}
                  </button>
                ))}
              </div>
              <div className="flex flex-wrap gap-2">
                {(["ALL", "Slider", "Banner", "Normal"] as const).map((value) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setPlacementFilter(value)}
                    className={`rounded-full px-3 py-1.5 text-xs border transition-colors ${
                      placementFilter === value
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-background text-foreground hover:bg-muted"
                    }`}
                  >
                    {value === "ALL" ? "Tất cả vị trí" : value}
                  </button>
                ))}
              </div>
              <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                  placeholder="Tìm theo tiêu đề, slug, người phụ trách..."
                />
              </div>
            </div>

            <div className="rounded-xl border border-border bg-card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/20">
                      <th className="text-left py-3 px-4 font-semibold text-muted-foreground">Tiêu đề</th>
                      <th className="text-left py-3 px-4 font-semibold text-muted-foreground">Trạng thái</th>
                      <th className="text-left py-3 px-4 font-semibold text-muted-foreground">Category</th>
                      <th className="text-left py-3 px-4 font-semibold text-muted-foreground">Placement</th>
                      <th className="text-left py-3 px-4 font-semibold text-muted-foreground">Publish</th>
                      <th className="text-left py-3 px-4 font-semibold text-muted-foreground">Cập nhật</th>
                      <th className="text-right py-3 px-4 font-semibold text-muted-foreground">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr>
                        <td colSpan={7} className="py-10 text-center text-muted-foreground">
                          <div className="inline-flex items-center gap-2">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Đang tải dữ liệu...
                          </div>
                        </td>
                      </tr>
                    ) : paginatedPosts.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-10 text-center text-muted-foreground">
                          Không có post phù hợp
                        </td>
                      </tr>
                    ) : (
                      paginatedPosts.map((post) => (
                        <tr key={post.id} className="border-b border-border hover:bg-muted/30 transition-colors">
                          <td className="py-3 px-4">
                            <div className="space-y-0.5">
                              <p className="font-semibold text-foreground">{post.title}</p>
                              <p className="text-xs text-muted-foreground">/{post.slug} • {post.author.full_name}</p>
                            </div>
                          </td>
                          <td className="py-3 px-4">{statusLabel[post.status]}</td>
                          <td className="py-3 px-4">{post.category ?? "-"}</td>
                          <td className="py-3 px-4">{post.placement ?? "-"}</td>
                          <td className="py-3 px-4">{formatDate(post.target_publish_date)}</td>
                          <td className="py-3 px-4">{formatDate(post.updated_at)}</td>
                          <td className="py-3 px-4 text-right">
                            <Button variant="outline" size="sm" asChild>
                              <Link href={`/marketing/posts/${post.id}`}>
                                <Pencil className="h-3.5 w-3.5 mr-1" />
                                Sửa
                              </Link>
                            </Button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {!loading && filteredPosts.length > 0 && (
                <div className="flex items-center justify-between px-4 py-3 border-t border-border bg-muted/30">
                  <div className="text-sm text-muted-foreground">
                    Hiển thị {indexOfFirstItem + 1}-{Math.min(indexOfLastItem, filteredPosts.length)} / {filteredPosts.length}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                      disabled={safeCurrentPage === 1}
                      className="px-3 py-1.5 text-sm rounded-md border border-border bg-background text-foreground hover:bg-muted disabled:opacity-50"
                    >
                      Trước
                    </button>
                    {visiblePages.map((page, index) => {
                      const prev = visiblePages[index - 1];
                      const showGap = index > 0 && prev != null && page - prev > 1;
                      return (
                        <div key={page} className="flex items-center gap-2">
                          {showGap && <span className="px-1 text-sm text-muted-foreground">...</span>}
                          <button
                            type="button"
                            onClick={() => setCurrentPage(page)}
                            className={`min-w-8 px-2.5 py-1.5 text-sm rounded-md border transition-colors ${
                              safeCurrentPage === page
                                ? "border-primary bg-primary text-primary-foreground"
                                : "border-border bg-background text-foreground hover:bg-muted"
                            }`}
                          >
                            {page}
                          </button>
                        </div>
                      );
                    })}
                    <button
                      type="button"
                      onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                      disabled={safeCurrentPage === totalPages}
                      className="px-3 py-1.5 text-sm rounded-md border border-border bg-background text-foreground hover:bg-muted disabled:opacity-50"
                    >
                      Sau
                    </button>
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
                </div>
              )}
            </div>
          </div>

          <div className="xl:col-span-4">
            <div className="rounded-xl border border-border bg-card overflow-hidden">
              <div className="px-4 py-3 border-b border-border bg-muted/20">
                <p className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                  <Users className="h-4 w-4 text-primary" />
                  User role MARKETING
                </p>
                <p className="text-xs text-muted-foreground">Theo dõi ai đang phụ trách vận hành nội dung marketing.</p>
              </div>
              <div className="max-h-[520px] overflow-auto">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 bg-card">
                    <tr className="border-b border-border bg-muted/10">
                      <th className="text-left py-2.5 px-4 font-semibold text-muted-foreground">Tên</th>
                      <th className="text-left py-2.5 px-4 font-semibold text-muted-foreground">Trạng thái</th>
                    </tr>
                  </thead>
                  <tbody>
                    {marketingUsers.length === 0 ? (
                      <tr>
                        <td colSpan={2} className="py-6 px-4 text-center text-muted-foreground">
                          Chưa có user MARKETING
                        </td>
                      </tr>
                    ) : (
                      marketingUsers.map((user) => (
                        <tr key={user.id} className="border-b border-border hover:bg-muted/30 transition-colors">
                          <td className="py-2.5 px-4">
                            <p className="font-medium text-foreground">{user.full_name}</p>
                            <p className="text-xs text-muted-foreground">{user.email}</p>
                          </td>
                          <td className="py-2.5 px-4">
                            <span
                              className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                                user.is_active
                                  ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                                  : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                              }`}
                            >
                              {user.is_active ? "Active" : "Inactive"}
                            </span>
                            <p className="text-[11px] text-muted-foreground mt-1">{formatDate(user.created_at)}</p>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
      <footer className="py-4 text-center text-xs text-muted-foreground border-t border-border mt-4">
        <Megaphone className="inline h-3.5 w-3.5 mr-1" />
        Admin marketing workspace
      </footer>
    </div>
  );
}

