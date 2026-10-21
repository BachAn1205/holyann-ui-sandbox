import { Suspense } from 'react';
import MentorDashboardContent from '@/components/mentor/dashboard/MentorDashboardContent';
import { Loader2 } from 'lucide-react';
import { StudentPageContainer } from '@/components/student';

export const metadata = {
  title: 'Dashboard Cố vấn | Holyann Explore',
  description: 'Quản lý học viên và theo dõi tiến độ',
};

export default function MentorDashboardPage() {
  return (
    <StudentPageContainer noPadding className="min-h-[calc(100vh-(--spacing(14)))]">
      <Suspense
        fallback={
          <div className="flex h-64 items-center justify-center px-4 sm:px-6">
            <Loader2 className="h-8 w-8 animate-spin text-[#0f4c81]" />
          </div>
        }
      >
        <MentorDashboardContent />
      </Suspense>
    </StudentPageContainer>
  );
}
