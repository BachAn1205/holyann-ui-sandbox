import { AccountSettingsForm } from "@/components/settings/AccountSettingsForm";

export const metadata = {
  title: "Cài đặt | Holyann Marketing",
  description: "Tên hiển thị và mật khẩu tài khoản marketing",
};

export default function MarketingSettingsPage() {
  return (
    <div className="mx-auto max-w-2xl">
      <AccountSettingsForm roleDescriptor="marketing" />
    </div>
  );
}
