'use client';

import Link from 'next/link';
import { ArrowRight, User } from 'lucide-react';
import type { AssignedStudent } from '@/types/mentor';

interface StudentListProps {
  students: AssignedStudent[];
}

export default function StudentList({ students }: StudentListProps) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
      <div className="border-b border-gray-200 px-6 py-4">
        <h2 className="text-lg font-semibold text-gray-900">Danh sách học viên</h2>
        <p className="mt-1 text-sm text-gray-500">
          {students.length} học viên đang được phụ trách
        </p>
      </div>

      <div className="divide-y divide-gray-200">
        {students.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <User className="mx-auto h-12 w-12 text-gray-400" />
            <p className="mt-2 text-sm text-gray-500">Chưa có học viên nào</p>
          </div>
        ) : (
          students.map((student) => (
            <div
              key={student.student_id}
              className="px-6 py-4 transition-colors hover:bg-gray-50"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 flex-1">
                  {/* Avatar */}
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-linear-to-br from-[#0f4c81] to-blue-600 text-white font-semibold">
                    {student.student.full_name.charAt(0).toUpperCase()}
                  </div>

                  {/* Student Info */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-gray-900">
                      {student.student.full_name}
                    </h3>
                    <p className="text-sm text-gray-500 truncate">
                      {student.student.email}
                    </p>

                    {/* Progress Bar */}
                    <div className="mt-2">
                      <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                        <span>Tiến độ</span>
                        <span className="font-medium">{student.progress}%</span>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
                        <div
                          className="h-full rounded-full bg-linear-to-r from-[#0f4c81] to-blue-500 transition-all"
                          style={{ width: `${student.progress}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Status Badge */}
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-800">
                      Hoạt động
                    </span>
                  </div>
                </div>

                {/* Action Button */}
                <Link
                  href={`/mentor/students?studentId=${student.student_id}`}
                  className="ml-4 flex h-10 w-10 items-center justify-center rounded-lg border border-gray-300 text-gray-600 transition-colors hover:border-[#0f4c81] hover:bg-[#0f4c81] hover:text-white"
                >
                  <ArrowRight className="h-5 w-5" />
                </Link>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
