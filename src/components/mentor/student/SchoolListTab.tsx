'use client';

import { useEffect, useState } from 'react';
import { GraduationCap } from 'lucide-react';

interface SchoolListTabProps {
  studentId: string;
}

interface TargetGoalItem {
  id: string;
  faculty_name: string;
  university_name: string;
  sort_order: number;
  created_at: string;
}

export default function SchoolListTab({ studentId }: SchoolListTabProps) {
  const [goals, setGoals] = useState<TargetGoalItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function fetchTargetGoals() {
      try {
        setLoading(true);
        setError(null);

        const res = await fetch(`/api/mentor/students/${studentId}/target-goals`, {
          cache: 'no-store',
        });

        const data = await res.json();
        if (!res.ok) {
          throw new Error(data?.error || 'Không thể tải mục tiêu của học viên');
        }

        if (!isMounted) return;
        setGoals(Array.isArray(data?.goals) ? data.goals : []);
      } catch (e) {
        if (!isMounted) return;
        setError(e instanceof Error ? e.message : 'Không thể tải mục tiêu của học viên');
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    fetchTargetGoals();
    return () => {
      isMounted = false;
    };
  }, [studentId]);

  if (loading) {
    return (
      <div className="py-8 text-center">
        <h3 className="text-lg font-medium text-gray-900">Mục tiêu</h3>
        <p className="mt-2 text-sm text-gray-500">Đang tải dữ liệu mục tiêu...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-8 text-center">
        <h3 className="text-lg font-medium text-gray-900">Mục tiêu</h3>
        <p className="mt-2 text-sm text-red-600">{error}</p>
      </div>
    );
  }

  if (goals.length === 0) {
    return (
      <div className="py-8 text-center">
        <GraduationCap className="mx-auto h-16 w-16 text-gray-400" />
        <h3 className="mt-4 text-lg font-medium text-gray-900">Mục tiêu</h3>
        <p className="mt-2 text-sm text-gray-500">Học viên chưa thiết lập mục tiêu nào.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold text-gray-900">Mục tiêu</h3>
        <p className="mt-1 text-sm text-gray-500">Danh sách mục tiêu đã thiết lập theo hồ sơ học viên.</p>
      </div>

      <div className="space-y-3">
        {goals.map((goal, index) => (
          <div key={goal.id} className="rounded-lg border border-gray-200 bg-white p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-[#0f4c81]">Mục tiêu {index + 1}</p>
            <p className="mt-2 text-base font-medium text-gray-900">{goal.faculty_name}</p>
            <p className="text-sm text-gray-600">{goal.university_name}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
