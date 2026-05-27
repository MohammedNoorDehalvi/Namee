import type { Metadata, Viewport } from 'next';
import './globals.css';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { AppToaster } from '@/components/ui/AppToaster';
import { SeasonPublicGate } from '@/components/season/SeasonPublicGate';

export const metadata: Metadata = {
  title: 'APL Online Auction | Ashoka Premier League',
  description: 'Mini IPL-style cricket auction system for Ashoka Premier League.',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#050A08',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Navbar />
        <SeasonPublicGate>{children}</SeasonPublicGate>
        <Footer />
        <AppToaster />
      </body>
    </html>
  );
}
