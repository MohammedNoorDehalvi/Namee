import { TeamsClient } from '@/components/teams/TeamsClient';

export default function TeamsPage() {
  return (
    <main className="section-shell py-8 sm:py-12">
      <div className="mb-8">
        <p className="badge border-green-300/20 bg-green-300/10 text-green-200">Team Room</p>
        <h1 className="mt-4 text-4xl font-black tracking-tight text-white sm:text-5xl">APL Squads & Budgets</h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-white/60 sm:text-base">
          View team logos, captain photos, bought players, remaining points, and squad status in a premium IPL-style layout.
        </p>
      </div>
      <TeamsClient />
    </main>
  );
}
