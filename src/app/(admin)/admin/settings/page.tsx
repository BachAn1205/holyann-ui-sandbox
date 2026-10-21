import { AccountSettingsForm } from "@/components/settings/AccountSettingsForm";

export const metadata = {
  title: "Cài đặt | Holyann Quản trị",
  description: "Tên hiển thị và mật khẩu tài khoản quản trị",
};

export default function AdminSettingsPage() {
  return (
    <div className="mx-auto max-w-2xl">
      <AccountSettingsForm roleDescriptor="quản trị" />
    </div>
  );
}
