import { redirect } from 'next/navigation';

export default async function StudentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(`/mentor/students?studentId=${id}`);
}
