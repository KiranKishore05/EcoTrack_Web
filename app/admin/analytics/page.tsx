import { AnalyticsChart } from '@/components/AnalyticsChart';
import { StatsCards } from '@/components/StatsCards';
import { requireAdmin } from '@/lib/admin';

function monthLabel(date: Date) {
  return date.toLocaleString('en-US', { month: 'short' });
}

export default async function AdminAnalyticsPage() {
  const { supabase } = await requireAdmin();

  const [profilesRes, reportsRes, activitiesRes, goalsRes] = await Promise.all([
    supabase.from('profiles').select('id, created_at'),
    supabase.from('reports').select('id, created_at, total_co2_kg'),
    supabase.from('activities').select('id, created_at, category, co2_kg'),
    supabase.from('goals').select('id, created_at, status'),
  ]);

  const profiles = profilesRes.data ?? [];
  const reports = reportsRes.data ?? [];
  const activities = activitiesRes.data ?? [];
  const goals = goalsRes.data ?? [];

  const now = new Date();
  const monthBuckets: Array<{ start: Date; key: string; label: string }> = [];
  for (let i = 5; i >= 0; i -= 1) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    monthBuckets.push({
      start: d,
      key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
      label: monthLabel(d),
    });
  }

  const timeline = monthBuckets.map((bucket) => {
    const monthKey = bucket.key;
    const users = profiles.filter((p) => p.created_at.slice(0, 7) <= monthKey).length;
    const monthReports = reports.filter((r) => r.created_at.slice(0, 7) === monthKey);
    const monthGoalsCompleted = goals.filter(
      (g) => g.created_at.slice(0, 7) === monthKey && g.status === 'completed'
    ).length;

    return {
      label: bucket.label,
      users,
      reports: monthReports.length,
      co2: monthReports.reduce((sum, r) => sum + Number(r.total_co2_kg ?? 0), 0),
      goalsCompleted: monthGoalsCompleted,
    };
  });

  const categoryMap = new Map<string, number>();
  for (const item of activities) {
    const key = String(item.category ?? 'other');
    categoryMap.set(key, (categoryMap.get(key) ?? 0) + 1);
  }

  const categoryData = Array.from(categoryMap.entries())
    .map(([category, count]) => ({ category, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  const totalUsers = profiles.length;
  const totalReports = reports.length;
  const totalChallenges = (await supabase.from('challenges').select('id', { count: 'exact', head: true })).count ?? 0;
  const totalCo2Saved = reports.reduce((sum, r) => sum + Number(r.total_co2_kg ?? 0), 0) / 1000;

  const dauCutoff = new Date();
  dauCutoff.setDate(dauCutoff.getDate() - 1);
  const dailyActiveUsers = new Set(
    activities
      .filter((a) => new Date(a.created_at) >= dauCutoff)
      .map((a) => String((a as { user_id?: string }).user_id ?? ''))
      .filter(Boolean)
  ).size;

  const goalCompletionRate = goals.length > 0
    ? Math.round((goals.filter((g) => g.status === 'completed').length / goals.length) * 100)
    : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Analytics</h1>
        <p className="text-muted-foreground mt-1">Platform-level user, report, and impact analytics.</p>
      </div>

      <StatsCards
        items={[
          { label: 'Users', value: totalUsers.toLocaleString(), hint: `${dailyActiveUsers} daily active`, tone: 'positive' },
          { label: 'Reports', value: totalReports.toLocaleString(), hint: 'Total generated' },
          { label: 'Challenges', value: totalChallenges.toLocaleString(), hint: 'Community campaigns' },
          { label: 'CO2 Saved', value: `${totalCo2Saved.toFixed(1)} tons`, hint: `${goalCompletionRate}% goal completion` },
        ]}
      />

      <AnalyticsChart timeline={timeline} categoryData={categoryData} />
    </div>
  );
}
