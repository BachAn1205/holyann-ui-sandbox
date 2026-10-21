'use client';

import { useEffect, useState } from 'react';
import { getMentorStudents } from '@/actions/mentor';
import type { AssignedStudent } from '@/types/mentor';

/**
 * Example component demonstrating how to use the getMentorStudents server action
 * This shows how to call the server action directly from a component
 */
export default function MentorStudentsExample() {
  const [students, setStudents] = useState<AssignedStudent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Example mentor ID - in real app, this would come from session/auth
  const EXAMPLE_MENTOR_ID = "your-mentor-id-here";

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        setLoading(true);
        setError(null);

        // Call the server action directly
        const studentsData = await getMentorStudents(EXAMPLE_MENTOR_ID);
        setStudents(studentsData);
      } catch (err) {
        console.error('Error fetching students:', err);
        setError('Failed to fetch students');
      } finally {
        setLoading(false);
      }
    };

    fetchStudents();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
        <span className="ml-2">Loading students...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center">
        <div className="text-red-500">{error}</div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Danh sách Sinh viên theo Cố vấn</h1>

      {students.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500">No students assigned to this Cố vấn</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {students.map((student) => (
            <div
              key={student.student_id}
              className="border rounded-lg p-4 bg-white shadow-sm"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h3 className="font-semibold text-lg">
                    {student.student.full_name}
                  </h3>
                  <p className="text-gray-600">{student.student.email}</p>
                  <div className="mt-2">
                    <div className="flex items-center justify-between text-sm text-gray-600 mb-1">
                      <span>Progress</span>
                      <span className="font-semibold">{student.progress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-500 h-2 rounded-full transition-all"
                        style={{ width: `${student.progress}%` }}
                      />
                    </div>
                  </div>
                </div>
                <div className="ml-4">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    {student.status}
                  </span>
                  <div className="text-xs text-gray-500 mt-1">
                    Type: {student.type}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-8 p-4 bg-gray-100 rounded-lg">
        <h2 className="font-semibold mb-2">How to use getMentorStudents:</h2>
        <pre className="text-sm bg-white p-3 rounded border overflow-x-auto">
{`import { getMentorStudents } from '@/actions/mentor';

// In a server component:
export default async function ServerComponent({ mentorId }: { mentorId: string }) {
  const students = await getMentorStudents(mentorId);
  return <StudentsList students={students} />;
}

// In a client component (like this example):
const [students, setStudents] = useState([]);
useEffect(() => {
  getMentorStudents(mentorId).then(setStudents);
}, [mentorId]);`}
        </pre>
      </div>
    </div>
  );
}
