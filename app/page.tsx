import { Hero3D } from '@/components/home/Hero3D';
import { HomeAuctionGate } from '@/components/home/HomeAuctionGate';
import { ScrollShowcase } from '@/components/home/ScrollShowcase';
import { HomepageScrollBackground } from '@/components/home/HomepageScrollBackground';

export default function HomePage() {
  return (
    <>
      <HomepageScrollBackground />
      <HomeAuctionGate>
        <Hero3D />
        <ScrollShowcase />
      </HomeAuctionGate>
    </>
  );
}
