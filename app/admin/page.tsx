import { Card } from '@/components/ui/card';
import { StatsCards } from '@/components/StatsCards';
import { requireAdmin } from '@/lib/admin';

export default async function AdminHomePage() {
  const { supabase } = await requireAdmin();

  const [usersCount, reportsCount, challengesCount, goalsCount, activeChallenges, suspendedUsers] = await Promise.all([
    supabase.from('profiles').select('id', { count: 'exact', head: true }),
    supabase.from('reports').select('id', { count: 'exact', head: true }),
    supabase.from('challenges').select('id', { count: 'exact', head: true }),
    supabase.from('goals').select('id', { count: 'exact', head: true }),
    supabase.from('challenges').select('id', { count: 'exact', head: true }).eq('is_active', true),
    supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('is_suspended', true),
  ]);

  const users = usersCount.count ?? 0;
  const reports = reportsCount.count ?? 0;
  const challenges = challengesCount.count ?? 0;
  const goals = goalsCount.count ?? 0;
  const active = activeChallenges.count ?? 0;
  const suspended = suspendedUsers.count ?? 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
        <p className="text-muted-foreground mt-1">Manage users, reports, challenges, and platform health.</p>
      </div>

      <StatsCards
        items={[
          { label: 'Users', value: users.toLocaleString(), hint: `${suspended} suspended`, tone: 'warning' },
          { label: 'Reports', value: reports.toLocaleString(), hint: 'Moderation queue', tone: 'default' },
          { label: 'Challenges', value: challenges.toLocaleString(), hint: `${active} active`, tone: 'positive' },
          { label: 'Goals', value: goals.toLocaleString(), hint: 'User progress', tone: 'default' },
        ]}
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="glass rounded-2xl p-5 lg:col-span-2">
          <h2 className="font-semibold text-lg">Admin Actions</h2>
          <ul className="mt-3 grid sm:grid-cols-2 gap-2 text-sm text-muted-foreground">
            <li>Reset user password</li>
            <li>Suspend or unsuspend users</li>
            <li>Promote users to admin</li>
            <li>Approve or reject reports</li>
            <li>Create and moderate challenges</li>
            <li>Export users and reports to CSV</li>
          </ul>
        </Card>

        <Card className="glass rounded-2xl p-5">
          <h2 className="font-semibold text-lg">Quick Links</h2>
          <div className="mt-3 space-y-2 text-sm">
            <a href="/admin/users" className="block text-primary hover:underline">Users</a>
            <a href="/admin/reports" className="block text-primary hover:underline">Reports</a>
            <a href="/admin/challenges" className="block text-primary hover:underline">Challenges</a>
            <a href="/admin/analytics" className="block text-primary hover:underline">Analytics</a>
          </div>
        </Card>
      </div>
    </div>
  );
}
