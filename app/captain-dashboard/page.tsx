import { CaptainDashboardClient } from '@/components/captain/CaptainDashboardClient';
import { CaptainGuard } from '@/components/captain/CaptainGuard';

export default function CaptainDashboardPage() {
  return (
    <main className="section-shell py-8 sm:py-10">
      <CaptainGuard>
        <CaptainDashboardClient />
      </CaptainGuard>
    </main>
  );
}
