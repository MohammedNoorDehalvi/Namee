import { Hero3D } from '@/components/home/Hero3D';
import { HomeAuctionGate } from '@/components/home/HomeAuctionGate';
import { ScrollShowcase } from '@/components/home/ScrollShowcase';

export default function HomePage() {
  return (
    <HomeAuctionGate>
      <Hero3D />
      <ScrollShowcase />
    </HomeAuctionGate>
  );
}
