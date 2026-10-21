"use client";

import { StudentPageContainer } from "@/components/student";
import { AccountSettingsForm } from "@/components/settings/AccountSettingsForm";

export default function StudentSettingsPage() {
  return (
    <StudentPageContainer>
      <AccountSettingsForm />
    </StudentPageContainer>
  );
}
