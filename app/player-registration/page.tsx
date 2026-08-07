import { PlayerRegistrationForm } from '@/components/forms/PlayerRegistrationForm';
import { PageHeader, PageShell } from '@/components/ui/PageShell';

export default function PlayerRegistrationPage() {
  return (
    <PageShell>
      <PageHeader
        eyebrow="Player entry"
        title="Register for APL Auction"
        description="Submit your profile and photo. Admin will approve, edit if needed, and set your base price."
      />
      <div className="mt-10">
        <PlayerRegistrationForm />
      </div>
    </PageShell>
  );
}
