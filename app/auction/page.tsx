import { LiveAuction } from '@/components/auction/LiveAuction';
import { CaptainDashboardClient } from '@/components/captain/CaptainDashboardClient';

type AuctionPageProps = {
  searchParams?: {
    captain?: string;
  };
};

export default function AuctionPage({ searchParams }: AuctionPageProps) {
  const isCaptainMode = searchParams?.captain === '1';

  if (isCaptainMode) {
    return <CaptainDashboardClient />;
  }

  return <LiveAuction mode="public" />;
}
