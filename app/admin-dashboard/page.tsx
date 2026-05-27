import { AdminGuard } from '@/components/admin/AdminGuard';
import { AdminPanel } from '@/components/admin/AdminPanel';
import { AdminBidLockGuard } from '@/components/season/AdminBidLockGuard';
import { SeasonManagementPanel } from '@/components/season/SeasonManagementPanel';

export default function AdminDashboardPage() {
  return (
    <AdminGuard>
      <AdminBidLockGuard />
      <AdminPanel />
      <SeasonManagementPanel />
    </AdminGuard>
  );
}
