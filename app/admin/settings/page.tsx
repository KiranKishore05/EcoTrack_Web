import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { requireAdmin } from '@/lib/admin';

export default async function AdminSettingsPage() {
  const { supabase } = await requireAdmin();

  const [admins, moderators, users] = await Promise.all([
    supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'admin'),
    supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'moderator'),
    supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'user'),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Admin Settings</h1>
        <p className="text-muted-foreground mt-1">Role permissions and administrative controls.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="glass rounded-2xl p-5">
          <p className="text-sm text-muted-foreground">Admins</p>
          <p className="text-3xl font-semibold mt-1">{admins.count ?? 0}</p>
        </Card>
        <Card className="glass rounded-2xl p-5">
          <p className="text-sm text-muted-foreground">Moderators</p>
          <p className="text-3xl font-semibold mt-1">{moderators.count ?? 0}</p>
        </Card>
        <Card className="glass rounded-2xl p-5">
          <p className="text-sm text-muted-foreground">Users</p>
          <p className="text-3xl font-semibold mt-1">{users.count ?? 0}</p>
        </Card>
      </div>

      <Card className="glass rounded-2xl p-5">
        <h2 className="font-semibold text-lg">RBAC Matrix</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/50 text-left text-muted-foreground">
                <th className="py-2 pr-3">Permission</th>
                <th className="py-2 pr-3">Admin</th>
                <th className="py-2 pr-3">Moderator</th>
                <th className="py-2">User</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-border/30">
                <td className="py-3 pr-3">View all users</td>
                <td className="py-3 pr-3"><Badge>Allowed</Badge></td>
                <td className="py-3 pr-3"><Badge variant="secondary">Optional</Badge></td>
                <td className="py-3"><Badge variant="outline">Denied</Badge></td>
              </tr>
              <tr className="border-b border-border/30">
                <td className="py-3 pr-3">Manage reports</td>
                <td className="py-3 pr-3"><Badge>Allowed</Badge></td>
                <td className="py-3 pr-3"><Badge variant="secondary">Optional</Badge></td>
                <td className="py-3"><Badge variant="outline">Own only</Badge></td>
              </tr>
              <tr className="border-b border-border/30">
                <td className="py-3 pr-3">Moderate challenges</td>
                <td className="py-3 pr-3"><Badge>Allowed</Badge></td>
                <td className="py-3 pr-3"><Badge variant="outline">Denied</Badge></td>
                <td className="py-3"><Badge variant="outline">Denied</Badge></td>
              </tr>
              <tr>
                <td className="py-3 pr-3">Export analytics data</td>
                <td className="py-3 pr-3"><Badge>Allowed</Badge></td>
                <td className="py-3 pr-3"><Badge variant="outline">Denied</Badge></td>
                <td className="py-3"><Badge variant="outline">Denied</Badge></td>
              </tr>
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
