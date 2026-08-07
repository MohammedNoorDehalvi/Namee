import { TeamsClient } from '@/components/teams/TeamsClient';
import { PageHeader, PageShell } from '@/components/ui/PageShell';

export default function TeamsPage() {
  return (
    <PageShell>
      <PageHeader
        eyebrow="Teams"
        title="Team-wise player list"
        description="Captain, purse, remaining budget, bought players, and points spent for every franchise."
      />
      <div className="mt-10">
        <TeamsClient />
      </div>
    </PageShell>
  );
}
