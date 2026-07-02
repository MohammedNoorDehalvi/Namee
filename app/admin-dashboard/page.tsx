import { AdminGuard } from '@/components/admin/AdminGuard';
import { AdminPanel } from '@/components/admin/AdminPanel';
import { AdminChooseNextPlayerPanel } from '@/components/admin/AdminChooseNextPlayerPanel';
import { AdminBidLockGuard } from '@/components/season/AdminBidLockGuard';
import { SeasonManagementPanel } from '@/components/season/SeasonManagementPanel';

export default function AdminDashboardPage() {
  return (
    <AdminGuard>
      <AdminBidLockGuard />
      <AdminPanel />
      <AdminChooseNextPlayerPanel />
      <SeasonManagementPanel />
    </AdminGuard>
  );
}
