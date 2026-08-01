'use client';

import { useMemo, useState } from 'react';
import { toast } from 'sonner';
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

type ReportRow = {
  id: string;
  period: 'daily' | 'weekly' | 'monthly';
  total_co2_kg: number;
  impact_score: number;
  status: 'pending' | 'approved' | 'rejected';
  summary: string;
  created_at: string;
  user: {
    display_name: string | null;
    email: string | null;
  } | null;
};

function toCsv(rows: ReportRow[]) {
  const headers = ['created_at', 'user', 'email', 'period', 'status', 'impact_score', 'total_co2_kg'];
  const content = rows.map((r) => [
    r.created_at,
    r.user?.display_name ?? '',
    r.user?.email ?? '',
    r.period,
    r.status,
    r.impact_score,
    r.total_co2_kg,
  ]);

  return [headers, ...content]
    .map((line) => line.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(','))
    .join('\n');
}

export function ReportTable({ initialReports }: { initialReports: ReportRow[] }) {
  const [reports, setReports] = useState(initialReports);
  const [query, setQuery] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q) return reports;
    return reports.filter((r) => {
      return (
        r.period.toLowerCase().includes(q) ||
        r.status.toLowerCase().includes(q) ||
        (r.user?.display_name ?? '').toLowerCase().includes(q) ||
        (r.user?.email ?? '').toLowerCase().includes(q)
      );
    });
  }, [reports, query]);

  const updateStatus = async (id: string, status: ReportRow['status']) => {
    setBusyId(id);
    const { error } = await supabase.from('reports').update({ status }).eq('id', id);
    if (error) {
      toast.error(error.message);
    } else {
      setReports((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)));
      toast.success(`Report ${status}`);
    }
    setBusyId(null);
  };

  const deleteReport = async (id: string) => {
    setBusyId(id);
    const { error } = await supabase.from('reports').delete().eq('id', id);
    if (error) {
      toast.error(error.message);
    } else {
      setReports((prev) => prev.filter((r) => r.id !== id));
      toast.success('Report deleted');
    }
    setBusyId(null);
  };

  const exportCsv = () => {
    const csv = toCsv(filtered);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'admin-reports.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3 items-center justify-between">
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search reports by user, status, or period"
          className="max-w-md"
        />
        <Button variant="outline" onClick={exportCsv}>Export CSV</Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>User</TableHead>
            <TableHead>Period</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Impact</TableHead>
            <TableHead>Total CO2</TableHead>
            <TableHead>Created</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filtered.map((report) => {
            const busy = busyId === report.id;
            return (
              <TableRow key={report.id}>
                <TableCell>
                  <p className="font-medium leading-none">{report.user?.display_name ?? 'Unknown user'}</p>
                  <p className="text-xs text-muted-foreground mt-1">{report.user?.email ?? 'No email'}</p>
                </TableCell>
                <TableCell className="capitalize">{report.period}</TableCell>
                <TableCell>
                  <Badge
                    variant={
                      report.status === 'approved'
                        ? 'default'
                        : report.status === 'rejected'
                        ? 'destructive'
                        : 'secondary'
                    }
                  >
                    {report.status}
                  </Badge>
                </TableCell>
                <TableCell>{Math.round(report.impact_score)}</TableCell>
                <TableCell>{Math.round(report.total_co2_kg * 10) / 10} kg</TableCell>
                <TableCell>{new Date(report.created_at).toLocaleDateString()}</TableCell>
                <TableCell>
                  <div className="flex gap-2 justify-end flex-wrap">
                    <Button size="sm" variant="outline" disabled={busy} onClick={() => updateStatus(report.id, 'approved')}>
                      Approve
                    </Button>
                    <Button size="sm" variant="outline" disabled={busy} onClick={() => updateStatus(report.id, 'rejected')}>
                      Reject
                    </Button>
                    <Button size="sm" variant="destructive" disabled={busy} onClick={() => deleteReport(report.id)}>
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
