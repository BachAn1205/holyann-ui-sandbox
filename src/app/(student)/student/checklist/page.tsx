'use client';

import ChecklistPage from '@/components/student/checklist/ChecklistPage';
import { StudentPageContainer } from '@/components/student';

export default function Checklist() {
  return (
    <StudentPageContainer noPadding>
      <ChecklistPage />
    </StudentPageContainer>
  );
}

