'use client';

import { useEffect, useState } from 'react';
import { ArrowLeft, Mail, Phone, User } from 'lucide-react';
import Link from 'next/link';
import StudentTabs from './StudentTabs';

interface StudentInfo {
  id: string;
  full_name: string;
  email: string;
  phone_number: string | null;
  avatar_url: string | null;
}

interface StudentDetailContentProps {
  studentId: string;
}

export default function StudentDetailContent({ studentId }: StudentDetailContentProps) {
  const [student, setStudent] = useState<StudentInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStudentData = async () => {
      try {
        const response = await fetch(`/api/mentor/student/${studentId}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch student data');
        }

        const data = await response.json();
        setStudent(data);
      } catch (error) {
        console.error('Error fetching student data:', error);
        setStudent(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStudentData();
  }, [studentId]);

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#0f4c81] border-t-transparent" />
      </div>
    );
  }

  if (!student) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-12 text-center">
        <User className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-4 text-lg font-medium text-gray-900">Không tìm thấy học viên</h3>
        <p className="mt-2 text-sm text-gray-500">
          Học viên này không tồn tại hoặc bạn không có quyền truy cập
        </p>
        <Link
          href="/mentor/dashboard"
          className="mt-6 inline-flex items-center gap-2 text-sm text-[#0f4c81] hover:underline"
        >
          <ArrowLeft className="h-4 w-4" />
          Quay lại trang chủ
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <Link
        href="/mentor/dashboard"
        className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-[#0f4c81]"
      >
        <ArrowLeft className="h-4 w-4" />
        Quay lại
      </Link>

      {/* Student Header Card */}
      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-6">
          {/* Avatar */}
          <div className="flex h-20 w-20 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#0f4c81] to-blue-600 text-2xl font-bold text-white">
            {student.full_name.charAt(0).toUpperCase()}
          </div>

          {/* Student Info */}
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900">{student.full_name}</h1>
            <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                <span>{student.email}</span>
              </div>
              {student.phone_number && (
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  <span>{student.phone_number}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Student Tabs */}
      <StudentTabs studentId={studentId} />
    </div>
  );
}
