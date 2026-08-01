'use client';

import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { supabase } from '@/lib/supabase';

type UserRow = {
  id: string;
  display_name: string | null;
  email: string | null;
  avatar_url: string | null;
  role: 'user' | 'moderator' | 'admin';
  is_suspended: boolean;
  sustainability_index: number;
  level: number;
  goalsCount: number;
  reportsCount: number;
  created_at: string;
};

function toCsv(rows: UserRow[]) {
  const headers = ['name', 'email', 'role', 'sustainability_index', 'level', 'goals', 'reports', 'joined'];
  const content = rows.map((r) => [
    r.display_name ?? '',
    r.email ?? '',
    r.role,
    r.sustainability_index,
    r.level,
    r.goalsCount,
    r.reportsCount,
    new Date(r.created_at).toISOString().slice(0, 10),
  ]);

  return [headers, ...content]
    .map((line) => line.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(','))
    .join('\n');
}

export function UserTable({ initialUsers }: { initialUsers: UserRow[] }) {
  const [users, setUsers] = useState<UserRow[]>(initialUsers);
  const [query, setQuery] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q) return users;
    return users.filter((u) => {
      return (
        (u.display_name ?? '').toLowerCase().includes(q) ||
        (u.email ?? '').toLowerCase().includes(q) ||
        u.role.toLowerCase().includes(q)
      );
    });
  }, [users, query]);

  const updateUser = async (id: string, updates: Partial<UserRow>) => {
    setBusyId(id);
    const { error } = await supabase.from('profiles').update(updates).eq('id', id);
    if (error) {
      toast.error(error.message);
    } else {
      setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, ...updates } as UserRow : u)));
      toast.success('User updated');
    }
    setBusyId(null);
  };

  const deleteUserProfile = async (id: string) => {
    setBusyId(id);
    const { error } = await supabase.from('profiles').delete().eq('id', id);
    if (error) {
      toast.error(error.message);
    } else {
      setUsers((prev) => prev.filter((u) => u.id !== id));
      toast.success('User profile deleted');
    }
    setBusyId(null);
  };

  const resetPassword = async (email: string | null, id: string) => {
    if (!email) {
      toast.error('No email stored for this user');
      return;
    }

    setBusyId(id);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/login`,
    });

    if (error) {
      toast.error(error.message);
    } else {
      toast.success(`Password reset email sent to ${email}`);
    }
    setBusyId(null);
  };

  const exportCsv = () => {
    const csv = toCsv(filtered);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'admin-users.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3 items-center justify-between">
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search users by name, email, or role"
          className="max-w-md"
        />
        <Button variant="outline" onClick={exportCsv}>Export CSV</Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>User</TableHead>
            <TableHead>Carbon Score</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Stats</TableHead>
            <TableHead>Joined</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filtered.map((user) => {
            const initials = (user.display_name ?? 'U')
              .split(' ')
              .map((x) => x[0])
              .slice(0, 2)
              .join('')
              .toUpperCase();
            const busy = busyId === user.id;

            return (
              <TableRow key={user.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarFallback>{initials}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium leading-none">{user.display_name ?? 'Unnamed user'}</p>
                      <p className="text-xs text-muted-foreground mt-1">{user.email ?? 'No email'}</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell>{Math.round(user.sustainability_index)}/100</TableCell>
                <TableCell>
                  <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>{user.role}</Badge>
                  {user.is_suspended ? <Badge className="ml-2" variant="destructive">Suspended</Badge> : null}
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  <p>Level {user.level}</p>
                  <p>{user.goalsCount} goals • {user.reportsCount} reports</p>
                </TableCell>
                <TableCell>{new Date(user.created_at).getFullYear()}</TableCell>
                <TableCell>
                  <div className="flex gap-2 justify-end flex-wrap">
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={busy || user.role === 'admin'}
                      onClick={() => updateUser(user.id, { role: 'admin' })}
                    >
                      Make Admin
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={busy}
                      onClick={() => updateUser(user.id, { is_suspended: !user.is_suspended })}
                    >
                      {user.is_suspended ? 'Unsuspend' : 'Suspend'}
                    </Button>
                    <Button size="sm" variant="outline" disabled={busy} onClick={() => resetPassword(user.email, user.id)}>
                      Reset Password
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      disabled={busy}
                      onClick={() => deleteUserProfile(user.id)}
                    >
                      Delete
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
