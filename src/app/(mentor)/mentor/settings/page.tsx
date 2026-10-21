import { AccountSettingsForm } from "@/components/settings/AccountSettingsForm";

export const metadata = {
  title: "Cài đặt | Holyann Cố vấn",
  description: "Tên hiển thị và mật khẩu tài khoản cố vấn",
};

export default function MentorSettingsPage() {
  return (
    <div className="min-h-[calc(100vh-theme(spacing.14))]">
      <div className="w-full px-4 py-6 sm:px-6 md:px-8 md:py-8">
        <AccountSettingsForm roleDescriptor="cố vấn" />
      </div>
    </div>
  );
}
