'use client';

import React, { useState, useEffect, useLayoutEffect, useMemo, useCallback, useRef } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, Heart, Loader2, X, GraduationCap, Sparkles, GripVertical } from 'lucide-react';
import { toast } from 'sonner';
import { useAuthSession } from '@/hooks/useAuthSession';
import { WishlistCardBodySkeleton } from '@/components/student/profile/components/WishlistCardBodySkeleton';
import AddUniversityModal from '@/components/student/universities/AddUniversityModal';
import AddMajorModal from '@/components/student/universities/AddMajorModal';

const REGIONS = [
  { value: '', label: 'Tất cả' },
  { value: 'Asia', label: 'Châu Á' },
  { value: 'Europe', label: 'Châu Âu' },
  { value: 'Americas', label: 'Châu Mỹ (QS)' },
  { value: 'North America', label: 'Bắc Mỹ' },
  { value: 'Oceania', label: 'Châu Đại Dương' },
  { value: 'Latin America', label: 'Mỹ Latin' },
  { value: 'Africa', label: 'Châu Phi' },
  { value: 'Middle East & Africa', label: 'Trung Đông & Châu Phi' },
];

/** Số trường mỗi trang (khớp API mặc định) */
const PAGE_SIZE = 24;
const FACULTY_PAGE_SIZE = 24;
const DEBUG_ENDPOINT = 'http://127.0.0.1:7531/ingest/26e7cef7-6404-4091-9692-fb85f8338cc0';
const DEBUG_SESSION_ID = '25e340';

const RANK_RANGES = [
  { value: '', label: 'Tất cả', min: 1, max: 99999 },
  { value: '10', label: 'Top 10', min: 1, max: 10 },
  { value: '25', label: 'Top 25', min: 1, max: 25 },
  { value: '50', label: 'Top 50', min: 1, max: 50 },
  { value: '100', label: 'Top 100', min: 1, max: 100 },
  { value: '500', label: 'Top 500', min: 1, max: 500 },
  { value: '1500', label: 'Top 1500', min: 1, max: 1500 },
];

function FlagImage({ countryCode }: { countryCode: string }) {
  if (!countryCode || countryCode.length !== 2) return <span>🌍</span>;
  const code = countryCode.toLowerCase();
  return (
    <img
      src={`https://flagcdn.com/20x15/${code}.png`}
      srcSet={`https://flagcdn.com/40x30/${code}.png 2x`}
      width={20}
      height={15}
      alt={countryCode}
      className="inline-block rounded-sm align-middle shadow-sm"
      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
    />
  );
}

type University = {
  id: number;
  qs_rank: number | null;
  previous_rank?: string | null;
  name: string;
  country: string;
  country_code: string | null;
  region: string | null;
  size?: string | null;
  focus?: string | null;
  research_level?: string | null;
  type: string | null;
  qs_overall_score: number | null;
  ranking_year?: number;
  academic_reputation?: number;
  employer_reputation?: number;
  status?: 'APPROVED' | 'PENDING';
  created_by_user_id?: string | null;
  website_url?: string | null;
};

type MajorItem = {
  id: number;
  occupation_name: string;
  industry_group: string | null;
  occupation_code: string | null;
  major_score: number | null;
  job_zone: number | null;
  status?: string;
  created_by_user_id?: string | null;
};

function RankBadge({ rank }: { rank: number | null }) {
  if (rank == null) {
    return (
      <span className="inline-flex h-8 min-w-8 items-center justify-center rounded-lg bg-muted px-2 text-sm font-bold text-muted-foreground">
        N/A
      </span>
    );
  }

  const isTop10 = rank <= 10;
  const bgClass = isTop10
    ? 'bg-amber-500 text-amber-950 dark:bg-amber-400 dark:text-amber-950 shadow-[0_0_12px_rgba(245,158,11,0.4)]'
    : 'bg-amber-500 text-amber-950 dark:bg-amber-400 dark:text-amber-950';
  return (
    <span
      className={`inline-flex h-8 min-w-8 items-center justify-center rounded-lg px-2 text-sm font-bold ${bgClass}`}
    >
      #{rank}
    </span>
  );
}

function isPendingUniversity(university?: Pick<University, 'status' | 'qs_rank'> | null) {
  if (!university) return false;
  return university.status === 'PENDING' || university.qs_rank == null;
}

/** Tương tự, dùng để check hiển thị badge cho phần Major */
function isPendingMajor(major?: Pick<MajorItem, 'status'> | null) {
  if (!major) return false;
  return major.status === 'PENDING';
}

/** Skeleton lưới trường — không chặn sidebar; danh sách trường lazy tải độc lập wishlist. */
function UniversityGridSkeleton() {
  return (
    <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3" aria-busy="true" aria-label="Đang tải danh sách trường">
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="flex min-h-[260px] flex-col rounded-2xl border border-border bg-card p-5 animate-pulse"
          style={{ animationDelay: `${i * 40}ms` }}
        >
          <div className="mb-3 flex justify-between gap-2">
            <div className="h-8 w-14 rounded-lg bg-muted" />
            <div className="h-4 w-24 max-w-[40%] rounded bg-muted/80" />
          </div>
          <div className="mb-2 h-7 w-[85%] rounded-md bg-muted" />
          <div className="mb-2 h-4 w-full rounded bg-muted/70" />
          <div className="mb-4 h-1.5 w-full rounded-full bg-muted/60" />
          <div className="mt-auto h-4 w-32 rounded bg-muted/50" />
        </div>
      ))}
    </div>
  );
}

