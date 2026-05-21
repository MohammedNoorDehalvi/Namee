import { Hero3D } from '@/components/home/Hero3D';
import { HomeAuctionGate } from '@/components/home/HomeAuctionGate';
import { ScrollShowcase } from '@/components/home/ScrollShowcase';

export default function HomePage() {
  return (
    <HomeAuctionGate>
      <div className="section-shell py-8 sm:py-12">
        <Hero3D />
        <ScrollShowcase />
      </div>
    </HomeAuctionGate>
  );
}
