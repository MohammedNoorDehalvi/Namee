import { AdminGuard } from '@/components/admin/AdminGuard';
import { AdminPanel } from '@/components/admin/AdminPanel';
import { AdminBidLockGuard } from '@/components/season/AdminBidLockGuard';

export default function AdminDashboardPage() {
  return (
    <AdminGuard>
      <AdminBidLockGuard />
      <AdminPanel />
    </AdminGuard>
  );
}
