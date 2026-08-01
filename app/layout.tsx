import type { Metadata, Viewport } from 'next';
import { Inter, Outfit, Playfair_Display } from 'next/font/google';
import './globals.css';
import './liquid.css';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { AppToaster } from '@/components/ui/AppToaster';
import { SeasonPublicGate } from '@/components/season/SeasonPublicGate';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const outfit = Outfit({
  subsets: ['latin'],
  variable: '--font-outfit',
  display: 'swap',
  weight: ['400', '500', '600', '700', '800'],
});

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-playfair',
  display: 'swap',
  weight: ['400', '500', '600', '700'],
  style: ['normal', 'italic'],
});

export const metadata: Metadata = {
  title: 'APL Auction | Ashoka Premier League — Live Digital Cricket Auction',
  description:
    'Enter the Ashoka Premier League live digital cricket auction. Real-time bidding, protected budgets, and the drama of building a championship squad — all in one arena.',
  keywords: ['APL', 'Ashoka Premier League', 'cricket auction', 'live auction', 'digital auction', 'IPL style auction'],
  openGraph: {
    title: 'APL Auction | Ashoka Premier League',
    description: 'The next name called could change the whole season. Enter the live digital cricket auction.',
    type: 'website',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#071d31',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${outfit.variable} ${playfair.variable}`}>
      <body>
        <div className="arena-background" aria-hidden="true" />
        <div className="arena-lights" aria-hidden="true" />
        <div className="app-shell">
          <Navbar />
          <SeasonPublicGate>{children}</SeasonPublicGate>
          <Footer />
          <AppToaster />
        </div>
      </body>
    </html>
  );
}
