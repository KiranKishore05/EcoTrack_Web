import { ReportTable } from '@/components/ReportTable';
import { requireAdmin } from '@/lib/admin';

type ReportRow = {
  id: string;
  period: 'daily' | 'weekly' | 'monthly';
  total_co2_kg: number;
  impact_score: number;
  status: 'pending' | 'approved' | 'rejected';
  summary: string;
  created_at: string;
  profiles: {
    display_name: string | null;
    email: string | null;
  } | {
    display_name: string | null;
    email: string | null;
  }[] | null;
};

export default async function AdminReportsPage() {
  const { supabase } = await requireAdmin();

  const { data } = await supabase
    .from('reports')
    .select('id, period, total_co2_kg, impact_score, status, summary, created_at, profiles!reports_user_id_fkey(display_name, email)')
    .order('created_at', { ascending: false })
    .limit(200);

  const rows = ((data ?? []) as ReportRow[]).map((report) => {
    const profile = Array.isArray(report.profiles) ? report.profiles[0] : report.profiles;
    return {
      id: report.id,
      period: report.period,
      total_co2_kg: report.total_co2_kg,
      impact_score: report.impact_score,
      status: report.status,
      summary: report.summary,
      created_at: report.created_at,
      user: profile
        ? {
            display_name: profile.display_name,
            email: profile.email,
          }
        : null,
    };
  });

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Reports</h1>
        <p className="text-muted-foreground mt-1">Moderate generated reports and export datasets.</p>
      </div>
      <ReportTable initialReports={rows} />
    </div>
  );
}
