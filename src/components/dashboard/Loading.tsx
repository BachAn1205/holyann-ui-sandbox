import { PageLoading } from '@/components/ui/PageLoading';

export default function Loading({ message }: { message?: string }) {
    return (
        <div className="min-h-screen bg-background">
            <PageLoading message={message ?? 'Đang tải...'} />
        </div>
    );
}
