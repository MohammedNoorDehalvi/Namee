import { AuctionScreen } from '@/components/auction/AuctionScreen';
import { SectionHeading } from '@/components/ui/SectionHeading';

export default function AuctionPage() {
  return (
    <section className="px-4 py-14 sm:px-6">
      <SectionHeading eyebrow="Live Auction" title="APL Auction Dashboard" subtitle="Visible to everyone. Captains can bid only after logging in and only when admin starts the auction." />
      <div className="mt-10"><AuctionScreen /></div>
    </section>
  );
}
