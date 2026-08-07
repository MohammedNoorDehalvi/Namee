import { PlayerRegistrationForm } from '@/components/forms/PlayerRegistrationForm';
import { SectionHeading } from '@/components/ui/SectionHeading';

export default function PlayerRegistrationPage() {
  return (
    <section className="px-4 pb-4 sm:px-6">
      <SectionHeading eyebrow="Player Entry" title="Register for APL Auction" subtitle="Submit your player profile. Admin will approve, edit if needed, and set your base price." />
      <div className="mt-10"><PlayerRegistrationForm /></div>
    </section>
  );
}
