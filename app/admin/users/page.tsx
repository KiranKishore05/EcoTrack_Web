import { UserTable } from '@/components/UserTable';
import { requireAdmin } from '@/lib/admin';

type ProfileRow = {
  id: string;
  display_name: string | null;
  email: string | null;
  avatar_url: string | null;
  role: 'user' | 'moderator' | 'admin';
  is_suspended: boolean;
  sustainability_index: number;
  level: number;
  created_at: string;
};

export default async function AdminUsersPage() {
  const { supabase } = await requireAdmin();

  const [profilesRes, goalsRes, reportsRes] = await Promise.all([
    supabase
      .from('profiles')
      .select('id, display_name, email, avatar_url, role, is_suspended, sustainability_index, level, created_at')
      .order('created_at', { ascending: false }),
    supabase.from('goals').select('user_id'),
    supabase.from('reports').select('user_id'),
  ]);

  const goalsByUser = new Map<string, number>();
  for (const row of goalsRes.data ?? []) {
    const key = row.user_id as string;
    goalsByUser.set(key, (goalsByUser.get(key) ?? 0) + 1);
  }

  const reportsByUser = new Map<string, number>();
  for (const row of reportsRes.data ?? []) {
    const key = row.user_id as string;
    reportsByUser.set(key, (reportsByUser.get(key) ?? 0) + 1);
  }

  const users = ((profilesRes.data ?? []) as ProfileRow[]).map((profile) => ({
    ...profile,
    goalsCount: goalsByUser.get(profile.id) ?? 0,
    reportsCount: reportsByUser.get(profile.id) ?? 0,
  }));

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Users</h1>
        <p className="text-muted-foreground mt-1">View profiles, user stats, and account control actions.</p>
      </div>

      <UserTable initialUsers={users} />
    </div>
  );
}
