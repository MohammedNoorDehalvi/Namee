import { TeamsClient } from '@/components/teams/TeamsClient';
import { SectionHeading } from '@/components/ui/SectionHeading';

export default function TeamsPage() {
  return (
    <section className="px-4 py-14 sm:px-6">
      <SectionHeading eyebrow="Teams" title="Team-wise Player List" subtitle="See captain, team budget, remaining budget, bought players, total points spent, and sold players." />
      <div className="mx-auto mt-10 max-w-7xl"><TeamsClient /></div>
    </section>
  );
}
