import { Suspense } from 'react';
import StudentListFull from '@/components/mentor/students/StudentListFull';
import MentorStudentsHero from '@/components/mentor/students/MentorStudentsHero';

export const metadata = {
  title: 'Quản lý học viên | Holyann Cố vấn',
  description: 'Danh sách học viên đang phụ trách',
};

export default function StudentsListPage() {
  return (
    <div>
      <MentorStudentsHero />
      <Suspense
        fallback={
          <div className="px-4 pb-6 sm:px-6">
            <div className="h-64 rounded-xl border border-border bg-card" />
          </div>
        }
      >
        <StudentListFull />
      </Suspense>
    </div>
  );
}
