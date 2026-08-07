import { Suspense } from 'react';
import { LiveAuction } from '@/components/auction/LiveAuction';
import { CaptainDashboardClient } from '@/components/captain/CaptainDashboardClient';
import { AuctionPageSkeleton } from '@/components/ui/AuctionSkeleton';

type AuctionPageProps = {
  searchParams?: {
    captain?: string;
    view?: string;
  };
};

export default function AuctionPage({ searchParams }: AuctionPageProps) {
  const isCaptainMode = searchParams?.captain === '1';

  if (isCaptainMode) {
    return <CaptainDashboardClient />;
  }

  return (
    <div className="mx-auto max-w-[1600px] px-4 pb-4 sm:px-6 lg:px-8">
      <Suspense fallback={<AuctionPageSkeleton />}>
        <LiveAuction mode="public" />
      </Suspense>
    </div>
  );
}
