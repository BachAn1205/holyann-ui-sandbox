import Link from 'next/link';

export default function ProfileEnhancerPage() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Profile Enhancer</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link href="/dashboard/profile-enhancer/cv-assistant" className="p-4 border rounded hover:bg-gray-50">
          <h2 className="text-xl font-semibold">CV Assistant</h2>
          <p>Hỗ trợ tối ưu hóa hồ sơ năng lực.</p>
        </Link>
        <Link href="/dashboard/profile-enhancer/essay-reviewer" className="p-4 border rounded hover:bg-gray-50">
          <h2 className="text-xl font-semibold">Essay Reviewer</h2>
          <p>Chấm và sửa bài luận học thuật.</p>
        </Link>
      </div>
    </div>
  );
}
