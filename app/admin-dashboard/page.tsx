import { AdminGuard } from '@/components/admin/AdminGuard';
import { AdminPanel } from '@/components/admin/AdminPanel';

export default function AdminDashboardPage() {
  return (
    <main className="section-shell py-8 sm:py-10">
      <AdminGuard>
        <AdminPanel />
      </AdminGuard>
    </main>
  );
}
