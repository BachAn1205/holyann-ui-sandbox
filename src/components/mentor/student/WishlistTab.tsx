'use client';

import { useEffect, useState } from 'react';
import { GraduationCap, ExternalLink, Check, X, Loader2, BookOpen } from 'lucide-react';
import { toast } from 'sonner';

interface WishlistTabProps {
  studentId: string;
}

interface SchoolWishlistItem {
  university_id: number;
  name: string;
  country: string;
  region: string;
  website_url: string;
  status: 'PENDING' | 'APPROVED';
  qs_rank: number | null;
  qs_overall_score: number | null;
  sort_order: number;
}

interface FacultyWishlistItem {
  major_id: number | null;
  faculty_name: string;
  industry_group: string | null;
  occupation_code: string | null;
  status: 'PENDING' | 'APPROVED';
  sort_order: number;
  in_wishlist: boolean;
}

type SubTab = 'school' | 'faculty';

export default function WishlistTab({ studentId }: WishlistTabProps) {
  const [activeSubTab, setActiveSubTab] = useState<SubTab>('school');

  const [schoolItems, setSchoolItems] = useState<SchoolWishlistItem[]>([]);
  const [facultyItems, setFacultyItems] = useState<FacultyWishlistItem[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);
  const [actionMajorLoadingId, setActionMajorLoadingId] = useState<number | null>(null);

  const fetchSchoolWishlist = async () => {
    const res = await fetch(`/api/mentor/students/${studentId}/school-wishlist`, {
      cache: 'no-store',
      credentials: 'include',
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.error || 'Không thể tải nguyện vọng trường');
    return Array.isArray(data?.items) ? data.items : [];
  };

  const fetchFacultyWishlist = async () => {
    const res = await fetch(`/api/mentor/students/${studentId}/faculty-wishlist`, {
      cache: 'no-store',
      credentials: 'include',
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.error || 'Không thể tải nguyện vọng ngành');
    return Array.isArray(data?.items) ? data.items : [];
  };

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [schools, faculties] = await Promise.all([
        fetchSchoolWishlist(),
        fetchFacultyWishlist()
      ]);
      setSchoolItems(schools);
      setFacultyItems(faculties);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Đã có lỗi xảy ra');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;
    loadData().then(() => {
      if (!isMounted) return;
    });
    return () => {
      isMounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [studentId]);

  const handleReviewSchool = async (universityId: number, action: 'APPROVE' | 'REJECT') => {
    try {
      setActionLoadingId(universityId);
      const res = await fetch(`/api/mentor/students/${studentId}/universities/${universityId}/review`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
        credentials: 'include',
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Không thể thực hiện thao tác');
      
      toast.success(action === 'APPROVE' ? 'Đã duyệt trường thành công' : 'Đã từ chối trường');
      // Refresh only schools
      const newSchools = await fetchSchoolWishlist();
      setSchoolItems(newSchools);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Đã có lỗi xảy ra');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleReviewMajor = async (majorId: number | null, action: 'APPROVE' | 'REJECT') => {
    if (majorId === null) {
      toast.error('Lỗi dữ liệu ngành học, không có ID!');
      return;
    }
    try {
      setActionMajorLoadingId(majorId);
      const res = await fetch(`/api/mentor/students/${studentId}/majors/${majorId}/review`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
        credentials: 'include',
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Không thể thực hiện thao tác');
      
      toast.success(action === 'APPROVE' ? 'Đã duyệt ngành thành công' : 'Đã từ chối và Xoá đề xuất');
      // Refresh only faculties
      const newFaculties = await fetchFacultyWishlist();
      setFacultyItems(newFaculties);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Đã có lỗi xảy ra');
    } finally {
      setActionMajorLoadingId(null);
    }
  };

  if (loading) {
    return (
      <div className="py-8 text-center">
        <h3 className="text-lg font-medium text-gray-900">Nguyện vọng</h3>
        <p className="mt-2 text-sm text-gray-500">Đang tải dữ liệu...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-8 text-center">
        <h3 className="text-lg font-medium text-gray-900">Nguyện vọng</h3>
        <p className="mt-2 text-sm text-red-600">{error}</p>
      </div>
    );
  }

  const pendingSchools = schoolItems.filter(i => i.status === 'PENDING');
  const approvedSchools = schoolItems.filter(i => i.status === 'APPROVED');

  const pendingFaculties = facultyItems.filter(i => i.status === 'PENDING');
  // APPROVED list là những ngành trong DB của học viên tức là hiển thị trong danh sách chính thức
  // (In wishlist, regardless if it was an old major or a freshly approved one). 
  // PENDING majors that are "in wishlist" will also show up under "Danh sách đề xuất PENDING".
  const approvedFaculties = facultyItems.filter(i => i.status === 'APPROVED' && i.in_wishlist);

  return (
    <div className="space-y-6">
      {/* Sub-tab Controller */}
      <div className="flex w-fit rounded-lg bg-gray-100 p-1">
        <button
          onClick={() => setActiveSubTab('school')}
          className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
            activeSubTab === 'school' ? 'bg-white text-gray-900 shadow' : 'text-gray-500 hover:text-gray-900'
          }`}
        >
          Trường
          {pendingSchools.length > 0 && <span className="ml-1.5 rounded-full bg-yellow-100 px-2 py-0.5 text-xs text-yellow-700">{pendingSchools.length}</span>}
        </button>
        <button
          onClick={() => setActiveSubTab('faculty')}
          className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
            activeSubTab === 'faculty' ? 'bg-white text-gray-900 shadow' : 'text-gray-500 hover:text-gray-900'
          }`}
        >
          Ngành
            {pendingFaculties.length > 0 && <span className="ml-1.5 rounded-full bg-yellow-100 px-2 py-0.5 text-xs text-yellow-700">{pendingFaculties.length}</span>}
        </button>
      </div>

      {activeSubTab === 'school' && (
        <div className="space-y-8 animate-in fade-in">
          {schoolItems.length === 0 ? (
            <div className="py-8 text-center">
              <GraduationCap className="mx-auto h-16 w-16 text-gray-400" />
              <p className="mt-4 text-sm text-gray-500">Học viên chưa thêm trường nào vào nguyện vọng.</p>
            </div>
          ) : (
            <>
              {pendingSchools.length > 0 && (
                <div>
                  <h3 className="mb-4 text-lg font-semibold text-gray-900">Trường cần duyệt</h3>
                  <div className="space-y-4">
                    {pendingSchools.map((item) => (
                      <div key={item.university_id} className="rounded-lg border border-yellow-200 bg-yellow-50 p-5 shadow-sm">
                        <div className="flex flex-col justify-between gap-4 sm:flex-row">
                          <div>
                            <div className="mb-1 flex items-center gap-2">
                              <h4 className="text-base font-semibold text-gray-900">{item.name}</h4>
                              <span className="inline-flex items-center rounded-full bg-yellow-100 px-2 py-0.5 text-xs font-medium text-yellow-800">
                                Đang chờ duyệt
                              </span>
                            </div>
                            <div className="space-y-1 text-sm text-gray-600">
                              <p>{[item.country, item.region].filter(Boolean).join(' • ')}</p>
                              {item.website_url && (
                                <a 
                                  href={item.website_url} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center text-blue-600 hover:text-blue-800 hover:underline"
                                >
                                  {item.website_url}
                                  <ExternalLink className="ml-1 h-3 w-3" />
                                </a>
                              )}
                            </div>
                          </div>
                          
                          <div className="flex shrink-0 flex-row gap-2 sm:flex-col">
                            <button
                              disabled={actionLoadingId === item.university_id}
                              onClick={() => handleReviewSchool(item.university_id, 'APPROVE')}
                              className="inline-flex items-center justify-center rounded-md bg-blue-600/90 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-600/80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:opacity-50"
                            >
                              {actionLoadingId === item.university_id ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Check className="mr-2 h-4 w-4" />}
                              Duyệt
                            </button>
                            <button
                              disabled={actionLoadingId === item.university_id}
                              onClick={() => handleReviewSchool(item.university_id, 'REJECT')}
                              className="inline-flex items-center justify-center rounded-md bg-red-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600 disabled:opacity-50"
                            >
                              {actionLoadingId === item.university_id ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <X className="mr-2 h-4 w-4" />}
                              Từ chối & Xóa
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {approvedSchools.length > 0 && (
                <div className={pendingSchools.length > 0 ? "border-t border-gray-200 pt-6" : ""}>
                  <h3 className="mb-4 text-lg font-semibold text-gray-900">Danh sách chính thức</h3>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    {approvedSchools.map((item) => (
                      <div key={item.university_id} className="rounded-lg border border-gray-200 bg-white p-4">
                        <h4 className="text-base font-semibold text-gray-900">{item.name}</h4>
                        <div className="mt-1 text-sm text-gray-600">
                          <p>{[item.country, item.region].filter(Boolean).join(' • ')}</p>
                          {item.qs_rank && <p className="mt-1 text-xs text-gray-500">QS Rank: #{item.qs_rank}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {activeSubTab === 'faculty' && (
        <div className="space-y-8 animate-in fade-in">
          {facultyItems.length === 0 ? (
            <div className="py-8 text-center">
              <BookOpen className="mx-auto h-16 w-16 text-gray-400" />
              <p className="mt-4 text-sm text-gray-500">Học viên chưa thêm ngành nào vào nguyện vọng.</p>
            </div>
          ) : (
            <>
              {pendingFaculties.length > 0 && (
                <div>
                  <h3 className="mb-4 text-lg font-semibold text-gray-900">Ngành cần duyệt</h3>
                  <div className="space-y-4">
                    {pendingFaculties.map((item, idx) => (
                      <div key={item.major_id ?? `p-${idx}`} className="rounded-lg border border-yellow-200 bg-yellow-50 p-5 shadow-sm">
                        <div className="flex flex-col justify-between gap-4 sm:flex-row">
                          <div>
                            <div className="mb-1 flex items-center gap-2">
                              <h4 className="text-base font-semibold text-gray-900">{item.faculty_name}</h4>
                              <span className="inline-flex items-center rounded-full bg-yellow-100 px-2 py-0.5 text-xs font-medium text-yellow-800">
                                Đang chờ duyệt
                              </span>
                            </div>
                            <div className="space-y-1 text-sm text-gray-600">
                              <p>Nhóm ngành: <span className="font-medium text-gray-800">{item.industry_group || 'Chưa phân loại'}</span></p>
                            </div>
                          </div>
                          
                          <div className="flex shrink-0 flex-row gap-2 sm:flex-col">
                            <button
                              disabled={actionMajorLoadingId === item.major_id}
                              onClick={() => handleReviewMajor(item.major_id, 'APPROVE')}
                              className="inline-flex items-center justify-center rounded-md bg-blue-600/90 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-600/80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:opacity-50"
                            >
                              {actionMajorLoadingId === item.major_id ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Check className="mr-2 h-4 w-4" />}
                              Duyệt
                            </button>
                            <button
                              disabled={actionMajorLoadingId === item.major_id}
                              onClick={() => handleReviewMajor(item.major_id, 'REJECT')}
                              className="inline-flex items-center justify-center rounded-md bg-red-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600 disabled:opacity-50"
                            >
                              {actionMajorLoadingId === item.major_id ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <X className="mr-2 h-4 w-4" />}
                              Từ chối & Xóa
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {approvedFaculties.length > 0 && (
                <div className={pendingFaculties.length > 0 ? "border-t border-gray-200 pt-6" : ""}>
                  <h3 className="mb-4 text-lg font-semibold text-gray-900">Danh sách chính thức</h3>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    {approvedFaculties.map((item, idx) => (
                      <div key={item.major_id ?? `a-${idx}`} className="rounded-lg border border-gray-200 bg-white p-4">
                        <div className="flex items-start gap-3">
                          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-semibold text-blue-700">
                            {idx + 1}
                          </span>
                          <div>
                            <h4 className="text-base font-semibold text-gray-900">{item.faculty_name}</h4>
                            <div className="mt-1 text-sm text-gray-600">
                              <p>Nhóm ngành: {item.industry_group || '-'}</p>
                              {item.occupation_code && <p className="mt-1 text-xs text-gray-500">Mã ngành: {item.occupation_code}</p>}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

    </div>
  );
}
