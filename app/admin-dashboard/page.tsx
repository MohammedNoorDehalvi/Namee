import { AdminGuard } from '@/components/admin/AdminGuard';
import { AdminPanel } from '@/components/admin/AdminPanel';

export default function AdminDashboardPage() {
  return <AdminGuard><AdminPanel /></AdminGuard>;
}
