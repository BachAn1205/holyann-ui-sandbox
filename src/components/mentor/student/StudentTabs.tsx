'use client';

import { useState, useEffect } from 'react';
import SchoolListTab from './SchoolListTab';
import DeadlineManagementTab from './DeadlineManagementTab';
import ChecklistTab from './ChecklistTab';
import EssayTab from './EssayTab';
import WishlistTab from './WishlistTab';

interface StudentTabsProps {
  studentId: string;
}

type TabType = 'checklist' | 'essays' | 'deadlines' | 'schools' | 'wishlist';

export default function StudentTabs({ studentId }: StudentTabsProps) {
  const [activeTab, setActiveTab] = useState<TabType>('checklist');
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    let isMounted = true;
    Promise.all([
      fetch(`/api/mentor/students/${studentId}/school-wishlist`, { cache: 'no-store' }).then(res => res.json()),
      fetch(`/api/mentor/students/${studentId}/faculty-wishlist`, { cache: 'no-store' }).then(res => res.json()),
    ])
      .then(([schoolsData, facultiesData]) => {
        if (!isMounted) return;
        let count = 0;
        if (schoolsData?.items) {
          count += schoolsData.items.filter((i: any) => i.status === 'PENDING').length;
        }
        if (facultiesData?.items) {
          count += facultiesData.items.filter((i: any) => i.status === 'PENDING').length;
        }
        setPendingCount(count);
      })
      .catch(console.error);

    return () => {
      isMounted = false;
    };
  }, [studentId]);

  const tabs = [
    { id: 'checklist' as TabType, label: 'Tiến độ' },
    { id: 'essays' as TabType, label: 'Quản lý Luận & CV' },
    { id: 'deadlines' as TabType, label: 'Hạn chót' },
    { id: 'schools' as TabType, label: 'Mục tiêu' },
    { id: 'wishlist' as TabType, label: pendingCount > 0 ? `Nguyện vọng (${pendingCount})` : 'Nguyện vọng' },
  ];

  return (
    <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
      {/* Tab Headers */}
      <div className="border-b border-gray-200">
        <nav className="flex gap-8 px-6" aria-label="Tabs">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`border-b-2 px-1 py-4 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'border-[#0f4c81] text-[#0f4c81]'
                  : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="p-6">
        {activeTab === 'checklist' && <ChecklistTab studentId={studentId} />}
        {activeTab === 'essays' && <EssayTab studentId={studentId} />}
        {activeTab === 'schools' && <SchoolListTab studentId={studentId} />}
        {activeTab === 'wishlist' && <WishlistTab studentId={studentId} />}
        {activeTab === 'deadlines' && <DeadlineManagementTab studentId={studentId} />}
      </div>
    </div>
  );
}
