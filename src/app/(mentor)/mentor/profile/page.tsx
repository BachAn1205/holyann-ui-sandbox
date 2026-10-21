import MentorProfilePageClient from '@/components/mentor/profile/MentorProfilePageClient';

export const metadata = {
  title: 'Hồ sơ chuyên môn | Holyann Cố vấn',
  description: 'Cập nhật thông tin cá nhân và chuyên môn',
};

export default function MentorProfilePage() {
  return (
    <div className="profile-creative-page-bg min-h-[calc(100vh-theme(spacing.14))]">
      <div className="w-full px-4 py-6 sm:px-6 md:px-8 md:py-8">
        <div className="profile-creative-scope mx-auto w-full max-w-screen-2xl">
          <MentorProfilePageClient />
        </div>
      </div>
    </div>
  );
}
