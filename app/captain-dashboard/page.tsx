import { CaptainDashboardClient } from '@/components/captain/CaptainDashboardClient';
import { CaptainGuard } from '@/components/captain/CaptainGuard';

export default function CaptainDashboardPage() {
  return <CaptainGuard><CaptainDashboardClient /></CaptainGuard>;
}
