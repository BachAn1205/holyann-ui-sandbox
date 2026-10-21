export const dynamic = 'force-dynamic';

import MarketingNavbar from '@/components/marketing/MarketingNavbar';
import { MarketingFloatingActionMenu } from '@/components/support/MentorFloatingActionMenu';
import { requireMarketingPageAccess } from '@/lib/marketing/auth';

export default async function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireMarketingPageAccess();

  return (
    <div className="min-h-screen w-full bg-background text-foreground transition-colors duration-300 font-university-sans">
      <MarketingNavbar />
      <main className="w-full">
        <div className="container max-w-screen-2xl px-4 py-6 sm:px-6 md:px-8 md:py-8">{children}</div>
      </main>
      <MarketingFloatingActionMenu />
    </div>
  );
}

