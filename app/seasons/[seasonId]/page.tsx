import { OldSeasonDetailsClient } from '@/components/season/OldSeasonDetailsClient';

export default function OldSeasonPage({ params }: { params: { seasonId: string } }) {
  return <OldSeasonDetailsClient seasonId={params.seasonId} />;
}