export default function StudentUniversitiesPage() {
  const { session } = useAuthSession();
  const studentId = useMemo(() => {
    const id = (session?.user as { id?: string })?.id ?? (session?.user as { user_id?: string })?.user_id;
    return id ? String(id) : null;
  }, [session?.user]);

  const [universities, setUniversities] = useState<University[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [region, setRegion] = useState('');
  const [rankRange, setRankRange] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [isSearchDropdownOpen, setIsSearchDropdownOpen] = useState(false);
  const [isAddUniversityModalOpen, setIsAddUniversityModalOpen] = useState(false);
  const [countryInput, setCountryInput] = useState('');

  const [countries, setCountries] = useState<{ country: string; region: string | null }[]>([]);
  const [isCountryDropdownOpen, setIsCountryDropdownOpen] = useState(false);
  const countryDropdownRef = useRef<HTMLDivElement>(null);
  const searchDropdownRef = useRef<HTMLDivElement>(null);

  const [wishlistLimit, setWishlistLimit] = useState(2);
  const [wishlistSaved, setWishlistSaved] = useState<{ university_id: number; name?: string; sort_order: number }[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<number[]>([]);
  const [wishlistSaving, setWishlistSaving] = useState(false);
  const [wishlistError, setWishlistError] = useState<string | null>(null);
  const schoolDragIndexRef = useRef<number | null>(null);
  const [schoolDragOverIndex, setSchoolDragOverIndex] = useState<number | null>(null);
  /** Đã nhận phản hồi wishlist trường — tim không chờ danh sách QS. */
  const [schoolWishlistReady, setSchoolWishlistReady] = useState(() => !studentId);
  /** Đã nhận wishlist ngành + (tuỳ chọn) gợi ý AI — tách khỏi /api/majors. */
  const [facultyWishlistReady, setFacultyWishlistReady] = useState(() => !studentId);

  const [isInitialized, setIsInitialized] = useState(false);
  const [activeTab, setActiveTab] = useState<'university' | 'faculty'>('university');

  const [majors, setMajors] = useState<MajorItem[]>([]);
  const [majorsLoading, setMajorsLoading] = useState(false);
  const [majorSearchInput, setMajorSearchInput] = useState('');
  const [isAddMajorModalOpen, setIsAddMajorModalOpen] = useState(false);
  const [recommendedFacultyNames, setRecommendedFacultyNames] = useState<string[]>([]);
  const [facultyWishlistLimit, setFacultyWishlistLimit] = useState(2);
  const [facultyWishlistSaved, setFacultyWishlistSaved] = useState<{ faculty_name: string; sort_order: number }[]>([]);
  const [selectedFacultyOrder, setSelectedFacultyOrder] = useState<string[]>([]);
  const [facultyWishlistSaving, setFacultyWishlistSaving] = useState(false);
  const [facultyWishlistError, setFacultyWishlistError] = useState<string | null>(null);
  const facultyDragIndexRef = useRef<number | null>(null);
  const [facultyDragOverIndex, setFacultyDragOverIndex] = useState<number | null>(null);
  const [facultyPage, setFacultyPage] = useState(1);
  const [industryFilter, setIndustryFilter] = useState('');
  const [onlyRecommended, setOnlyRecommended] = useState(false);

  useEffect(() => {
    const saved = sessionStorage.getItem('universityFilters');
    if (saved) {
      try {
        const p = JSON.parse(saved);
        if (p.search) setSearchInput(p.search);
        if (p.region) setRegion(p.region);
        if (p.country) setCountryInput(p.country);
        if (p.rankRange) setRankRange(p.rankRange);
        if (typeof p.page === 'number' && p.page >= 1) setPage(p.page);
        else if (p.page != null && !Number.isNaN(Number(p.page))) setPage(Math.max(1, parseInt(String(p.page), 10)));
      } catch (e) {
        console.error(e);
      }
    }
    setIsInitialized(true);
  }, []);

  useEffect(() => {
    if (!isInitialized) return;
    const filters = { search: searchInput, region, country: countryInput, rankRange, page };
    sessionStorage.setItem('universityFilters', JSON.stringify(filters));
  }, [searchInput, region, countryInput, rankRange, page, isInitialized]);

  const fetchWishlistAndLimits = useCallback(async () => {
    if (!studentId) return;
    try {
      const [limRes, listRes] = await Promise.all([
        fetch(`/api/students/${studentId}/school-wishlist/limits`),
        fetch(`/api/students/${studentId}/school-wishlist`),
      ]);
      if (limRes.ok) {
        const d = await limRes.json();
        setWishlistLimit(typeof d.limit === 'number' ? d.limit : 2);
      }
      if (listRes.ok) {
        const d = await listRes.json();
        const items = (d.items ?? []) as { university_id: number; name?: string; sort_order: number }[];
        setWishlistSaved(items);
        const ordered = [...items].sort((a, b) => a.sort_order - b.sort_order).map((x) => x.university_id);
        setSelectedOrder(ordered);
      }
    } catch {
      setWishlistError('Không tải được nguyện vọng');
    }
  }, [studentId]);

  useEffect(() => {
    fetch('/api/universities/countries')
      .then(res => res.json())
      .then(data => {
        if (data.success && Array.isArray(data.countries)) {
          setCountries(data.countries);
        }
      })
      .catch(err => console.error(err));
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (countryDropdownRef.current && !countryDropdownRef.current.contains(e.target as Node)) {
        setIsCountryDropdownOpen(false);
      }
      if (searchDropdownRef.current && !searchDropdownRef.current.contains(e.target as Node)) {
        setIsSearchDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const displayedCountries = useMemo(() => {
    let filtered = countries;
    if (region) {
      filtered = filtered.filter(c => c.region === region);
    }
    if (!countryInput.trim()) {
      return filtered.map(c => c.country).slice(0, 10);
    }
    const lowerInput = countryInput.toLowerCase();
    return filtered
      .map(c => c.country)
      .filter(name => name.toLowerCase().includes(lowerInput))
      .slice(0, 10);
  }, [countries, region, countryInput]);

  const searchSuggestions = useMemo(() => {
    if (!searchInput.trim()) return [];
    return universities.slice(0, 6);
  }, [searchInput, universities]);

  const toggleWishlist = useCallback(
    (universityId: number) => {
      setSelectedOrder((prev) => {
        const idx = prev.indexOf(universityId);
        if (idx >= 0) return prev.filter((id) => id !== universityId);
        if (prev.length >= wishlistLimit) return prev;
        return [...prev, universityId];
      });
      setWishlistError(null);
    },
    [wishlistLimit]
  );

  const handleSchoolDragStart = useCallback((idx: number) => {
    schoolDragIndexRef.current = idx;
  }, []);

  const handleSchoolDragEnter = useCallback((idx: number) => {
    setSchoolDragOverIndex(idx);
  }, []);

  const handleSchoolDragEnd = useCallback(() => {
    const from = schoolDragIndexRef.current;
    const to = schoolDragOverIndex;
    if (from !== null && to !== null && from !== to) {
      setSelectedOrder((prev) => {
        const next = [...prev];
        const [item] = next.splice(from, 1);
        next.splice(to, 0, item);
        return next;
      });
      setWishlistError(null);
    }
    schoolDragIndexRef.current = null;
    setSchoolDragOverIndex(null);
  }, [schoolDragOverIndex]);

  const handleSchoolDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  const removeFromWishlistAndSave = useCallback(
    async (universityId: number) => {
      const nextOrder = selectedOrder.filter((id) => id !== universityId);
      setSelectedOrder(nextOrder);
      if (!studentId) return;
      setWishlistSaving(true);
      setWishlistError(null);
      try {
        const res = await fetch(`/api/students/${studentId}/school-wishlist`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            items: nextOrder.map((university_id, i) => ({ university_id, sort_order: i })),
          }),
        });
        const data = await res.json();
        if (!res.ok) {
          setWishlistError(data.error || 'Lỗi lưu nguyện vọng');
          setSelectedOrder(selectedOrder);
          return;
        }
        setWishlistSaved(data.items ?? []);
      } catch {
        setWishlistError('Lỗi kết nối');
        setSelectedOrder(selectedOrder);
      } finally {
        setWishlistSaving(false);
      }
    },
    [studentId, selectedOrder]
  );

  const displayWishlistNames = useMemo(() => {
    return selectedOrder.map((id, index) => {
      const u = universities.find((x) => x.id === id);
      const saved = wishlistSaved.find((x) => x.university_id === id);
      return {
        id,
        order: index + 1,
        name: u?.name ?? saved?.name ?? `Trường #${id}`,
        isPending: isPendingUniversity(u),
      };
    });
  }, [selectedOrder, universities, wishlistSaved]);

  const persistWishlistOrder = useCallback(async (order: number[]) => {
    if (!studentId) return false;
    setWishlistSaving(true);
    setWishlistError(null);
    try {
      const res = await fetch(`/api/students/${studentId}/school-wishlist`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: order.map((university_id, i) => ({ university_id, sort_order: i })),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setWishlistError(data.error || 'Lỗi lưu nguyện vọng');
        return false;
      }
      setWishlistSaved(data.items ?? []);
      return true;
    } catch {
      setWishlistError('Lỗi kết nối');
      return false;
    } finally {
      setWishlistSaving(false);
    }
  }, [studentId]);

  const saveWishlist = useCallback(async () => {
    void persistWishlistOrder(selectedOrder);
  }, [persistWishlistOrder, selectedOrder]);

  const handleCreateSuccess = useCallback(
    async (newUniv: University) => {
      setUniversities((prev) => (prev.some((u) => u.id === newUniv.id) ? prev : [newUniv, ...prev]));
      if (!studentId) return;
      if (selectedOrder.includes(newUniv.id)) return;
      if (selectedOrder.length >= wishlistLimit) {
        toast.error(`Bạn đã đạt giới hạn ${wishlistLimit} nguyện vọng trường.`);
        return;
      }

      const nextOrder = [...selectedOrder, newUniv.id];
      setSelectedOrder(nextOrder);
      const ok = await persistWishlistOrder(nextOrder);
      if (!ok) {
        setSelectedOrder(selectedOrder);
      } else {
        toast.success('Đã thêm trường vào nguyện vọng.');
      }
    },
    [studentId, selectedOrder, wishlistLimit, persistWishlistOrder],
  );

  const filterKey = useMemo(
    () => `${searchInput}|${region}|${countryInput}|${rankRange}`,
    [searchInput, region, countryInput, rankRange],
  );
  const filterKeyRef = useRef<string | null>(null);
  useLayoutEffect(() => {
    if (filterKeyRef.current === null) {
      filterKeyRef.current = filterKey;
      return;
    }
    if (filterKeyRef.current !== filterKey) {
      filterKeyRef.current = filterKey;
      setPage(1);
    }
  }, [filterKey]);

  const params = useMemo(() => {
    const p = new URLSearchParams();
    if (searchInput.trim()) p.set('search', searchInput.trim());
    if (region) p.set('region', region);
    if (countryInput.trim()) p.set('country', countryInput.trim());
    const range = RANK_RANGES.find((r) => r.value === rankRange);
    if (range && range.value) {
      p.set('minRank', String(range.min));
      p.set('maxRank', String(range.max));
    }
    p.set('page', String(page));
    p.set('pageSize', String(PAGE_SIZE));
    return p.toString();
  }, [searchInput, region, countryInput, rankRange, page]);

  useEffect(() => {
    if (!isInitialized) return;
    setLoading(true);
    // #region agent log
    fetch(DEBUG_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Debug-Session-Id': DEBUG_SESSION_ID },
      body: JSON.stringify({
        sessionId: DEBUG_SESSION_ID,
        runId: 'universities-page-fetch',
        hypothesisId: 'H6_FRONTEND_FETCH_CHAIN',
        location: 'src/app/(student)/student/universities/page.tsx:useEffect-universities:start',
        message: 'universities fetch start',
        data: { params },
        timestamp: Date.now(),
      }),
    }).catch(() => {});
    // #endregion
    fetch(`/api/universities?${params}`)
      .then(async (res) => {
        const text = await res.text();
        let data: unknown = null;
        try {
          data = JSON.parse(text);
        } catch {
          // #region agent log
          fetch(DEBUG_ENDPOINT, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'X-Debug-Session-Id': DEBUG_SESSION_ID },
            body: JSON.stringify({
              sessionId: DEBUG_SESSION_ID,
              runId: 'universities-page-fetch',
              hypothesisId: 'H7_RESPONSE_NOT_JSON',
              location: 'src/app/(student)/student/universities/page.tsx:useEffect-universities:parse',
              message: 'universities response is not json',
              data: { status: res.status, bodyPrefix: text.slice(0, 180) },
              timestamp: Date.now(),
            }),
          }).catch(() => {});
          // #endregion
          return { success: false, universities: [] as University[] };
        }
        // #region agent log
        fetch(DEBUG_ENDPOINT, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'X-Debug-Session-Id': DEBUG_SESSION_ID },
          body: JSON.stringify({
            sessionId: DEBUG_SESSION_ID,
            runId: 'universities-page-fetch',
            hypothesisId: 'H6_FRONTEND_FETCH_CHAIN',
            location: 'src/app/(student)/student/universities/page.tsx:useEffect-universities:response',
            message: 'universities response parsed',
            data: {
              status: res.status,
              ok: res.ok,
              success: Boolean((data as { success?: boolean })?.success),
              itemCount: Array.isArray((data as { universities?: unknown[] })?.universities)
                ? (data as { universities: unknown[] }).universities.length
                : -1,
            },
            timestamp: Date.now(),
          }),
        }).catch(() => {});
        // #endregion
        return data;
      })
      .then((data: any) => {
        if (data.success && Array.isArray(data.universities)) {
          setUniversities(data.universities);
          setTotalCount(typeof data.total === 'number' ? data.total : data.universities.length);
          setTotalPages(typeof data.totalPages === 'number' ? data.totalPages : 0);
        }
      })
      .catch((error) => {
        // #region agent log
        fetch(DEBUG_ENDPOINT, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'X-Debug-Session-Id': DEBUG_SESSION_ID },
          body: JSON.stringify({
            sessionId: DEBUG_SESSION_ID,
            runId: 'universities-page-fetch',
            hypothesisId: 'H8_FETCH_THREW',
            location: 'src/app/(student)/student/universities/page.tsx:useEffect-universities:catch',
            message: 'universities fetch threw',
            data: { errorMessage: error instanceof Error ? error.message : String(error) },
            timestamp: Date.now(),
          }),
        }).catch(() => {});
        // #endregion
      })
      .finally(() => setLoading(false));
  }, [params, isInitialized]);

  useEffect(() => {
    if (!isInitialized) return;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [page, isInitialized]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('tab') === 'faculty') {
      setActiveTab('faculty');
    }
  }, []);

  useEffect(() => {
    if (activeTab !== 'faculty') return;
    setMajorsLoading(true);
    fetch('/api/majors')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.majors)) {
          setMajors(data.majors);
        }
      })
      .finally(() => setMajorsLoading(false));
  }, [activeTab]);

  const fetchFacultyWishlistAndLimits = useCallback(async () => {
    if (!studentId) return;
    try {
      const [limRes, listRes] = await Promise.all([
        fetch(`/api/students/${studentId}/faculty-wishlist/limits`),
        fetch(`/api/students/${studentId}/faculty-wishlist`),
      ]);
      if (limRes.ok) {
        const d = await limRes.json();
        setFacultyWishlistLimit(typeof d.limit === 'number' ? d.limit : 2);
      }
      if (listRes.ok) {
        const d = await listRes.json();
        const items = (d.items ?? []) as { faculty_name: string; sort_order: number }[];
        setFacultyWishlistSaved(items);
        const ordered = [...items].sort((a, b) => a.sort_order - b.sort_order).map((x) => x.faculty_name);
        setSelectedFacultyOrder(ordered);
      }
    } catch {
      setFacultyWishlistError('Không tải được nguyện vọng ngành');
    }
  }, [studentId]);

  /** Một lần mount / đổi student: wishlist trường, wishlist ngành và gợi ý AI chạy song song (không chờ danh sách QS hay /api/majors). */
  useEffect(() => {
    if (!studentId) {
      setSchoolWishlistReady(true);
      setFacultyWishlistReady(true);
      return;
    }
    setSchoolWishlistReady(false);
    setFacultyWishlistReady(false);
    let cancelled = false;

    void fetchWishlistAndLimits().finally(() => {
      if (!cancelled) setSchoolWishlistReady(true);
    });

    void fetchFacultyWishlistAndLimits()
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setFacultyWishlistReady(true);
      });

    void fetch(`/api/students/${studentId}/recommend-faculty/latest`)
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return;
        const faculties = Array.isArray(data?.recommendation?.faculties) ? data.recommendation.faculties : [];
        const names = faculties
          .map((x: { faculty_name?: string }) => (x.faculty_name ?? '').trim())
          .filter(Boolean);
        setRecommendedFacultyNames(names);
      })
      .catch(() => {
        if (!cancelled) setRecommendedFacultyNames([]);
      });

    return () => {
      cancelled = true;
    };
  }, [studentId, fetchWishlistAndLimits, fetchFacultyWishlistAndLimits]);

  const toggleFacultyWishlist = useCallback(
    (facultyName: string) => {
      setSelectedFacultyOrder((prev) => {
        const idx = prev.indexOf(facultyName);
        if (idx >= 0) return prev.filter((x) => x !== facultyName);
        if (prev.length >= facultyWishlistLimit) return prev;
        return [...prev, facultyName];
      });
      setFacultyWishlistError(null);
    },
    [facultyWishlistLimit]
  );

  const handleFacultyDragStart = useCallback((idx: number) => {
    facultyDragIndexRef.current = idx;
  }, []);

  const handleFacultyDragEnter = useCallback((idx: number) => {
    setFacultyDragOverIndex(idx);
  }, []);

  const handleFacultyDragEnd = useCallback(() => {
    const from = facultyDragIndexRef.current;
    const to = facultyDragOverIndex;
    if (from !== null && to !== null && from !== to) {
      setSelectedFacultyOrder((prev) => {
        const next = [...prev];
        const [item] = next.splice(from, 1);
        next.splice(to, 0, item);
        return next;
      });
      setFacultyWishlistError(null);
    }
    facultyDragIndexRef.current = null;
    setFacultyDragOverIndex(null);
  }, [facultyDragOverIndex]);

  const handleFacultyDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  const saveFacultyWishlist = useCallback(async () => {
    if (!studentId) return;
    setFacultyWishlistSaving(true);
    setFacultyWishlistError(null);
    try {
      const res = await fetch(`/api/students/${studentId}/faculty-wishlist`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: selectedFacultyOrder.map((faculty_name, sort_order) => ({ faculty_name, sort_order })),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setFacultyWishlistError(data.error || 'Lỗi lưu nguyện vọng ngành');
        return;
      }
      setFacultyWishlistSaved(data.items ?? []);
    } catch {
      setFacultyWishlistError('Lỗi kết nối');
    } finally {
      setFacultyWishlistSaving(false);
    }
  }, [studentId, selectedFacultyOrder]);

  const normalizeFacultyName = useCallback((value: string) => {
    return value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/\s+/g, ' ')
      .trim()
      .toLowerCase();
  }, []);

  const recommendedTop10Normalized = useMemo(() => {
    return recommendedFacultyNames
      .slice(0, 10)
      .map((x) => normalizeFacultyName(x))
      .filter(Boolean);
  }, [recommendedFacultyNames, normalizeFacultyName]);

  const recommendedTop10Set = useMemo(() => new Set(recommendedTop10Normalized), [recommendedTop10Normalized]);

  const facultyIndustries = useMemo(() => {
    const set = new Set<string>();
    for (const m of majors) {
      if (m.industry_group?.trim()) set.add(m.industry_group.trim());
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [majors]);

  const sortedMajors = useMemo(() => {
    const keyword = majorSearchInput.trim().toLowerCase();
    const filtered = majors.filter((m) => {
      const isRecommended = recommendedTop10Set.has(normalizeFacultyName(m.occupation_name));
      if (onlyRecommended && !isRecommended) return false;
      if (industryFilter && (m.industry_group ?? '') !== industryFilter) return false;
      if (!keyword) return true;
      return (
        m.occupation_name.toLowerCase().includes(keyword) ||
        (m.industry_group ?? '').toLowerCase().includes(keyword) ||
        (m.occupation_code ?? '').toLowerCase().includes(keyword)
      );
    });

    return filtered.sort((a, b) => {
      const aName = normalizeFacultyName(a.occupation_name);
      const bName = normalizeFacultyName(b.occupation_name);
      const aRecommended = recommendedTop10Set.has(aName);
      const bRecommended = recommendedTop10Set.has(bName);
      if (aRecommended !== bRecommended) return aRecommended ? -1 : 1;
      return a.occupation_name.localeCompare(b.occupation_name);
    });
  }, [majors, majorSearchInput, industryFilter, onlyRecommended, normalizeFacultyName, recommendedTop10Set]);

  const facultyTotalCount = sortedMajors.length;
  const facultyTotalPages = Math.max(1, Math.ceil(facultyTotalCount / FACULTY_PAGE_SIZE));
  const pagedMajors = useMemo(() => {
    const start = (facultyPage - 1) * FACULTY_PAGE_SIZE;
    return sortedMajors.slice(start, start + FACULTY_PAGE_SIZE);
  }, [sortedMajors, facultyPage]);

  const facultyRangeLabel = useMemo(() => {
    if (facultyTotalCount === 0) return null;
    const from = (facultyPage - 1) * FACULTY_PAGE_SIZE + 1;
    const to = Math.min(facultyPage * FACULTY_PAGE_SIZE, facultyTotalCount);
    return { from, to };
  }, [facultyPage, facultyTotalCount]);

  const hasAnyFacultyFilter = Boolean(majorSearchInput || industryFilter || onlyRecommended);

  const facultySaveDisabled = useMemo(() => {
    if (facultyWishlistSaving) return true;
    const savedNames = [...facultyWishlistSaved]
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((x) => x.faculty_name);
    return (
      selectedFacultyOrder.length === savedNames.length &&
      selectedFacultyOrder.every((x, i) => x === savedNames[i])
    );
  }, [facultyWishlistSaving, facultyWishlistSaved, selectedFacultyOrder]);

  const handleCreateMajorSuccess = useCallback(async (major: MajorItem) => {
    setMajors((prev) => [major, ...prev]);
    const name = major.occupation_name;
    setSelectedFacultyOrder((prev) => {
      if (prev.includes(name)) return prev;
      if (prev.length >= facultyWishlistLimit) return prev;
      return [...prev, name];
    });
  }, [facultyWishlistLimit]);

  useEffect(() => {
    setFacultyPage(1);
  }, [majorSearchInput, industryFilter, onlyRecommended, activeTab]);

  const hasAnyFilter = Boolean(searchInput || region || countryInput || rankRange);

  const handleClearFilters = () => {
    setSearchInput('');
    setRegion('');
    setCountryInput('');
    setRankRange('');
    setPage(1);
    sessionStorage.removeItem('universityFilters');
  };

  const rangeLabel = useMemo(() => {
    if (totalCount === 0) return null;
    const from = (page - 1) * PAGE_SIZE + 1;
    const to = Math.min(page * PAGE_SIZE, totalCount);
    return { from, to };
  }, [page, totalCount]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <section
        aria-label={activeTab === 'university' ? 'Danh sách trường' : 'Danh sách ngành'}
        className="mb-6 px-4 pt-8 sm:px-6 md:px-8 max-w-7xl mx-auto"
      >
        <div className="flex flex-col items-start gap-4">
          <div className="inline-flex rounded-full border border-border bg-card p-1 shadow-sm">
            <button
              type="button"
              onClick={() => setActiveTab('university')}
              className={`rounded-full px-5 py-2 text-sm font-medium transition-all duration-200 ${
                activeTab === 'university'
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'bg-transparent text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              University
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('faculty')}
              className={`rounded-full px-5 py-2 text-sm font-medium transition-all duration-200 ${
                activeTab === 'faculty'
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'bg-transparent text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              Faculty
            </button>
          </div>
          <div>
            <h1 className="font-university-display text-3xl font-bold leading-tight text-foreground sm:text-4xl">
              {activeTab === 'university' ? "World's Best Universities" : 'Major & Faculty Explorer'}
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
              {activeTab === 'university'
                ? 'QS World University Rankings 2026: dữ liệu đồng bộ từ bảng xếp hạng chính thức.'
                : 'Danh sách ngành từ cơ sở dữ liệu O*NET, tích hợp gợi ý Holie Mate từ bài test để bạn chọn nguyện vọng ngành.'}
            </p>
          </div>
        </div>
      </section>

      {activeTab === 'university' && (
      <>
      <div className="border-b border-border/60 bg-card/30 px-4 py-4 sm:px-6 md:px-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex-1 max-w-md pt-0.5">
            <div className="relative" ref={searchDropdownRef}>
              <input
                type="search"
                placeholder="Tìm MIT, Oxford, Tokyo..."
                value={searchInput}
                onFocus={() => setIsSearchDropdownOpen(true)}
                onChange={(e) => {
                  setSearchInput(e.target.value);
                  setIsSearchDropdownOpen(true);
                }}
                className="w-full rounded-full border border-border bg-card px-4 py-2.5 text-foreground placeholder-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
              {isSearchDropdownOpen && (
                <div className="absolute left-0 right-0 top-full z-40 mt-1 overflow-hidden rounded-lg border border-border bg-card shadow-lg">
                  {searchSuggestions.length > 0 ? (
                    <ul className="max-h-72 overflow-auto py-1">
                      {searchSuggestions.map((u) => (
                        <li key={u.id}>
                          <Link
                            href={`/student/universities/${u.id}?from=${encodeURIComponent('/student/universities')}`}
                            className="flex items-center justify-between gap-2 px-3 py-2 text-sm hover:bg-muted"
                            onClick={() => setIsSearchDropdownOpen(false)}
                          >
                            <span className="inline-flex min-w-0 items-center gap-2">
                              <span className="truncate font-medium text-foreground">{u.name}</span>
                              {isPendingUniversity(u) ? (
                                <span className="shrink-0 rounded-full bg-orange-100 px-2 py-0.5 text-xs text-orange-700">
                                  Đang duyệt
                                </span>
                              ) : null}
                            </span>
                            <span className="shrink-0 text-xs text-muted-foreground">
                              {u.qs_rank == null ? 'N/A' : `#${u.qs_rank}`}
                            </span>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  ) : searchInput.trim() ? (
                    <p className="px-3 py-2 text-sm text-muted-foreground">Không có kết quả phù hợp.</p>
                  ) : null}
                </div>
              )}
            </div>
            <div className="mt-2 text-sm">
              <button
                type="button"
                onClick={() => {
                  setIsAddUniversityModalOpen(true);
                  setIsSearchDropdownOpen(false);
                }}
                className="font-medium text-primary hover:underline"
              >
                + Không tìm thấy trường? Đề xuất thêm trường mới
              </button>
            </div>
          </div>
          <div className="flex flex-col gap-2.5">
            <div className="flex flex-wrap items-center gap-3">
              <span className="w-[58px] text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Khu vực
              </span>
              <select
                value={region}
                onChange={(e) => setRegion(e.target.value)}
                className="w-28 sm:w-32 rounded-full border border-border bg-card px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none"
              >
                {REGIONS.map((r) => (
                  <option key={r.value || 'all'} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </select>
              <div className="relative" ref={countryDropdownRef}>
                <input
                  type="text"
                  placeholder="Quốc gia"
                  value={countryInput}
                  onChange={(e) => {
                    setCountryInput(e.target.value);
                    setIsCountryDropdownOpen(true);
                  }}
                  onFocus={() => setIsCountryDropdownOpen(true)}
                  className="w-28 rounded-full border border-border bg-card px-3 py-2 text-sm text-foreground placeholder-muted-foreground focus:border-primary focus:outline-none"
                />
                {isCountryDropdownOpen && displayedCountries.length > 0 && (
                  <ul className="absolute left-0 top-full mt-1 max-h-60 w-48 overflow-auto rounded-md border border-border bg-card py-1 shadow-lg z-50">
                    {displayedCountries.map((cName) => (
                      <li
                        key={cName}
                        onClick={() => {
                          setCountryInput(cName);
                          setIsCountryDropdownOpen(false);
                        }}
                        className="cursor-pointer px-3 py-1.5 text-sm text-foreground hover:bg-muted"
                      >
                        {cName}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Hạng
              </span>
              <select
                value={rankRange}
                onChange={(e) => setRankRange(e.target.value)}
                className="w-24 rounded-full border border-border bg-card px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none"
              >
                {RANK_RANGES.map((r) => (
                  <option key={r.value || 'all'} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </select>
            </div>
            {hasAnyFilter && (
              <div className="flex pl-[70px]">
                <button
                  type="button"
                  onClick={handleClearFilters}
                  title="Xóa bộ lọc"
                  className="flex items-center justify-center rounded-lg border border-border bg-destructive/10 px-3 py-1 text-sm font-medium text-destructive transition-colors hover:bg-destructive/20 focus:outline-none"
                >
                  Xóa lọc
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <main className="mx-auto grid max-w-7xl gap-6 px-4 py-8 sm:px-6 md:grid-cols-[320px_1fr] md:px-8">
        <aside className="space-y-4 md:sticky md:top-24 md:h-fit">
        {studentId ? (
          <div className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-4 shadow-sm sm:p-5">
            <div className="flex flex-wrap items-center gap-4">
              <span className="text-sm font-medium text-foreground">
                Nguyện vọng trường: Đã chọn {selectedOrder.length}/{wishlistLimit}
              </span>
              <button
                type="button"
                onClick={saveWishlist}
                disabled={wishlistSaving}
                className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
              >
                {wishlistSaving ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : null}
                Lưu nguyện vọng trường
              </button>
            </div>
            {wishlistError && (
              <p className="text-sm text-destructive">{wishlistError}</p>
            )}
            {studentId && !schoolWishlistReady && (
              <div className="pt-1" aria-busy="true" aria-label="Đang tải nguyện vọng trường">
                <WishlistCardBodySkeleton rows={3} />
              </div>
            )}
            {displayWishlistNames.length > 0 && (
              <div className="flex flex-col gap-2 pt-2 border-t border-border">
                <p className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Danh sách đang chọn (thứ tự ưu tiên)
                  <span className="ml-auto inline-flex items-center gap-1 font-normal normal-case tracking-normal text-[10px] text-muted-foreground/80">
                    <GripVertical className="size-3" aria-hidden />
                    Kéo để sắp xếp
                  </span>
                </p>
                <ul className="flex flex-col gap-2">
                  {displayWishlistNames.map((item, idx) => (
                    <li
                      key={item.id}
                      draggable={!wishlistSaving}
                      onDragStart={() => handleSchoolDragStart(idx)}
                      onDragEnter={() => handleSchoolDragEnter(idx)}
                      onDragEnd={handleSchoolDragEnd}
                      onDragOver={handleSchoolDragOver}
                      className={`flex items-center gap-2 rounded-lg border px-2.5 py-2 select-none transition-all duration-150 ${
                        wishlistSaving
                          ? 'cursor-wait opacity-70'
                          : 'cursor-grab active:cursor-grabbing'
                      } ${
                        schoolDragOverIndex === idx && schoolDragIndexRef.current !== idx
                          ? 'border-primary bg-primary/10 scale-[1.01]'
                          : 'border-border bg-muted/30'
                      }`}
                    >
                      <GripVertical
                        className="size-4 shrink-0 text-muted-foreground"
                        aria-hidden
                      />
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/15 text-sm font-semibold text-primary">
                        {item.order}
                      </span>
                      <Link
                        href={`/student/universities/${item.id}?from=${encodeURIComponent('/student/universities')}`}
                        draggable={false}
                        onClick={(e) => {
                          // Tránh mở link khi đang kéo sắp xếp
                          if (schoolDragIndexRef.current !== null) e.preventDefault();
                        }}
                        className="min-w-0 flex-1 text-sm font-medium text-foreground hover:underline"
                      >
                        <span className="inline-flex max-w-full items-center gap-2">
                          <span className="truncate">{item.name}</span>
                          {item.isPending ? (
                            <span className="shrink-0 rounded-full bg-orange-100 px-2 py-0.5 text-xs text-orange-700">
                              Đang duyệt
                            </span>
                          ) : null}
                        </span>
                      </Link>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          removeFromWishlistAndSave(item.id);
                        }}
                        disabled={wishlistSaving}
                        aria-label="Xóa khỏi nguyện vọng"
                        className="shrink-0 rounded-full p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive disabled:opacity-50"
                      >
                        <X className="size-4" />
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ) : null}
        </aside>
        <section className="space-y-6">
        {loading ? (
          <UniversityGridSkeleton />
        ) : (
          <div className="flex flex-col gap-4">
            {universities.map((u) => {
              const inWishlist = Boolean(
                studentId && schoolWishlistReady && selectedOrder.includes(u.id),
              );
              return (
                <div key={u.id} className="relative">
                  {studentId && (
                    <button
                      type="button"
                      aria-label={inWishlist ? 'Bỏ khỏi nguyện vọng' : 'Thêm vào nguyện vọng'}
                      disabled={!schoolWishlistReady}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        toggleWishlist(u.id);
                      }}
                      className="absolute right-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-full border border-border bg-card shadow-sm transition-colors hover:bg-muted disabled:cursor-wait disabled:opacity-90"
                    >
                      {!schoolWishlistReady ? (
                        <Loader2 className="size-4 animate-spin text-muted-foreground" aria-hidden />
                      ) : (
                        <Heart
                          className={`size-5 ${inWishlist ? 'fill-red-500 text-red-500' : 'text-muted-foreground'}`}
                        />
                      )}
                    </button>
                  )}
                  <Link href={`/student/universities/${u.id}?from=${encodeURIComponent('/student/universities')}`}>
                    <article
                      className={`group relative flex flex-col sm:flex-row items-start sm:items-center gap-4 rounded-xl border border-border bg-card p-4 transition-all hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-lg ${studentId ? 'pr-14' : ''}`}
                    >
                      <div className="flex-shrink-0 flex items-center justify-center w-14 h-14 rounded-full bg-muted/10 border border-border/50 relative shadow-inner overflow-hidden">
                        <svg viewBox="0 0 56 56" className="w-full h-full transform -rotate-90 absolute inset-0 m-auto pointer-events-none">
                           <circle cx="28" cy="28" r="26" stroke="currentColor" strokeWidth="4" fill="transparent" className="text-muted/20" />
                           <circle cx="28" cy="28" r="26" stroke="currentColor" strokeWidth="4" fill="transparent" strokeDasharray="163" strokeDashoffset={163 - (163 * (u.qs_overall_score ?? 0)) / 100} className="text-primary transition-all duration-1000 ease-out" strokeLinecap="round" />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center flex-col">
                           <span className="text-[9px] font-bold text-muted-foreground uppercase leading-none mb-0.5 tracking-wider">QS</span>
                           <span className="text-xs font-bold leading-none text-foreground">{(u.qs_overall_score ?? 0).toFixed(1)}</span>
                        </div>
                      </div>

                      <div className="flex-1 min-w-0 flex flex-col justify-center">
                        <h2 className="font-university-display mb-1 truncate text-lg font-bold text-foreground group-hover:text-primary">
                          {u.name}
                        </h2>
                        <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                          <FlagImage countryCode={u.country_code ?? ''} /> {u.country}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 mt-2 sm:mt-0 sm:justify-end sm:min-w-[200px]">
                         {u.region && (
                           <span className="rounded-full bg-muted/60 px-3 py-1 text-xs font-medium text-foreground">{u.region}</span>
                         )}
                         {u.size && (
                           <span className="rounded-full bg-muted/60 px-3 py-1 text-xs font-medium text-foreground">Quy mô: {u.size}</span>
                         )}
                         {u.type && (
                           <span className="rounded-full bg-muted/60 px-3 py-1 text-xs font-medium text-foreground">{u.type}</span>
                         )}
                      </div>
                    </article>
                  </Link>
                </div>
              );
            })}
          </div>
        )}
        {!loading && universities.length === 0 && (
          <p className="py-12 text-center text-muted-foreground">Không tìm thấy trường nào.</p>
        )}

        {!loading && totalCount > 0 && totalPages > 0 && (
          <div className="flex flex-col items-center gap-4 border-t border-border pt-8 sm:flex-row sm:justify-between">
            <p className="text-sm text-muted-foreground">
              {rangeLabel ? (
                <>
                  Hiển thị{' '}
                  <span className="font-medium text-foreground">
                    {rangeLabel.from}–{rangeLabel.to}
                  </span>{' '}
                  / <span className="font-medium text-foreground">{totalCount}</span> trường
                </>
              ) : null}
            </p>
            <div className="flex flex-wrap items-center justify-center gap-2">
              <button
                type="button"
                aria-label="Trang trước"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="inline-flex h-9 items-center gap-1 rounded-lg border border-border bg-card px-3 text-sm font-medium text-foreground disabled:pointer-events-none disabled:opacity-40 hover:bg-muted"
              >
                <ChevronLeft className="size-4" />
                Trước
              </button>
              <span className="px-2 text-sm tabular-nums text-muted-foreground">
                Trang <span className="font-medium text-foreground">{page}</span> / {totalPages}
              </span>
              <button
                type="button"
                aria-label="Trang sau"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="inline-flex h-9 items-center gap-1 rounded-lg border border-border bg-card px-3 text-sm font-medium text-foreground disabled:pointer-events-none disabled:opacity-40 hover:bg-muted"
              >
                Sau
                <ChevronRight className="size-4" />
              </button>
            </div>
          </div>
        )}
        </section>
      </main>
      </>
      )}

      {activeTab === 'faculty' && (
        <>
        <div className="border-b border-border/60 bg-card/30 px-4 py-4 sm:px-6 md:px-8">
          <div className="mx-auto flex max-w-7xl flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex-1 max-w-md pt-0.5">
              <input
                type="search"
                placeholder="Tìm ngành, nhóm ngành, mã nghề..."
                value={majorSearchInput}
                onChange={(e) => setMajorSearchInput(e.target.value)}
                className="w-full rounded-full border border-border bg-card px-4 py-2.5 text-foreground placeholder-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
              <div className="mt-2 text-sm">
                <button
                  type="button"
                  onClick={() => setIsAddMajorModalOpen(true)}
                  className="font-medium text-primary hover:underline"
                >
                  + Không tìm thấy ngành? Đề xuất thêm ngành mới
                </button>
              </div>
            </div>
            <div className="flex flex-col gap-2.5">
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground whitespace-nowrap">
                    Nhóm
                  </span>
                  <select
                    value={industryFilter}
                    onChange={(e) => setIndustryFilter(e.target.value)}
                    className="w-full min-w-[140px] sm:w-48 rounded-full border border-border bg-card px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none"
                  >
                    <option value="">Tất cả nhóm ngành</option>
                    {facultyIndustries.map((name) => (
                      <option key={name} value={name}>
                        {name}
                      </option>
                    ))}
                  </select>
                </div>
                <label className="inline-flex items-center gap-2 text-sm text-foreground cursor-pointer py-1">
                  <input
                    type="checkbox"
                    checked={onlyRecommended}
                    onChange={(e) => setOnlyRecommended(e.target.checked)}
                    className="h-4 w-4 rounded border-border"
                  />
                  <span className="whitespace-nowrap">Chỉ ngành gợi ý</span>
                </label>
              </div>
              {hasAnyFacultyFilter && (
                <div className="flex pl-[50px]">
                  <button
                    type="button"
                    onClick={() => {
                      setMajorSearchInput('');
                      setIndustryFilter('');
                      setOnlyRecommended(false);
                    }}
                    title="Xóa bộ lọc"
                    className="flex items-center justify-center rounded-lg border border-border bg-destructive/10 px-3 py-1 text-sm font-medium text-destructive transition-colors hover:bg-destructive/20 focus:outline-none"
                  >
                    Xóa lọc
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
        <main className="mx-auto grid max-w-7xl gap-6 px-4 py-8 sm:px-6 md:grid-cols-[320px_1fr] md:px-8">
          <aside className="space-y-4 md:sticky md:top-24 md:h-fit">
          <div className="rounded-2xl border border-border bg-card p-4 shadow-sm sm:p-5">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
              <div className="flex items-center gap-2">
                <GraduationCap className="size-5 text-primary" />
                <h2 className="text-lg font-semibold">Danh sách ngành học</h2>
              </div>
              {facultyRangeLabel ? (
                <p className="text-sm text-muted-foreground">
                  Hiển thị <span className="font-medium text-foreground">{facultyRangeLabel.from}–{facultyRangeLabel.to}</span> /{' '}
                  <span className="font-medium text-foreground">{facultyTotalCount}</span> ngành
                </p>
              ) : null}
            </div>

            {studentId && (
              <div className="mt-4 rounded-lg border border-border bg-muted/20 p-3 sm:p-4">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="text-sm font-medium">
                    Nguyện vọng ngành: Đã chọn {selectedFacultyOrder.length}/{facultyWishlistLimit}
                  </span>
                  <button
                    type="button"
                    onClick={saveFacultyWishlist}
                    disabled={facultySaveDisabled}
                    className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                  >
                    {facultyWishlistSaving ? <Loader2 className="size-4 animate-spin" /> : null}
                    Lưu nguyện vọng ngành
                  </button>
                </div>
                {facultyWishlistError ? (
                  <p className="mt-2 text-sm text-destructive">{facultyWishlistError}</p>
                ) : null}
                {studentId && !facultyWishlistReady && (
                  <p className="mt-2 text-xs text-muted-foreground">Đang đồng bộ nguyện vọng ngành…</p>
                )}
                {selectedFacultyOrder.length > 0 ? (
                  <div className="mt-3 flex flex-col gap-2">
                    <p className="flex items-center gap-1.5 text-[10px] text-muted-foreground/80">
                      <GripVertical className="size-3" aria-hidden />
                      Kéo để sắp xếp thứ tự ưu tiên
                    </p>
                    <ul className="flex flex-col gap-2">
                      {selectedFacultyOrder.map((name, index) => (
                        <li
                          key={`${name}-${index}`}
                          draggable={!facultyWishlistSaving}
                          onDragStart={() => handleFacultyDragStart(index)}
                          onDragEnter={() => handleFacultyDragEnter(index)}
                          onDragEnd={handleFacultyDragEnd}
                          onDragOver={handleFacultyDragOver}
                          className={`flex items-center gap-2 rounded-lg border px-2.5 py-2 text-sm shadow-sm select-none transition-all duration-150 ${
                            facultyWishlistSaving
                              ? 'cursor-wait opacity-70'
                              : 'cursor-grab active:cursor-grabbing'
                          } ${
                            facultyDragOverIndex === index && facultyDragIndexRef.current !== index
                              ? 'border-primary bg-primary/10 scale-[1.01]'
                              : 'border-border bg-card'
                          }`}
                        >
                          <GripVertical
                            className="size-4 shrink-0 text-muted-foreground"
                            aria-hidden
                          />
                          <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/15 text-xs font-semibold text-primary">
                            {index + 1}
                          </span>
                          <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-2 gap-y-1">
                            <span className="break-words font-medium leading-tight text-foreground" title={name}>
                              {name}
                            </span>
                            {(() => {
                              const found = majors.find((x) => x.occupation_name === name);
                              if (isPendingMajor(found)) {
                                return (
                                  <span className="shrink-0 rounded-full bg-orange-100 px-1.5 py-0.5 text-[10px] text-orange-700">
                                    Đang duyệt
                                  </span>
                                );
                              }
                              return null;
                            })()}
                          </div>
                          <button
                            type="button"
                            onClick={() => toggleFacultyWishlist(name)}
                            disabled={facultyWishlistSaving}
                            className="shrink-0 rounded-full p-1.5 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive disabled:opacity-50"
                            aria-label="Bỏ khỏi nguyện vọng"
                          >
                            <X className="size-4" />
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </div>
            )}
          </div>
          </aside>

          <section className="space-y-6">
          {majorsLoading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="size-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
              {pagedMajors.map((m) => {
                const isRecommended = recommendedTop10Set.has(normalizeFacultyName(m.occupation_name));
                const selected = selectedFacultyOrder.includes(m.occupation_name);
                const atLimit = selectedFacultyOrder.length >= facultyWishlistLimit && !selected;
                return (
                  <div key={m.id} className="relative">
                    <button
                      type="button"
                      aria-label={selected ? 'Bỏ khỏi nguyện vọng ngành' : 'Thêm vào nguyện vọng ngành'}
                      disabled={!facultyWishlistReady || (!selected && atLimit)}
                      onClick={() => toggleFacultyWishlist(m.occupation_name)}
                      className={`absolute right-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-full border border-border bg-card shadow-sm transition-colors hover:bg-muted ${
                        !facultyWishlistReady
                          ? 'cursor-wait'
                          : !selected && atLimit
                            ? 'opacity-50 cursor-not-allowed'
                            : ''
                      }`}
                    >
                      {!facultyWishlistReady ? (
                        <Loader2 className="size-4 animate-spin text-muted-foreground" aria-hidden />
                      ) : (
                        <Heart
                          className={`size-5 ${selected ? 'fill-red-500 text-red-500' : 'text-muted-foreground'}`}
                        />
                      )}
                    </button>
                    <article
                      className={`group flex h-full flex-col rounded-2xl border border-border bg-card p-5 pr-12 transition-all hover:-translate-y-0.5 hover:shadow-xl hover:shadow-primary/5 ${
                        selected
                          ? 'border-primary/50 bg-primary/5'
                          : isRecommended
                            ? 'border-amber-300 bg-amber-50/60 dark:bg-amber-900/20 hover:border-amber-400'
                            : 'hover:border-primary/50'
                      } ${!selected && atLimit ? 'opacity-60' : ''}`}
                    >
                      <div className="mb-3 flex items-start justify-between gap-2">
                        <span className="inline-flex h-8 items-center justify-center rounded-lg bg-indigo-500/15 px-2 text-xs font-bold text-indigo-600">
                          {m.job_zone ? `Zone ${m.job_zone}` : 'Zone -'}
                        </span>
                        {isRecommended ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-1 text-[11px] font-medium text-amber-700">
                            <Sparkles className="size-3" />
                            Gợi ý
                          </span>
                        ) : null}
                      </div>
                      <h3 className="mb-2 line-clamp-2 text-base font-bold leading-tight text-foreground group-hover:text-primary">
                        {m.occupation_name}
                        {isPendingMajor(m) ? (
                          <span className="ml-2 inline-flex shrink-0 rounded-full bg-orange-100 px-2 py-0.5 text-[11px] font-normal leading-tight text-orange-700">
                            Đang duyệt
                          </span>
                        ) : null}
                      </h3>
                      <p className="mb-2 text-xs text-muted-foreground">
                        {m.industry_group || 'Nhóm ngành chưa phân loại'}
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        {m.occupation_code ? `Code: ${m.occupation_code}` : 'Code: N/A'}
                      </p>
                      {typeof m.major_score === 'number' ? (
                        <div className="mb-2 mt-4 flex items-center justify-between gap-2">
                          <div className="flex flex-col">
                            <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Mức độ cạnh tranh</span>
                            <span className={`text-sm font-bold ${m.major_score >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                              {m.major_score > 0 ? '+' : ''}{m.major_score.toFixed(1)}
                            </span>
                          </div>
                          
                          <div className="flex items-end gap-[3px] h-5">
                            {Array.from({ length: 7 }).map((_, i) => {
                               const normalizedScore = ((m.major_score ?? 0) + 6) / 12;
                               const activeBars = Math.round(normalizedScore * 7);
                               const isActive = i < activeBars;
                               const height = 6 + (i * 2); 
                               const color = isActive 
                                  ? ((m.major_score ?? 0) >= 0 ? 'bg-emerald-500' : 'bg-rose-500') 
                                  : 'bg-muted-foreground/20 dark:bg-muted/40';
                               return (
                                 <div 
                                    key={i} 
                                    className={`w-1.5 rounded-full transition-all duration-300 ${color}`} 
                                    style={{ height: `${height}px` }} 
                                 />
                               );
                            })}
                          </div>
                        </div>
                      ) : null}
                      <span className="mt-auto pt-2 text-sm font-medium text-primary">
                        {selected ? 'Đã chọn nguyện vọng' : 'Nhấn tim để thêm nguyện vọng'}
                      </span>
                    </article>
                  </div>
                );
              })}
            </div>
          )}

          {!majorsLoading && facultyTotalCount === 0 && (
            <p className="py-12 text-center text-muted-foreground">Không tìm thấy ngành nào.</p>
          )}

          {!majorsLoading && facultyTotalCount > 0 && facultyTotalPages > 1 && (
            <div className="flex flex-col items-center gap-4 border-t border-border pt-8 sm:flex-row sm:justify-between">
              <p className="text-sm text-muted-foreground">
                {facultyRangeLabel ? (
                  <>
                    Hiển thị{' '}
                    <span className="font-medium text-foreground">
                      {facultyRangeLabel.from}–{facultyRangeLabel.to}
                    </span>{' '}
                    / <span className="font-medium text-foreground">{facultyTotalCount}</span> ngành
                  </>
                ) : null}
              </p>
              <div className="flex flex-wrap items-center justify-center gap-2">
                <button
                  type="button"
                  aria-label="Trang trước"
                  disabled={facultyPage <= 1}
                  onClick={() => setFacultyPage((p) => Math.max(1, p - 1))}
                  className="inline-flex h-9 items-center gap-1 rounded-lg border border-border bg-card px-3 text-sm font-medium text-foreground disabled:pointer-events-none disabled:opacity-40 hover:bg-muted"
                >
                  <ChevronLeft className="size-4" />
                  Trước
                </button>
                <span className="px-2 text-sm tabular-nums text-muted-foreground">
                  Trang <span className="font-medium text-foreground">{facultyPage}</span> / {facultyTotalPages}
                </span>
                <button
                  type="button"
                  aria-label="Trang sau"
                  disabled={facultyPage >= facultyTotalPages}
                  onClick={() => setFacultyPage((p) => Math.min(facultyTotalPages, p + 1))}
                  className="inline-flex h-9 items-center gap-1 rounded-lg border border-border bg-card px-3 text-sm font-medium text-foreground disabled:pointer-events-none disabled:opacity-40 hover:bg-muted"
                >
                  Sau
                  <ChevronRight className="size-4" />
                </button>
              </div>
            </div>
          )}
          </section>
        </main>
        </>
      )}
      <AddUniversityModal
        isOpen={isAddUniversityModalOpen}
        onClose={() => setIsAddUniversityModalOpen(false)}
        initialSearchTerm={searchInput}
        onSuccess={(university) => {
          void handleCreateSuccess(university as University);
        }}
      />
      <AddMajorModal
        isOpen={isAddMajorModalOpen}
        onClose={() => setIsAddMajorModalOpen(false)}
        initialSearchTerm={majorSearchInput}
        facultyIndustries={facultyIndustries}
        onSuccess={(major) => {
          void handleCreateMajorSuccess(major as MajorItem);
        }}
      />
    </div>
  );
}
