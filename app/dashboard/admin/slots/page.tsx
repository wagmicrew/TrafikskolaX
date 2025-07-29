import { requireAuth } from '@/lib/auth/server-auth';
import SlotsClient from './slots-client';

export const dynamic = 'force-dynamic';

export default async function AdminSlotsPage() {
  await requireAuth('admin');

  return <SlotsClient />;
}
