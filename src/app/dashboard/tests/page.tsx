import { redirect } from 'next/navigation';

/**
 * Redirect /dashboard/tests?type=mbti|grit-scale|riasec → /student/tests?type=...
 * Giữ query type để trang student/tests có thể mở đúng bài test.
 */
export default async function DashboardTestsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const type = typeof params?.type === 'string' ? params.type.toLowerCase() : '';

  const typeMap: Record<string, string> = {
    mbti: 'mbti',
    'grit-scale': 'grit',
    grit: 'grit',
    riasec: 'riasec',
  };
  const normalized = typeMap[type] || '';
  const query = normalized ? `?type=${normalized}` : '';

  redirect(`/student/tests${query}`);
}
