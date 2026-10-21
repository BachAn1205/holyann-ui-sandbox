import Link from 'next/link';

export default function AssessmentsPage() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Personal Assessments</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link href="/dashboard/assessments/mbti" className="p-4 border rounded hover:bg-gray-50">
          <h2 className="text-xl font-semibold">MBTI Test</h2>
          <p>Khám phá tính cách của bạn.</p>
        </Link>
        <Link href="/dashboard/assessments/riasec" className="p-4 border rounded hover:bg-gray-50">
          <h2 className="text-xl font-semibold">RIASEC Test</h2>
          <p>Định hướng nghề nghiệp phù hợp.</p>
        </Link>
      </div>
    </div>
  );
}
