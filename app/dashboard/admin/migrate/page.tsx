import { requireAuth } from '@/lib/auth/server-auth';
import MigrateClient from './migrate-client';

export const dynamic = 'force-dynamic';

export default async function AdminMigratePage() {
  await requireAuth('admin');

  return <MigrateClient />;
}
